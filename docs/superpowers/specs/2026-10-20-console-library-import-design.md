# Console Library Import Design

## Intent

BaconConsole must feel like a console launcher: emulators supplied and managed by the application are used automatically, and a user imports an authorized local games folder into the library without typing emulator or individual ROM paths. Steam remains a separate future adapter; it is not represented by arbitrary Windows executables.

## Scope

This increment repairs the managed-emulator discovery path and adds an authorized local-content importer. It does not download games, BIOS, ROMs, cores, or Steam content; scrape metadata; or implement Steam library discovery.

## Alternatives considered

1. Repair only the profile UI. This removes one defect but leaves users registering each game manually.
2. Treat every file as a generic Windows executable. This cannot safely launch emulator media and loses platform-specific compatibility.
3. **Recommended: managed profiles plus platform-aware folder import.** A selected folder is scanned under strict extension and path rules, its games are registered in SQLite, and every installation retains the managed profile required to launch it.

## Architecture

### Managed emulator registry

The frontend loads bundled profiles and user overrides, merging by profile id so an override replaces only its matching bundled profile. A saved Windows profile must never hide detected RetroArch, DuckStation, or PCSX2 profiles.

The emulator screen presents managed installations as ready when their executable exists. The regular library flow never asks for an emulator path. Advanced configuration remains available behind a native executable picker and is only for replacement executables. Errors from save or launch actions are rendered in the page status region.

### Local import service

A native `scan_authorized_library(root, platform, profile_id)` command will canonicalize the chosen directory, recursively enumerate regular files below it, and accept only platform allowlists:

| Platform | Accepted extensions |
| --- | --- |
| NES | `.nes` |
| SNES | `.sfc`, `.smc` |
| Mega Drive | `.md`, `.gen`, `.bin` |
| GBA | `.gba` |
| PS1 | `.cue`, `.chd`, `.iso` |
| PS2 | `.chd`, `.iso` |

The scan excludes executable files, symbolic links, files outside the selected canonical root, and unknown extensions. A bounded result is returned with accepted titles and rejected-count diagnostics; the command does not spawn a process. A profile must exist, be a compatible managed emulator, and validate successfully before records are committed.

Each accepted file receives a stable identity based on normalized canonical path plus platform. The catalog writes an installation with `source = local-import`, its canonical content path, platform, and `emulator_profile_id`. Rescanning is idempotent: it updates the existing installation rather than duplicating a game. Missing files are represented as unavailable on a future refresh rather than silently launched.

### Catalog and launcher

Schema migration 3 adds `emulator_profile_id` to catalog installations. Existing BaconDisc and Windows records retain no profile id. The library exposes a launch action only for available local imports with an assigned profile. It creates a launch request from the validated canonical file (root + filename internally), asks for explicit confirmation, then delegates to the existing native launcher.

Native launching keeps the allowlisted profile behavior: RetroArch uses an assigned core; DuckStation receives PS1 media only; PCSX2 receives PS2 media only. The launcher validates both profile and media before writing history or spawning. Errors are returned as user-safe messages and shown in the interface.

### Interface flow

Library receives an `Adicionar jogos locais` action. The user chooses a folder with a native folder dialog, chooses a platform and the compatible detected profile, and confirms import. The result shows count/import problems and returns focus to the trigger. Imported cards show the platform and a primary `Jogar` action. Keyboard/gamepad focus uses the existing visible controls only.

The old free-text `Conteúdo autorizado` section is removed from the primary path. It may be retained only as an advanced diagnostic launch control if it uses native file selection; it never acts as the import mechanism.

## Security and privacy

- Paths are canonicalized natively; no caller-supplied relative traversal is accepted.
- Import and launch enforce an explicit platform extension allowlist.
- Folder scan reads metadata only and does not execute content.
- Launch remains user-confirmed and only invokes a configured, validated `.exe` profile with fixed arguments.
- The library stores local canonical paths in the app-local SQLite database; it does not upload paths or media.

## Error handling

The UI distinguishes: no detected compatible emulator, inaccessible folder, no supported files, invalid profile, unavailable media, and launch failure. A failure never creates a partially runnable catalog item. Successful imports can be rescanned safely.

## Testing

Native tests cover profile merge/compatibility, extension acceptance, canonical-root rejection, idempotent catalog upsert, and rejected profile/media combinations. Frontend tests cover visible managed profile state, an import result, error notices, and the library launch affordance. The complete Vitest suite, TypeScript production build, and Rust test suite must pass.

## Acceptance criteria

1. A detected bundled emulator remains selectable after a user profile is saved.
2. Importing an authorized PS1/PS2/RetroArch folder adds compatible files to the library without individual path entry.
3. Imported games retain their platform and selected managed emulator after restart.
4. Library launch reports actionable errors instead of failing silently.
5. No ROM, BIOS, game, or Steam executable is downloaded or scanned outside a user-chosen local folder.
6. Existing BaconDisc, profiles, artwork, and local-user flows keep working.
