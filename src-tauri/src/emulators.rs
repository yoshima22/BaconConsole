use std::{collections::BTreeMap, ffi::OsString, path::{Component, Path, PathBuf}};
use serde::{Deserialize, Serialize};
use crate::disc::DiscError;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Platform { Nes, Snes, Megadrive, Gba, Ps1, Ps2, Windows }
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum EmulatorKind { RetroArch, Duckstation, Pcsx2, WindowsPortable }
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmulatorProfile { pub id: String, pub name: String, pub kind: EmulatorKind, pub executable: String, pub cores: BTreeMap<Platform, String> }
impl EmulatorProfile { pub fn new(id: impl Into<String>, name: impl Into<String>, kind: EmulatorKind, executable: impl Into<String>) -> Self { Self { id:id.into(), name:name.into(), kind, executable:executable.into(), cores:BTreeMap::new() } } }
pub fn resolve_profile_path(app_dir: &Path, configured: &str) -> Result<PathBuf, DiscError> { let value = Path::new(configured); if value.is_absolute() { return if value.extension().is_some_and(|e| e.eq_ignore_ascii_case("exe")) { Ok(value.to_path_buf()) } else { Err(DiscError::UnsafePath) }; } if value.components().any(|c| matches!(c, Component::ParentDir | Component::RootDir | Component::Prefix(_))) || !value.extension().is_some_and(|e| e.eq_ignore_ascii_case("exe")) { return Err(DiscError::UnsafePath); } Ok(app_dir.join(value)) }
pub fn retroarch_arguments(profile: &EmulatorProfile, platform: Platform, content: &Path) -> Result<Vec<OsString>, DiscError> { if profile.kind != EmulatorKind::RetroArch { return Err(DiscError::UnsupportedPackage); } let core = profile.cores.get(&platform).ok_or(DiscError::UnsupportedPackage)?; Ok(vec![OsString::from("-L"), OsString::from(core), content.as_os_str().to_owned()]) }
