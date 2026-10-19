use std::path::{Component, Path, PathBuf};

use serde::Deserialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DiscError {
    #[error("manifest paths must be relative and contained")]
    UnsafePath,
    #[error("unsupported BaconDisc package")]
    UnsupportedPackage,
    #[error("invalid manifest: {0}")]
    Manifest(#[from] serde_json::Error),
    #[error("filesystem error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BaconManifest {
    pub schema_version: u32,
    pub id: String,
    pub title: String,
    pub platform: String,
    pub package_type: String,
    pub entry_point: String,
    pub files: Vec<ManifestFile>,
    pub modes: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct ManifestFile { pub path: String, pub sha256: String }

pub fn validate_relative_path(value: &str) -> Result<PathBuf, DiscError> {
    let path = Path::new(value);
    if path.is_absolute() || value.contains(':') || path.components().any(|part| matches!(part, Component::ParentDir | Component::RootDir | Component::Prefix(_))) { return Err(DiscError::UnsafePath); }
    Ok(path.to_path_buf())
}

pub fn load_manifest(root: &Path) -> Result<BaconManifest, DiscError> {
    let manifest: BaconManifest = serde_json::from_str(&std::fs::read_to_string(root.join("bacon.json"))?)?;
    if manifest.schema_version != 1 || manifest.platform != "windows" || manifest.package_type != "portable" { return Err(DiscError::UnsupportedPackage); }
    validate_relative_path(&manifest.entry_point)?;
    for file in &manifest.files { validate_relative_path(&file.path)?; if file.sha256.len() != 64 || !file.sha256.bytes().all(|byte| byte.is_ascii_hexdigit()) { return Err(DiscError::UnsupportedPackage); } }
    Ok(manifest)
}
