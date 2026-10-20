# Console Library Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make managed emulators usable without manual path entry and let users import authorized local game folders into the persistent BaconConsole library.

**Architecture:** Rust owns profile compatibility, canonical path scanning, catalog persistence, and launch validation. React calls typed Tauri adapters to choose folders, import them, and launch catalog installations; it never constructs an arbitrary command. Bundled profiles merge with overrides by id.

**Tech Stack:** Tauri 2, Rust, rusqlite, React, TypeScript, Vitest, Tauri dialog plugin.

**Spec:** `docs/superpowers/specs/2026-10-20-console-library-import-design.md`

## Global Constraints

- No ROM, BIOS, game, core, or Steam download.
- Scan only a user-selected local directory and accepted media extensions.
- Canonicalize native paths; reject links, traversal, files outside the selected root, and executable content.
- Retain explicit confirmation before process launch.
- Preserve BaconDisc, local-user, artwork, and gamepad navigation.
- Do not push changes.

## Review Focus

- A saved Windows-portable profile must not hide bundled RetroArch, DuckStation, or PCSX2.
- Symlink or escaping media must never be imported or launched.
- PS1 `.bin` tracks must not appear as standalone games when a `.cue` is required.
- An empty compatible scan writes no catalog record and has a useful error.
- Missing imported media is unavailable and has no launch action.

---

### Task 1: Profile discovery and compatibility

**Files:**
- Modify: `src-tauri/src/emulators.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/tauriAdapters.ts`
- Test: `src-tauri/src/emulators.rs`

**Interfaces:**
- Produces `merge_profiles(bundled: Vec<EmulatorProfile>, overrides: Vec<EmulatorProfile>) -> Vec<EmulatorProfile>`.
- Produces `profile_supports_platform(profile: &EmulatorProfile, platform: Platform) -> bool`.
- Produces Tauri command `list_effective_emulator_profiles(app: AppHandle) -> Result<Vec<EmulatorProfile>, String>`.

- [ ] **Step 1: Write failing tests**

Test Windows-only override preserves bundled profiles, same-id override replaces its bundled profile, and RetroArch/DuckStation/PCSX2 support only compatible platforms.

- [ ] **Step 2: Run target**

Run: `& "$env:USERPROFILE\.cargo\bin\cargo.exe" test --manifest-path src-tauri\Cargo.toml emulators::tests`

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement profile helpers and effective-profile command**

Merge by id deterministically. RetroArch support depends on available core; DuckStation is PS1-only; PCSX2 is PS2-only; Windows portable is Windows-only. Expose merged profiles without persisting bundled paths.

- [ ] **Step 4: Update TypeScript contracts**

Add `EmulatorProfileService.listEffective(): Promise<EmulatorProfile[]>` and expand platform types for PS1/PS2 where required.

- [ ] **Step 5: Verify and commit**

Run the target test and commit with `fix: merge managed emulator profiles`.

### Task 2: Safe local scanner and catalog migration

**Files:**
- Create: `src-tauri/src/local_library.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/catalog.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/tauriAdapters.ts`
- Test: `src-tauri/src/local_library.rs`
- Test: `src-tauri/src/catalog.rs`

**Interfaces:**
- Produces `scan_authorized_media(root: &Path, platform: Platform) -> Result<Vec<LocalMedia>, LocalLibraryError>`.
- Produces `Catalog::upsert_local_imports(profile_id: &str, media: &[LocalMedia]) -> CatalogResult<ImportResult>`.
- Produces command `import_authorized_library(app, root, platform, profile_id) -> Result<ImportResult, String>`.

- [ ] **Step 1: Write failing scanner tests**

Use temporary media trees to prove PS1 accepts `.cue/.chd/.iso` and rejects `.bin`; GBA accepts `.gba`; unsupported, linked, escaping, and absent roots fail; nested valid media is found.

- [ ] **Step 2: Run scanner target**

Run: `& "$env:USERPROFILE\.cargo\bin\cargo.exe" test --manifest-path src-tauri\Cargo.toml local_library::tests`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement safe bounded scan**

Traverse regular files only, canonicalize the root and candidate, require the candidate to remain below root, apply exact platform allowlists, and derive a title from file stem. Zero accepted media is an error.

- [ ] **Step 4: Write failing migration/upsert tests**

Test migration from the existing schema, persisted `source = local-import` and emulator profile id, and idempotent reimport of a canonical media file.

- [ ] **Step 5: Implement migration 3 and import command**

Add nullable `emulator_profile_id` to installations, migration 3, and the catalog query fields. Create identity from normalized canonical media path plus platform. Resolve and validate a compatible effective profile before scanning or writing, then return import counts.

