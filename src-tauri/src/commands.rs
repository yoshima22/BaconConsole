use std::path::PathBuf;
use serde::Serialize;
use baconconsole::{disc::{load_manifest, BaconManifest}, storage::{copy_verified, verify_manifest_files}};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscSummary { pub id: String, pub title: String, pub entry_point: String, pub modes: Vec<String>, pub file_count: usize }
impl From<BaconManifest> for DiscSummary { fn from(value: BaconManifest) -> Self { Self { id:value.id, title:value.title, entry_point:value.entry_point, modes:value.modes, file_count:value.files.len() } } }
#[tauri::command] pub fn inspect_simulated_disc(root: String) -> Result<DiscSummary, String> { load_manifest(&PathBuf::from(root)).map(Into::into).map_err(|e| e.to_string()) }
#[tauri::command] pub fn verify_simulated_disc(root: String) -> Result<u64, String> { verify_manifest_files(&PathBuf::from(root)).map_err(|e| e.to_string()) }
#[tauri::command] pub fn copy_simulated_disc(root: String, destination: String) -> Result<u64, String> { copy_verified(&PathBuf::from(root), &PathBuf::from(destination)).map_err(|e| e.to_string()) }
