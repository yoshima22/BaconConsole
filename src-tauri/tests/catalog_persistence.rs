use std::fs;
use baconconsole::catalog::{Catalog, InstallationInput};
use baconconsole::steam_library::SteamInstall;

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

#[test]
fn returns_only_available_local_imports_for_catalog_launch() {
    let root = temp_root("launchable-local-import");
    let catalog = Catalog::open(&root).unwrap();
    catalog.upsert_installation(InstallationInput::local_import(
        "local:ps1:c:/games/chrono.cue", "chrono", "ps1", "C:/Games/chrono.cue", "duckstation",
    )).unwrap();
    let game = catalog.list_games().unwrap().remove(0);

    let installation = catalog.launchable_local_import(game.id, game.installations[0].id).unwrap().unwrap();

    assert_eq!(installation.emulator_profile_id.as_deref(), Some("duckstation"));
    assert!(catalog.launchable_local_import(game.id, game.installations[0].id + 99).unwrap().is_none());
}

#[test]
fn preserves_steam_availability_when_syncing() {
    let root = temp_root("steam-availability");
    let catalog = Catalog::open(&root).unwrap();
    catalog.upsert_steam_installs(&[SteamInstall { app_id: 42, title: "Chrono".into(), install_path: root.join("missing"), available: false }]).unwrap();
    let game = catalog.list_games().unwrap().remove(0);
    assert!(!game.installations[0].available);
    assert!(catalog.launchable_steam(game.id, game.installations[0].id).unwrap().is_none());
}

#[test]
fn returns_an_available_windows_application_for_launch() {
    let root = temp_root("windows-app");
    let catalog = Catalog::open(&root).unwrap();
    catalog.upsert_installation(InstallationInput::new("windows:c:/games/chrono.exe", "Chrono", "windows", "windows-app", "C:/Games/Chrono.exe", false)).unwrap();
    let game = catalog.list_games().unwrap().remove(0);
    assert_eq!(catalog.launchable_windows_application(game.id, game.installations[0].id).unwrap().unwrap().source, "windows-app");
}
