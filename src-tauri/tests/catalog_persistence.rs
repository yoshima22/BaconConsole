use std::fs;
use baconconsole::catalog::{Catalog, InstallationInput};

fn temp_root(name: &str) -> std::path::PathBuf { let root = std::env::temp_dir().join(format!("baconconsole-catalog-{name}-{}", std::process::id())); let _ = fs::create_dir_all(&root); root }

#[test]
fn creates_guest_and_preserves_distinct_same_title_games() {
    let root = temp_root("identity"); let catalog = Catalog::open(&root).unwrap();
    assert_eq!(catalog.active_user().unwrap().name, "Convidado");
    catalog.upsert_installation(InstallationInput::new("manual:a", "Chrono", "windows", "portable", "C:/a.exe", false)).unwrap();
    catalog.upsert_installation(InstallationInput::new("manual:b", "Chrono", "windows", "portable", "C:/b.exe", false)).unwrap();
    assert_eq!(catalog.list_games().unwrap().len(), 2);
}

#[test]
fn aggregates_installations_with_the_same_identity() {
    let root = temp_root("aggregate"); let catalog = Catalog::open(&root).unwrap();
    catalog.upsert_installation(InstallationInput::new("bacondisc:demo", "Demo", "windows", "disc", "C:/disc", true)).unwrap();
    catalog.upsert_installation(InstallationInput::new("bacondisc:demo", "Demo", "windows", "ssd", "C:/ssd", false)).unwrap();
    let games = catalog.list_games().unwrap(); assert_eq!(games.len(), 1); assert_eq!(games[0].installations.len(), 2);
}

#[test]
fn imports_legacy_json_only_once() {
    let root = temp_root("legacy"); fs::write(root.join("library.json"), r#"[{"id":"legacy","title":"Legacy","installPath":"C:/Legacy","installKind":"permanent","requiresDisc":false}]"#).unwrap();
    let first = Catalog::open(&root).unwrap(); assert_eq!(first.list_games().unwrap().len(), 1); drop(first);
    fs::write(root.join("library.json"), "[]").unwrap(); let second = Catalog::open(&root).unwrap(); assert_eq!(second.list_games().unwrap().len(), 1);
}

#[test]
fn persists_a_local_import_profile_and_reimports_without_duplicates() {
    let root = temp_root("local-import");
    let catalog = Catalog::open(&root).unwrap();
    let input = InstallationInput::local_import(
        "local:ps1:c:/games/chrono.cue",
        "chrono",
        "ps1",
        "C:/Games/chrono.cue",
        "duckstation",
    );

    catalog.upsert_installation(input.clone()).unwrap();
    catalog.upsert_installation(input).unwrap();

    let games = catalog.list_games().unwrap();
    assert_eq!(games.len(), 1);
    assert_eq!(games[0].installations.len(), 1);
    assert_eq!(games[0].installations[0].source, "local-import");
    assert_eq!(games[0].installations[0].emulator_profile_id.as_deref(), Some("duckstation"));
}
