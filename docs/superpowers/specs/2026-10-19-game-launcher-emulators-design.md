# Game Launcher and Emulator Profiles Design

## Purpose

This stage allows BaconConsole to launch authorized local content through configured
emulators or portable Windows executables, track the launched process, and restore
the BaconConsole window and focus after it ends. RetroArch is the first complete
implementation. DuckStation and PCSX2 use the same profile model but are enabled
only after the installed version reports supported launch options.

## Constraints

- Preserve all existing Home, BaconDisc, Library, design-system, and gamepad work.
- Never execute command strings, manifest-provided executables, manifest-provided
  arguments, a shell, installers, or remote content.
- Do not download ROMs, commercial games, BIOS/firmware, emulators, or metadata.
- Launch only files under an installed game, approved cache, or mounted simulated
  disc root after canonical path validation.
- One game session may run at once. Removing a disc never terminates a running
  emulator.
- Use authorized homebrew/demo content for verification.

## Profile model

`EmulatorProfile` is stored in BaconConsole app-data and contains an identifier,
display name, emulator kind, executable path, supported platforms, optional
RetroArch core paths keyed by platform, and a selected default flag per platform.
Executable paths can be absolute or relative to the installed BaconConsole binary.
The native backend resolves, canonicalizes, and verifies the executable before a
profile is marked valid.

Kinds are `retroarch`, `duckstation`, `pcsx2`, and `windows-portable`. RetroArch
supports `nes`, `snes`, `megadrive`, and `gba`; its launch builder emits only the
documented argument vector `-L <core-path> <content-path>`. A user may explicitly
select a config file, which maps to RetroArch's documented `--config` option.

DuckStation and PCSX2 configurations are persisted but launch controls remain
disabled until BaconConsole runs their selected executable with a fixed safe help
probe (`--help`, no user-controlled argument) and recognizes a supported version
capability. This avoids guessing flags from stale documentation. Windows Portable
has no emulator arguments and only launches an allowlisted, validated application
entry point after confirmation.

## Native launcher

`GameLauncher` owns a single process session. It receives a typed request containing
a resolved profile ID, platform, allowed content path, and prior UI focus token. It
creates `std::process::Command` directly with a fixed executable and a vector of
profile-built arguments. It does not invoke a shell.

Before spawn, it validates: no active session; configured executable exists and is
a regular `.exe`; selected platform/core is supported; content exists under an
authorized root; and the relevant profile capability is valid. Human-readable
errors distinguish missing emulator, missing core, missing content, unsafe path,
unsupported platform, and spawn failure.

The launcher records a running session, requests the BaconConsole window hide or
minimize, waits for the child in a native worker, then restores and focuses the
window. Lifecycle events (`launching`, `running`, `exited`, `failed`) are emitted
through declared Tauri capabilities. The frontend restores focus to the initiating
card/button on `exited` or `failed`.

## UI and control flow

Settings gains **Jogos → Emuladores** with a profile shelf. It shows the configured
executable, status, supported platforms, RetroArch core choices, the default
emulator per platform, validation result, and clear setup instructions. File
selection is user-initiated; no normal flow opens a browser dialog unexpectedly.

Home, Library, and Disc derive launch availability from the validated profile
selection. Confirming play shows a short loading transition, then invokes the
native launcher. The existing normalized gamepad layer remains outside the launched
process and never remaps the controller inside an emulator.

Disc integration resolves the manifest platform and allowed content path, then
selects its configured profile. `play-direct` uses the validated disc root;
cache/installed variants use their registered root. CUE references are accepted
only when the CUE file itself and its referenced local files stay inside the same
authorized content root.

## Saves and configuration

BaconConsole does not move, overwrite, or delete saves. Documentation identifies
the default configurable locations used by each emulator. RetroArch retains its
own configuration and save layout unless a user explicitly chooses a supported
per-user configuration file. The profile registry is designed with a future
`user_id` field but no account system is introduced now.

## Testing

- Rust tests cover path resolution, executable validation, profile selection,
  safe argument construction, one-session exclusion, missing content/emulator, and
  child exit handling through an injectable process runner.
- React tests cover unavailable/configured status, profile selection, loading and
  return states, and focus restoration.
- A manual RetroArch test uses authorized content and verifies launch and return.
- DuckStation/PCSX2 manual tests run only after their installed executable's help
  output validates the profile capability.
- Existing test suite, web build, and Tauri build remain green.

## Known scope boundary

This stage does not implement Steam, scraping, RetroAchievements, overlays,
physical DVD playback, downloads, BIOS provisioning, or universal emulator save
migration.
