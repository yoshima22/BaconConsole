use std::{collections::{BTreeMap, BTreeSet}, ffi::OsString, fs, path::{Component, Path, PathBuf}};
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
pub fn merge_profiles(bundled: Vec<EmulatorProfile>, overrides: Vec<EmulatorProfile>) -> Vec<EmulatorProfile> {
 let overrides = overrides.into_iter().map(|profile| (profile.id.clone(), profile)).collect::<BTreeMap<_, _>>();
 let mut seen = BTreeSet::new();
 let mut merged = bundled.into_iter().map(|profile| {
   let id = profile.id.clone();
   seen.insert(id.clone());
   overrides.get(&id).cloned().unwrap_or(profile)
 }).collect::<Vec<_>>();
 merged.extend(overrides.into_iter().filter_map(|(id, profile)| (!seen.contains(&id)).then_some(profile)));
 merged
}
pub fn profile_supports_platform(profile: &EmulatorProfile, platform: Platform) -> bool {
 match profile.kind {
   EmulatorKind::RetroArch => profile.cores.contains_key(&platform),
   EmulatorKind::Duckstation => platform == Platform::Ps1,
   EmulatorKind::Pcsx2 => platform == Platform::Ps2,
   EmulatorKind::WindowsPortable => platform == Platform::Windows,
 }
}
pub fn validate_profile(profile: &EmulatorProfile) -> Result<(), DiscError> { if profile.kind == EmulatorKind::WindowsPortable { return Ok(()); } let executable = Path::new(&profile.executable); if !executable.is_file() || !executable.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("exe")) { return Err(DiscError::UnsafePath); } if profile.kind == EmulatorKind::RetroArch && profile.cores.values().any(|core| !Path::new(core).is_file()) { return Err(DiscError::UnsafePath); } Ok(()) }
pub fn resolve_profile_path(app_dir: &Path, configured: &str) -> Result<PathBuf, DiscError> { let value = Path::new(configured); if value.is_absolute() { return if value.extension().is_some_and(|e| e.eq_ignore_ascii_case("exe")) { Ok(value.to_path_buf()) } else { Err(DiscError::UnsafePath) }; } if value.components().any(|c| matches!(c, Component::ParentDir | Component::RootDir | Component::Prefix(_))) || !value.extension().is_some_and(|e| e.eq_ignore_ascii_case("exe")) { return Err(DiscError::UnsafePath); } Ok(app_dir.join(value)) }
pub fn retroarch_arguments(profile: &EmulatorProfile, platform: Platform, content: &Path) -> Result<Vec<OsString>, DiscError> { if profile.kind != EmulatorKind::RetroArch { return Err(DiscError::UnsupportedPackage); } let core = profile.cores.get(&platform).ok_or(DiscError::UnsupportedPackage)?; Ok(vec![OsString::from("-L"), OsString::from(core), content.as_os_str().to_owned()]) }
pub fn list_profiles(root: &Path) -> Result<Vec<EmulatorProfile>, DiscError> { let path = root.join("emulators.json"); if !path.exists() { return Ok(Vec::new()); } Ok(serde_json::from_str(&fs::read_to_string(path)?)?) }
pub fn save_profile(root: &Path, profile: EmulatorProfile) -> Result<(), DiscError> { fs::create_dir_all(root)?; let mut profiles = list_profiles(root)?; profiles.retain(|item| item.id != profile.id); profiles.push(profile); fs::write(root.join("emulators.json.tmp"), serde_json::to_vec_pretty(&profiles).map_err(DiscError::Manifest)?)?; fs::rename(root.join("emulators.json.tmp"), root.join("emulators.json"))?; Ok(()) }
