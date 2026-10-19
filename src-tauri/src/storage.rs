use std::{fs, io::{Read, Write}, path::Path};
use sha2::{Digest, Sha256};
use crate::disc::{load_manifest, validate_relative_path, DiscError};

pub fn verify_manifest_files(root: &Path) -> Result<u64, DiscError> {
    let manifest = load_manifest(root)?; let mut total = 0;
    for file in manifest.files { let path = root.join(validate_relative_path(&file.path)?); let mut input = fs::File::open(&path)?; let mut hash = Sha256::new(); let mut buf = [0; 8192]; loop { let count = input.read(&mut buf)?; if count == 0 { break; } total += count as u64; hash.update(&buf[..count]); }
        if format!("{:x}", hash.finalize()) != file.sha256.to_lowercase() { return Err(DiscError::UnsupportedPackage); }
    } Ok(total)
}

pub fn copy_verified(root: &Path, destination: &Path) -> Result<u64, DiscError> {
    let manifest = load_manifest(root)?; let root = root.canonicalize()?; let destination = destination.canonicalize().unwrap_or_else(|_| destination.to_path_buf()); if destination.starts_with(&root) { return Err(DiscError::UnsafePath); }
    verify_manifest_files(&root)?; let mut copied = 0;
    for file in manifest.files { let relative = validate_relative_path(&file.path)?; let source = root.join(&relative); let target = destination.join(&relative); if let Some(parent) = target.parent() { fs::create_dir_all(parent)?; } copied += fs::copy(source, target)?; }
    Ok(copied)
}
