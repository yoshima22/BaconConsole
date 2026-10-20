use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};
use baconconsole::{emulators::Platform, local_library::scan_authorized_media};

struct TempTree(PathBuf);
impl TempTree {
    fn new() -> Self {
        let nonce = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let path = std::env::temp_dir().join(format!("baconconsole-local-library-{nonce}"));
        fs::create_dir_all(&path).unwrap();
        Self(path)
    }
    fn file(&self, relative: &str) {
        let path = self.0.join(relative);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, b"authorized test media").unwrap();
    }
}
impl Drop for TempTree { fn drop(&mut self) { let _ = fs::remove_dir_all(&self.0); } }

#[test]
fn scans_only_supported_ps1_entry_media_in_nested_folders() {
    let tree = TempTree::new();
    tree.file("Chrono/chrono.cue");
    tree.file("Chrono/chrono.bin");
    tree.file("Other/game.chd");
    tree.file("Other/readme.txt");

    let media = scan_authorized_media(&tree.0, Platform::Ps1).unwrap();

    assert_eq!(media.iter().map(|item| item.title.as_str()).collect::<Vec<_>>(), vec!["chrono", "game"]);
    assert!(media.iter().all(|item| item.path.extension().unwrap() != "bin"));
}

#[test]
fn accepts_gba_media_and_rejects_a_folder_without_supported_files() {
    let tree = TempTree::new();
    tree.file("portable/game.gba");

    let media = scan_authorized_media(&tree.0, Platform::Gba).unwrap();
    assert_eq!(media.len(), 1);
    assert_eq!(media[0].title, "game");

    let empty = TempTree::new();
    empty.file("readme.txt");
    assert!(scan_authorized_media(&empty.0, Platform::Gba).is_err());
}

#[test]
fn rejects_an_absent_or_non_directory_root() {
    let tree = TempTree::new();
    let missing = tree.0.join("missing");
    assert!(scan_authorized_media(&missing, Platform::Nes).is_err());

    tree.file("single.nes");
    assert!(scan_authorized_media(&tree.0.join("single.nes"), Platform::Nes).is_err());
}
