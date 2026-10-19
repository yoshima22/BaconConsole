use std::{fs, io::{Read, Write}, path::Path, sync::{Arc, atomic::{AtomicBool, Ordering}}};
use sha2::{Digest, Sha256};
use thiserror::Error;
use crate::disc::{load_manifest, validate_relative_path, DiscError};

#[derive(Debug, Error)]
pub enum CopyError {
    #[error(transparent)] Disc(#[from] DiscError),
    #[error(transparent)] Io(#[from] std::io::Error),
    #[error("destination is unsafe")] UnsafeDestination,
    #[error("insufficient space: {available} bytes available, {required} required")] InsufficientSpace { required: u64, available: u64 },
    #[error("copy was cancelled")] Cancelled,
}

#[derive(Clone)]
pub struct CopyOptions { available_space: Option<u64>, cancel: Option<Arc<AtomicBool>> }
impl CopyOptions {
    pub fn unlimited() -> Self { Self { available_space: None, cancel: None } }
    pub fn with_available_space(available_space: u64) -> Self { Self { available_space: Some(available_space), cancel: None } }
    pub fn with_cancel(cancel: Arc<AtomicBool>) -> Self { Self { available_space: None, cancel: Some(cancel) } }
    pub fn with_available_space_and_cancel(available_space: u64, cancel: Arc<AtomicBool>) -> Self { Self { available_space: Some(available_space), cancel: Some(cancel) } }
    fn is_cancelled(&self) -> bool { self.cancel.as_ref().is_some_and(|flag| flag.load(Ordering::Relaxed)) }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CopyProgress { pub copied_bytes: u64, pub total_bytes: u64, pub completed_files: usize, pub file_count: usize }

pub fn verify_manifest_files(root: &Path) -> Result<u64, DiscError> {
    let manifest = load_manifest(root)?; let mut total = 0;
    for file in manifest.files { let path = root.join(validate_relative_path(&file.path)?); let mut input = fs::File::open(&path)?; let mut hash = Sha256::new(); let mut buf = [0; 8192]; loop { let count = input.read(&mut buf)?; if count == 0 { break; } total += count as u64; hash.update(&buf[..count]); }
        if format!("{:x}", hash.finalize()) != file.sha256.to_lowercase() { return Err(DiscError::UnsupportedPackage); }
    } Ok(total)
}

pub fn copy_verified(root: &Path, destination: &Path) -> Result<u64, DiscError> {
    copy_verified_with(root, destination, CopyOptions::unlimited(), |_| {}).map_err(|error| match error { CopyError::Disc(disc) => disc, CopyError::Io(error) => DiscError::Io(error), CopyError::UnsafeDestination => DiscError::UnsafePath, CopyError::InsufficientSpace { .. } | CopyError::Cancelled => DiscError::UnsupportedPackage })
}

pub fn copy_verified_with<F>(root: &Path, destination: &Path, options: CopyOptions, mut on_progress: F) -> Result<u64, CopyError>
where F: FnMut(CopyProgress) {
    let manifest = load_manifest(root)?;
    let root = root.canonicalize()?;
    let destination = canonicalize_planned_destination(destination)?;
    if destination.starts_with(&root) { return Err(CopyError::UnsafeDestination); }
    let total_bytes = manifest.files.iter().try_fold(0_u64, |total, file| Ok::<_, CopyError>(total + fs::metadata(root.join(validate_relative_path(&file.path)?))?.len()))?;
    if let Some(available) = options.available_space { if available < total_bytes { return Err(CopyError::InsufficientSpace { required: total_bytes, available }); } }
    verify_manifest_files(&root)?;
    let file_count = manifest.files.len();
    let mut copied = 0_u64;
    let mut completed_files = 0_usize;
    let mut made_targets = Vec::new();
    for file in manifest.files {
        if options.is_cancelled() { cleanup(&made_targets); return Err(CopyError::Cancelled); }
        let relative = validate_relative_path(&file.path)?;
        let source = root.join(&relative);
        let target = destination.join(&relative);
        if let Some(parent) = target.parent() { fs::create_dir_all(parent)?; }
        let mut input = fs::File::open(source)?;
        let mut output = fs::File::create(&target)?;
        made_targets.push(target.clone());
        let mut buf = [0; 8192];
        loop {
            if options.is_cancelled() { drop(output); cleanup(&made_targets); return Err(CopyError::Cancelled); }
            let count = input.read(&mut buf)?;
            if count == 0 { break; }
            output.write_all(&buf[..count])?;
            copied += count as u64;
            on_progress(CopyProgress { copied_bytes: copied, total_bytes, completed_files, file_count });
        }
        completed_files += 1;
        on_progress(CopyProgress { copied_bytes: copied, total_bytes, completed_files, file_count });
    }
    Ok(copied)
}

fn cleanup(targets: &[std::path::PathBuf]) { for target in targets.iter().rev() { let _ = fs::remove_file(target); } }

fn canonicalize_planned_destination(destination: &Path) -> Result<std::path::PathBuf, std::io::Error> {
    let mut missing = Vec::new();
    let mut existing = destination;
    while !existing.exists() {
        let name = existing.file_name().ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "destination has no existing ancestor"))?;
        missing.push(name.to_owned());
        existing = existing.parent().ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "destination has no existing ancestor"))?;
    }
    let mut resolved = existing.canonicalize()?;
    for segment in missing.iter().rev() { resolved.push(segment); }
    Ok(resolved)
}

pub fn available_space(destination: &Path) -> Result<u64, std::io::Error> {
    let ancestor = canonicalize_planned_destination(destination)?;
    fs2::available_space(ancestor.parent().unwrap_or(&ancestor))
}
