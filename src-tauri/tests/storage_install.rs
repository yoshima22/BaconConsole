use std::{fs, path::PathBuf, sync::{Arc, atomic::AtomicBool}, time::{SystemTime, UNIX_EPOCH}};

use baconconsole::{
    disc::manifest_total_bytes,
    library::{register_install, LibraryRecord},
    storage::{copy_verified_with, CopyError, CopyOptions},
};

fn sandbox(name: &str) -> PathBuf {
    let nonce = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
    let path = std::env::temp_dir().join(format!("baconconsole-{name}-{nonce}"));
    fs::create_dir_all(&path).unwrap();
    path
}

fn write_manifest(root: &std::path::Path, files: &str) {
    fs::write(root.join("bacon.json"), format!(r#"{{"schemaVersion":1,"id":"demo","title":"Demo","platform":"windows","packageType":"portable","entryPoint":"Game/demo.exe","files":{files},"modes":["copy-to-storage"]}}"#)).unwrap();
}

#[test]
fn reports_zero_bytes_for_manifest_without_files() {
    let root = sandbox("empty");
    write_manifest(&root, "[]");

    assert_eq!(manifest_total_bytes(&root).unwrap(), 0);

    fs::remove_dir_all(root).unwrap();
}

#[test]
fn rejects_destination_nested_under_media_even_when_missing() {
    let root = sandbox("nested-destination");
    write_manifest(&root, "[]");
    let destination = root.join("new-output");

    let result = copy_verified_with(&root, &destination, CopyOptions::unlimited(), |_| {});

    assert!(matches!(result, Err(CopyError::UnsafeDestination)));
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn refuses_copy_before_writing_when_space_is_insufficient() {
    let root = sandbox("insufficient-space");
    fs::create_dir_all(root.join("Game")).unwrap();
    fs::write(root.join("Game/demo.exe"), b"1234").unwrap();
    write_manifest(&root, r#"[{"path":"Game/demo.exe","sha256":"03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"}]"#);
    let destination = sandbox("destination");

    let result = copy_verified_with(&root, &destination, CopyOptions::with_available_space(3), |_| {});

    assert!(matches!(result, Err(CopyError::InsufficientSpace { required: 4, available: 3 })));
    assert!(!destination.join("Game/demo.exe").exists());
    fs::remove_dir_all(root).unwrap();
    fs::remove_dir_all(destination).unwrap();
}

#[test]
fn cancelled_copy_removes_partial_output_before_library_registration() {
    let root = sandbox("cancelled-copy");
    fs::create_dir_all(root.join("Game")).unwrap();
    fs::write(root.join("Game/demo.exe"), b"1234").unwrap();
    write_manifest(&root, r#"[{"path":"Game/demo.exe","sha256":"03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"}]"#);
    let destination = sandbox("cancelled-destination");
    let cancellation = Arc::new(AtomicBool::new(true));

    let result = copy_verified_with(&root, &destination, CopyOptions::with_cancel(cancellation), |_| {});

    assert!(matches!(result, Err(CopyError::Cancelled)));
    assert!(!destination.join("Game/demo.exe").exists());
    fs::remove_dir_all(root).unwrap();
    fs::remove_dir_all(destination).unwrap();
}

#[test]
fn registers_successful_permanent_installation() {
    let library_root = sandbox("library");
    let record = LibraryRecord::permanent("demo", "Demo", "C:/Games/Demo", true);

    register_install(&library_root, record).unwrap();

    let records = baconconsole::library::list_installs(&library_root).unwrap();
    assert_eq!(records.len(), 1);
    assert_eq!(records[0].id, "demo");
    assert_eq!(records[0].install_kind, "permanent");
    fs::remove_dir_all(library_root).unwrap();
}