- [ ] **Step 6: Expose typed adapter and verify**

Expose request/result and installation profile id. Run `& "$env:USERPROFILE\.cargo\bin\cargo.exe" test --manifest-path src-tauri\Cargo.toml`; expected PASS. Commit with `feat: import authorized local game folders`.

### Task 3: Safe launch of imported catalog games

**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/catalog.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/tauriAdapters.ts`
- Test: `src-tauri/src/commands.rs`

**Interfaces:**
- Produces `launch_catalog_game(app, launcher, game_id, installation_id) -> Result<(), String>`.

- [ ] **Step 1: Write failing launch-validation tests**

Cover missing/unavailable local install, incompatible profile/platform, valid PS1 media producing only a DuckStation content argument, and invalid media not writing history.

- [ ] **Step 2: Run target**

Run: `& "$env:USERPROFILE\.cargo\bin\cargo.exe" test --manifest-path src-tauri\Cargo.toml commands::tests`

Expected: FAIL because catalog launch does not exist.

- [ ] **Step 3: Implement shared validated launch builder**

Use one private helper for effective-profile resolution, canonical media validation, platform compatibility, and fixed arguments. Keep the existing BaconDisc Windows-portable launch intact.

- [ ] **Step 4: Implement command and adapter**

Only allow available `local-import` installations. Derive content root/name internally, start history only after validation, and return user-safe errors. Add `LauncherService.launchCatalogGame`.

- [ ] **Step 5: Verify and commit**

Run the complete Rust suite; expected PASS. Commit with `feat: launch imported library games`.

### Task 4: Console-oriented import and launch UI

**Files:**
- Create: `src/features/library/LocalImportPanel.tsx`
- Create: `src/features/library/localImportPanel.test.tsx`
- Modify: `src/features/library/LibraryPage.tsx`
- Modify: `src/features/emulators/EmulatorSettingsPage.tsx`
- Modify: `src/features/emulators/emulatorSettings.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.css`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/tauriAdapters.ts`
- Modify: `package.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/main.rs`

**Interfaces:**
- Consumes catalog import request/result and `launchCatalogGame(gameId, installationId)`.
- Produces `LocalImportPanel` with focusable folder/platform/profile/confirm controls and `onImported`.

- [ ] **Step 1: Write failing UI tests**

Test asynchronous effective profiles render ready, compatible profile is required for import, errors/results are visible, imported cards expose `Jogar`, and unavailable cards do not.

- [ ] **Step 2: Run target**

Run: `npm test -- --run src/features/emulators/emulatorSettings.test.tsx src/features/library/localImportPanel.test.tsx`

Expected: FAIL because import UI does not exist.

- [ ] **Step 3: Add native selection**

Add and initialize Tauri dialog plugin, then expose folder and advanced executable pickers. The picker only follows explicit user activation.

- [ ] **Step 4: Repair emulator settings**

Synchronize derived paths after async profile loading without losing active edits. Show managed installations as ready. Make executable replacement advanced; replace browser prompt; show caught save/launch errors. Remove free-text content launch as the primary import path.

- [ ] **Step 5: Implement LocalImportPanel**

Library offers `Adicionar jogos locais`; user selects folder, platform, compatible profile, confirms import, reads results/errors, refreshes catalog, and gets focus restored to its trigger.

- [ ] **Step 6: Implement card launch**

Show platform and availability. Valid local imports request confirmation and launch by catalog ids. Keep favorites/artwork behavior and use in-app errors rather than alerts.

- [ ] **Step 7: Verify and commit**

Run `npm test -- --run` and `npm run build`; expected PASS. Commit with `feat: add console-style local library import`.

### Task 5: End-to-end verification and documentation

**Files:**
- Modify: `docs/design-system.md` or `README.md`
- Modify: `docs/superpowers/plans/2026-10-20-console-library-import.md`

- [ ] **Step 1: Document the flow**

Describe managed emulator location, supported formats, local import steps, BIOS responsibility, launch confirmation, and that Steam library import remains a distinct future adapter.

- [ ] **Step 2: Verify all automated checks**

Run `npm test -- --run`, `npm run build`, and `& "$env:USERPROFILE\.cargo\bin\cargo.exe" test --manifest-path src-tauri\Cargo.toml`. All must pass.

- [ ] **Step 3: Verify native flow**

Run `npm run tauri dev`. Expected: app opens, managed profiles are visible, a supported folder imports, a card exposes `Jogar`, and failures remain within app UI.

- [ ] **Step 4: Commit**

Commit documentation with `docs: explain local library import`.
