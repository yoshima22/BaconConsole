use std::path::Path;
use baconconsole::emulators::{merge_profiles, profile_supports_platform, retroarch_arguments, resolve_profile_path, validate_profile, EmulatorKind, EmulatorProfile, Platform};

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

#[test]
fn accepts_the_managed_windows_portable_profile_without_a_global_executable() {
    let profile = EmulatorProfile::new("windows-portable", "Windows portátil", EmulatorKind::WindowsPortable, "");
    assert!(validate_profile(&profile).is_ok());
}

#[test]
fn keeps_managed_profiles_when_a_windows_override_is_saved() {
    let bundled = vec![
        EmulatorProfile::new("retroarch", "RetroArch", EmulatorKind::RetroArch, "retroarch.exe"),
        EmulatorProfile::new("duckstation", "DuckStation", EmulatorKind::Duckstation, "duckstation.exe"),
        EmulatorProfile::new("windows-portable", "Windows portátil", EmulatorKind::WindowsPortable, ""),
    ];
    let overrides = vec![EmulatorProfile::new("windows-portable", "Windows portátil", EmulatorKind::WindowsPortable, "")];

    let profiles = merge_profiles(bundled, overrides);

    assert_eq!(profiles.iter().map(|profile| profile.id.as_str()).collect::<Vec<_>>(), vec!["retroarch", "duckstation", "windows-portable"]);
}

#[test]
fn replaces_a_bundled_profile_only_when_the_override_has_the_same_id() {
    let bundled = vec![EmulatorProfile::new("duckstation", "DuckStation", EmulatorKind::Duckstation, "managed.exe")];
    let overrides = vec![EmulatorProfile::new("duckstation", "DuckStation", EmulatorKind::Duckstation, "custom.exe")];

    let profiles = merge_profiles(bundled, overrides);

    assert_eq!(profiles[0].executable, "custom.exe");
}

#[test]
fn restricts_managed_profiles_to_their_supported_platforms() {
    let duckstation = EmulatorProfile::new("duckstation", "DuckStation", EmulatorKind::Duckstation, "duckstation.exe");
    let pcsx2 = EmulatorProfile::new("pcsx2", "PCSX2", EmulatorKind::Pcsx2, "pcsx2.exe");
    let mut retroarch = EmulatorProfile::new("retroarch", "RetroArch", EmulatorKind::RetroArch, "retroarch.exe");
    retroarch.cores.insert(Platform::Gba, "mgba_libretro.dll".into());

    assert!(profile_supports_platform(&duckstation, Platform::Ps1));
    assert!(!profile_supports_platform(&duckstation, Platform::Ps2));
    assert!(profile_supports_platform(&pcsx2, Platform::Ps2));
    assert!(!profile_supports_platform(&pcsx2, Platform::Ps1));
    assert!(profile_supports_platform(&retroarch, Platform::Gba));
    assert!(!profile_supports_platform(&retroarch, Platform::Ps1));
}
