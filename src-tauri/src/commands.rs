use std::{collections::HashMap, path::PathBuf, sync::{Arc, Mutex, atomic::AtomicBool}};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};
use baconconsole::{disc::{load_manifest, manifest_total_bytes, BaconManifest}, library::{list_installs, register_install, LibraryRecord}, storage::{available_space, copy_verified_with, verify_manifest_files, CopyOptions, CopyProgress}};

pub struct CopyJobs(pub Mutex<HashMap<String, Arc<AtomicBool>>>);
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscSummary { pub id: String, pub title: String, pub platform: String, pub package_type: String, pub entry_point: String, pub modes: Vec<String>, pub file_count: usize, pub total_bytes: u64 }
impl TryFrom<(BaconManifest, PathBuf)> for DiscSummary { type Error = String; fn try_from((value, root): (BaconManifest, PathBuf)) -> Result<Self, Self::Error> { let total_bytes = manifest_total_bytes(&root).map_err(|error| error.to_string())?; Ok(Self { id:value.id, title:value.title, platform:value.platform, package_type:value.package_type, entry_point:value.entry_point, modes:value.modes, file_count:value.files.len(), total_bytes }) } }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageTarget { pub kind: String, pub root: String, pub available_bytes: u64 }
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CopyProgressEvent { pub job_id: String, pub copied_bytes: u64, pub total_bytes: u64, pub completed_files: usize, pub file_count: usize }
impl CopyProgressEvent { fn from_progress(job_id: String, progress: CopyProgress) -> Self { Self { job_id, copied_bytes: progress.copied_bytes, total_bytes: progress.total_bytes, completed_files: progress.completed_files, file_count: progress.file_count } } }

#[tauri::command] pub fn inspect_simulated_disc(root: String) -> Result<DiscSummary, String> { let root = PathBuf::from(root); load_manifest(&root).map_err(|error| error.to_string()).and_then(|manifest| DiscSummary::try_from((manifest, root))) }
#[tauri::command] pub fn verify_simulated_disc(root: String) -> Result<u64, String> { verify_manifest_files(&PathBuf::from(root)).map_err(|error| error.to_string()) }
#[tauri::command] pub fn copy_simulated_disc(root: String, destination: String) -> Result<u64, String> { baconconsole::storage::copy_verified(&PathBuf::from(root), &PathBuf::from(destination)).map_err(|error| error.to_string()) }
#[tauri::command] pub fn get_storage_targets(app: AppHandle) -> Result<Vec<StorageTarget>, String> { let root = app.path().app_data_dir().map_err(|error| error.to_string())?.join("storage"); std::fs::create_dir_all(&root).map_err(|error| error.to_string())?; let available_bytes = available_space(&root).map_err(|error| error.to_string())?; Ok(vec![StorageTarget { kind: "ssd".into(), root: root.to_string_lossy().to_string(), available_bytes }]) }
#[tauri::command] pub fn start_verified_copy(app: AppHandle, jobs: State<CopyJobs>, job_id: String, root: String, destination: String, target_kind: String) -> Result<u64, String> {
    let flag = Arc::new(AtomicBool::new(false)); jobs.0.lock().map_err(|_| "copy job state unavailable".to_string())?.insert(job_id.clone(), flag.clone());
    let destination_path = PathBuf::from(&destination); let available = available_space(&destination_path).map_err(|error| error.to_string())?;
    let result = copy_verified_with(&PathBuf::from(&root), &destination_path, CopyOptions::with_available_space_and_cancel(available, flag), |progress| { let _ = app.emit("bacondisc-copy-progress", CopyProgressEvent::from_progress(job_id.clone(), progress)); }).map_err(|error| error.to_string());
    jobs.0.lock().map_err(|_| "copy job state unavailable".to_string())?.remove(&job_id); let copied = result?;
    if target_kind == "permanent" { let manifest = load_manifest(&PathBuf::from(root)).map_err(|error| error.to_string())?; let library_root = app.path().app_data_dir().map_err(|error| error.to_string())?.join("library"); register_install(&library_root, LibraryRecord::permanent(manifest.id, manifest.title, destination, true)).map_err(|error| error.to_string())?; }
    Ok(copied)
}
#[tauri::command] pub fn cancel_copy(jobs: State<CopyJobs>, job_id: String) -> Result<(), String> { if let Some(flag) = jobs.0.lock().map_err(|_| "copy job state unavailable".to_string())?.get(&job_id) { flag.store(true, std::sync::atomic::Ordering::Relaxed); } Ok(()) }
#[tauri::command] pub fn list_library_records(app: AppHandle) -> Result<Vec<LibraryRecord>, String> { let library_root = app.path().app_data_dir().map_err(|error| error.to_string())?.join("library"); list_installs(&library_root).map_err(|error| error.to_string()) }
