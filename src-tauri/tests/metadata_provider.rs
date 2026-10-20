use std::{fs, io::Cursor, path::PathBuf};
use baconconsole::metadata::{read_artwork_limited, validate_artwork_url, classify_connection_status, IntegrationState, ArtworkCache, RetroAchievementsProvider, SteamGridDbProvider, MAX_ARTWORK_BYTES};

fn root(name: &str) -> PathBuf { let root=std::env::temp_dir().join(format!("baconconsole-artwork-{name}-{}",std::process::id())); fs::create_dir_all(&root).unwrap(); root }

#[test]
fn returns_multiple_candidates_without_selecting_one() { let candidates=SteamGridDbProvider::parse_search_response(r#"{"success":true,"data":[{"id":1,"name":"Chrono Legends"},{"id":2,"name":"Chrono Legend Collection"}]}"#).unwrap(); assert_eq!(candidates.len(),2); assert_eq!(candidates[0].id,1); }
#[test]
fn parses_artwork_options_for_manual_selection() { let options=SteamGridDbProvider::parse_artwork_response(r#"{"success":true,"data":[{"id":99,"url":"https://cdn.steamgriddb.com/grid/cover.png","thumb":"https://cdn.steamgriddb.com/thumb/cover.png"}]}"#).unwrap(); assert_eq!(options[0].id,99); assert!(options[0].url.contains("cover.png")); }
#[test]
fn rejects_non_https_and_local_artwork_urls() { assert!(validate_artwork_url("file:///C:/secret.png").is_err()); assert!(validate_artwork_url("https://127.0.0.1/art.png").is_err()); assert!(validate_artwork_url("https://cdn.steamgriddb.com/grid.png").is_ok()); }
#[test]
fn caches_png_by_hash_without_duplicate_writes() { let cache=ArtworkCache::new(&root("cache")).unwrap(); let first=cache.store("https://cdn.steamgriddb.com/a.png","image/png",b"image").unwrap(); let second=cache.store("https://cdn.steamgriddb.com/a.png","image/png",b"image").unwrap(); assert_eq!(first.hash,second.hash); assert_eq!(first.local_path,second.local_path); }
#[test]
fn rejects_unknown_mime_and_oversized_artwork() { let cache=ArtworkCache::new(&root("limits")).unwrap(); assert!(cache.store("https://cdn.steamgriddb.com/a.gif","image/gif",b"no").is_err()); assert!(cache.store("https://cdn.steamgriddb.com/a.png","image/png",&vec![0; 16*1024*1024+1]).is_err()); }
#[test]
fn stops_a_response_without_content_length_at_the_artwork_limit() { assert!(read_artwork_limited(Cursor::new(vec![0; MAX_ARTWORK_BYTES + 1])).is_err()); }
#[test]
fn classifies_unauthorized_and_rate_limited_connection_checks_as_sanitized_errors() { assert_eq!(classify_connection_status(reqwest::StatusCode::UNAUTHORIZED).state,IntegrationState::Error); assert_eq!(classify_connection_status(reqwest::StatusCode::TOO_MANY_REQUESTS).state,IntegrationState::Error); }
#[test]
fn parses_a_retroachievements_profile_without_exposing_credentials() { let profile=RetroAchievementsProvider::parse_profile_response(r#"{"User":"Luiz","AvatarUrl":"https://media.retroachievements.org/UserPic/Luiz.png","TotalPoints":120,"RichPresence":"Playing Chrono"}"#).unwrap(); assert_eq!(profile.username,"Luiz"); assert_eq!(profile.total_points,120); assert_eq!(profile.rich_presence.as_deref(),Some("Playing Chrono")); }
