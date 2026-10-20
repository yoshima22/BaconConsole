use std::{fs, path::PathBuf};
use baconconsole::steam_library::discover_installed_games;

fn root() -> PathBuf { let root=std::env::temp_dir().join(format!("baconconsole-steam-{}",std::process::id())); let apps=root.join("steamapps"); fs::create_dir_all(apps.join("common/Chrono")).unwrap(); fs::write(apps.join("libraryfolders.vdf"), r#""libraryfolders" { "0" { "path" "ROOT" } }"#).unwrap(); fs::write(apps.join("appmanifest_42.acf"), r#""AppState" { "appid" "42" "name" "Chrono" "installdir" "Chrono" }"#).unwrap(); root }

#[test]
fn discovers_a_valid_installed_manifest() { let root=root(); let games=discover_installed_games(&root).unwrap(); assert_eq!(games[0].app_id,42); assert_eq!(games[0].title,"Chrono"); }
