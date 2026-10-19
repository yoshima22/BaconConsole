use std::{fs, path::Path};
use serde::{Deserialize, Serialize};
use crate::disc::DiscError;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LibraryRecord { pub id: String, pub title: String, pub install_path: String, pub install_kind: String, pub requires_disc: bool }
impl LibraryRecord {
    pub fn permanent(id: impl Into<String>, title: impl Into<String>, install_path: impl Into<String>, requires_disc: bool) -> Self { Self { id: id.into(), title: title.into(), install_path: install_path.into(), install_kind: "permanent".into(), requires_disc } }
}
pub fn list_installs(root: &Path) -> Result<Vec<LibraryRecord>, DiscError> { let path = root.join("library.json"); if !path.exists() { return Ok(Vec::new()); } Ok(serde_json::from_str(&fs::read_to_string(path)?)?) }
pub fn register_install(root: &Path, record: LibraryRecord) -> Result<(), DiscError> {
    fs::create_dir_all(root)?;
    let mut records = list_installs(root)?;
    records.retain(|existing| existing.id != record.id);
    records.push(record);
    let temporary = root.join("library.json.tmp");
    fs::write(&temporary, serde_json::to_vec_pretty(&records).map_err(DiscError::Manifest)?)?;
    fs::rename(temporary, root.join("library.json"))?;
    Ok(())
}
