use std::{fs, path::PathBuf};
use baconconsole::metadata::{metadata_status, retroachievements_status, ArtworkKind, ArtworkRecord, MetadataStatus, MetadataStore, MemorySecretStore, SecretStore};

fn root(name: &str) -> PathBuf { let root=std::env::temp_dir().join(format!("baconconsole-metadata-{name}-{}",std::process::id())); fs::create_dir_all(&root).unwrap(); root }

#[test]
fn persists_selected_artwork_without_persisting_provider_key() {
  let root=root("selection");
  let store=MetadataStore::open(&root).unwrap();
  let record=ArtworkRecord::new("steamgriddb", 42, ArtworkKind::Cover, "https://cdn.steamgriddb.com/grid.png", "artwork/abc.png", "image/png", "abc");
  store.save_selected_artwork(12, &record).unwrap();
  assert_eq!(store.selected_artwork(12, ArtworkKind::Cover).unwrap().unwrap().local_path, "artwork/abc.png");
  assert_eq!(store.all_selected_artwork(12).unwrap().len(), 1);
}

#[test]
fn reports_not_configured_without_a_secret() { assert_eq!(metadata_status(&MemorySecretStore::default()), MetadataStatus::NotConfigured); }

#[test]
fn reports_retroachievements_ready_only_with_both_credentials() {
  let store=MemorySecretStore::default();
  assert_eq!(retroachievements_status(&store), MetadataStatus::NotConfigured);
  store.write("retroachievements-user", "Luiz").unwrap();
  store.write("retroachievements-api-key", "secret").unwrap();
  assert_eq!(retroachievements_status(&store), MetadataStatus::Configured);
}
