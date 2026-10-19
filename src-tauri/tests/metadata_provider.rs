use std::{fs, path::PathBuf};
use baconconsole::metadata::{validate_artwork_url, ArtworkCache, SteamGridDbProvider};

fn root(name: &str) -> PathBuf { let root=std::env::temp_dir().join(format!("baconconsole-artwork-{name}-{}",std::process::id())); fs::create_dir_all(&root).unwrap(); root }

#[test]
fn returns_multiple_candidates_without_selecting_one() { let candidates=SteamGridDbProvider::parse_search_response(r#"{"success":true,"data":[{"id":1,"name":"Chrono Legends"},{"id":2,"name":"Chrono Legend Collection"}]}"#).unwrap(); assert_eq!(candidates.len(),2); assert_eq!(candidates[0].id,1); }
#[test]
fn rejects_non_https_and_local_artwork_urls() { assert!(validate_artwork_url("file:///C:/secret.png").is_err()); assert!(validate_artwork_url("https://127.0.0.1/art.png").is_err()); assert!(validate_artwork_url("https://cdn.steamgriddb.com/grid.png").is_ok()); }
#[test]
fn caches_png_by_hash_without_duplicate_writes() { let cache=ArtworkCache::new(&root("cache")).unwrap(); let first=cache.store("https://cdn.steamgriddb.com/a.png","image/png",b"image").unwrap(); let second=cache.store("https://cdn.steamgriddb.com/a.png","image/png",b"image").unwrap(); assert_eq!(first.hash,second.hash); assert_eq!(first.local_path,second.local_path); }
#[test]
fn rejects_unknown_mime_and_oversized_artwork() { let cache=ArtworkCache::new(&root("limits")).unwrap(); assert!(cache.store("https://cdn.steamgriddb.com/a.gif","image/gif",b"no").is_err()); assert!(cache.store("https://cdn.steamgriddb.com/a.png","image/png",&vec![0; 16*1024*1024+1]).is_err()); }
