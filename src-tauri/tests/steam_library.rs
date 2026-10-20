use std::{fs, path::PathBuf};
use baconconsole::steam_library::discover_installed_games;

fn root() -> PathBuf { let root=std::env::temp_dir().join(format!("baconconsole-steam-{}",std::process::id())); let apps=root.join("steamapps"); fs::create_dir_all(apps.join("common/Chrono")).unwrap(); fs::write(apps.join("libraryfolders.vdf"), r#""libraryfolders" { "0" { "path" "ROOT" } }"#).unwrap(); fs::write(apps.join("appmanifest_42.acf"), r#""AppState" { "appid" "42" "name" "Chrono" "installdir" "Chrono" }"#).unwrap(); root }

#[test]
fn discovers_a_valid_installed_manifest() { let root=root(); let games=discover_installed_games(&root).unwrap(); assert_eq!(games[0].app_id,42); assert_eq!(games[0].title,"Chrono"); }

#[test]
fn discovers_manifests_from_an_additional_library_folder() {
    let root = root();
    let extra = root.join("ExtraLibrary");
    fs::create_dir_all(extra.join("steamapps/common/Orbit")).unwrap();
    fs::write(root.join("steamapps/libraryfolders.vdf"), format!(r#""libraryfolders" {{ "1" {{ "path" "{}" }} }}"#, extra.display())).unwrap();
    fs::write(extra.join("steamapps/appmanifest_77.acf"), r#""AppState" { "appid" "77" "name" "Orbit" "installdir" "Orbit" }"#).unwrap();

    let games = discover_installed_games(&root).unwrap();
    assert!(games.iter().any(|game| game.app_id == 77 && game.title == "Orbit"));
}
