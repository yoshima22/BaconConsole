use std::{fs, path::{Path, PathBuf}};
use crate::emulators::Platform;

pub type LocalLibraryResult<T> = Result<T, String>;

#[derive(Clone, Debug)]
pub struct LocalMedia {
    pub path: PathBuf,
    pub title: String,
    pub platform: Platform,
}

pub fn scan_authorized_media(root: &Path, platform: Platform) -> LocalLibraryResult<Vec<LocalMedia>> {
    let root = root.canonicalize().map_err(|_| "pasta de jogos não encontrada".to_string())?;
    if !root.is_dir() {
        return Err("selecione uma pasta de jogos válida".into());
    }

    let mut media = Vec::new();
    visit(&root, &root, platform, &mut media)?;
    media.sort_by(|left, right| left.path.cmp(&right.path));
    if media.is_empty() {
        return Err("nenhum arquivo compatível foi encontrado nesta pasta".into());
    }
    Ok(media)
}

fn visit(root: &Path, directory: &Path, platform: Platform, media: &mut Vec<LocalMedia>) -> LocalLibraryResult<()> {
    for entry in fs::read_dir(directory).map_err(|_| "não foi possível ler a pasta de jogos".to_string())? {
        let entry = entry.map_err(|_| "não foi possível ler um arquivo de jogo".to_string())?;
        let file_type = entry.file_type().map_err(|_| "não foi possível validar um arquivo de jogo".to_string())?;
        if file_type.is_symlink() {
            continue;
        }
        if file_type.is_dir() {
            visit(root, &entry.path(), platform, media)?;
            continue;
        }
        if !file_type.is_file() || !has_supported_extension(&entry.path(), platform) {
            continue;
        }
        let path = entry.path().canonicalize().map_err(|_| "não foi possível validar um arquivo de jogo".to_string())?;
        if !path.starts_with(root) || !path.is_file() {
            continue;
        }
        let title = path.file_stem().and_then(|value| value.to_str()).filter(|value| !value.trim().is_empty()).ok_or("nome de jogo inválido")?.to_owned();
        media.push(LocalMedia { path, title, platform });
    }
    Ok(())
}

pub fn has_supported_extension(path: &Path, platform: Platform) -> bool {
    let extension = path.extension().and_then(|value| value.to_str()).map(str::to_ascii_lowercase);
    match (platform, extension.as_deref()) {
        (Platform::Nes, Some("nes")) => true,
        (Platform::Snes, Some("sfc" | "smc")) => true,
        (Platform::Megadrive, Some("md" | "gen" | "bin")) => true,
        (Platform::Gba, Some("gba")) => true,
        (Platform::Ps1, Some("cue" | "chd" | "iso")) => true,
        (Platform::Ps2, Some("chd" | "iso")) => true,
        _ => false,
    }
}
