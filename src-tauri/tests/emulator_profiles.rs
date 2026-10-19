use std::path::Path;
use baconconsole::emulators::{retroarch_arguments, resolve_profile_path, validate_profile, EmulatorKind, EmulatorProfile, Platform};

fn retroarch() -> EmulatorProfile { EmulatorProfile::new("retro", "RetroArch", EmulatorKind::RetroArch, "RetroArch/retroarch.exe") }

#[test]
fn resolves_relative_executable_beneath_application_directory() {
    let path = resolve_profile_path(Path::new("C:/Bacon"), "RetroArch/retroarch.exe").unwrap();
    assert_eq!(path, Path::new("C:/Bacon/RetroArch/retroarch.exe"));
}

#[test]
fn rejects_profile_path_that_escapes_application_directory() {
    assert!(resolve_profile_path(Path::new("C:/Bacon"), "../tool.exe").is_err());
}

#[test]
fn builds_retroarch_core_and_content_as_discrete_arguments() {
    let mut profile = retroarch();
    profile.cores.insert(Platform::Nes, "C:/RetroArch/cores/nestopia_libretro.dll".into());
    let arguments = retroarch_arguments(&profile, Platform::Nes, Path::new("C:/Games/demo.nes")).unwrap();
    assert_eq!(arguments, vec!["-L", "C:/RetroArch/cores/nestopia_libretro.dll", "C:/Games/demo.nes"]);
}

#[test]
fn refuses_a_configured_emulator_that_is_not_a_real_executable() {
    assert!(validate_profile(&retroarch()).is_err());
}
