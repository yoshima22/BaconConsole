# Steam Local and Windows Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Discover installed Steam games locally and safely register explicit Windows applications in the BaconConsole Library.

**Architecture:** Rust parses Steam VDF/ACF files into validated discovery records and persists them through the existing catalog. The launcher opens only generated `steam://run/<AppID>` URIs or a canonical executable path with no arguments. React exposes synchronization and registration through existing library surfaces.

**Tech Stack:** Tauri 2, Rust, rusqlite, React, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-20-steam-local-and-windows-library-design.md`

## Global Constraints

- Read Steam libraries only; never copy, delete, repair or mutate Steam files.
- Steam launch uses only a validated decimal AppID and fixed `steam://run/<AppID>` URI.
- Windows applications accept a user-selected local `.exe`/`.lnk`, no arguments or scripts.
- Preserve offline operation and existing catalog, BaconDisc and emulator flows.
- Test every new behavior before implementation.

## Review Focus

- VDF with escaped paths and two libraries discovers only valid installed manifests.
- Missing library or moved game marks an existing Steam installation unavailable without deletion.
- Non-decimal AppID can never reach URI launch.
- `.lnk` resolving outside a local executable is rejected.
- Re-syncing a Steam AppID updates the existing game rather than duplicating it.

---

### Task 1: Steam manifest parser

**Files:** Create `src-tauri/src/steam_library.rs`, `src-tauri/tests/steam_library.rs`; modify `src-tauri/src/lib.rs`.

- [ ] Write fixtures/tests for libraryfolders VDF, valid ACF, invalid AppID and absent install path; run `cargo test --manifest-path src-tauri/Cargo.toml --test steam_library` and observe failure.
- [ ] Implement `discover_installed_games(steam_root: &Path) -> Result<Vec<SteamInstall>, SteamError>` using read-only validated paths.
- [ ] Re-run the focused Rust test and commit `feat: discover local Steam installations`.

### Task 2: Catalog and safe Steam launcher

**Files:** Modify `src-tauri/src/catalog.rs`, `src-tauri/src/launcher.rs`, `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`; create/modify `src-tauri/tests/steam_catalog.rs`.

- [ ] Write failing tests for stable `steam:<appid>` upsert and rejecting nonnumeric URI IDs.
- [ ] Add sync command plus a `LaunchRequest` variant that opens only generated fixed Steam URI; mark missing installs unavailable.
- [ ] Run focused tests and commit `feat: sync and launch local Steam games`.

### Task 3: Safe Windows application registration

**Files:** Create `src-tauri/src/windows_library.rs`, `src-tauri/tests/windows_library.rs`; modify catalog, commands and launcher.

- [ ] Write failing tests for canonical `.exe`, rejected directories/extensions and deterministic identity.
- [ ] Implement validated registration and no-argument launch request; add Tauri command.
- [ ] Run focused tests and commit `feat: register trusted Windows applications`.

### Task 4: Library UI and adapters

**Files:** Modify `src/services/contracts.ts`, `src/services/tauriAdapters.ts`, `src/features/library/LibraryPage.tsx`, `src/features/library/GameDetailsPanel.tsx`, related tests and CSS.

- [ ] Write failing UI tests for Steam sync action, Steam unavailable label and Windows app registration action.
- [ ] Implement native picker-backed actions, notices and source labels; retain gamepad focus.
- [ ] Run frontend suite, Rust suite and build; update README; commit `feat: manage Steam and Windows library entries`.
