# BaconDisc Simulado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure simulated BaconDisc workflow that validates portable-PC manifests, copies declared files, and registers an installed game.

**Architecture:** Rust owns trusted filesystem operations through narrow Tauri commands; React consumes typed services and renders local state. The simulated-disc adapter stays independent from a future physical-drive adapter, and the launcher performs eligibility assessment only.

**Tech Stack:** Tauri 2/Rust, React, TypeScript, Vitest, serde, sha2.

**Spec:** `docs/superpowers/specs/2026-10-19-bacondisc-simulated-design.md`

## Global Constraints

- Accept only `schemaVersion: 1`, `platform: "windows"`, `packageType: "portable"` manifests.
- Manifest paths must be relative, normalized, canonicalized, and contained beneath the approved root.
- Never invoke a shell, execute manifest commands, or launch software automatically.
- Copy only declared regular files after integrity and free-space checks.
- Preserve existing Home behavior and do not push to Git without user authorization.

## Review Focus

- A symlink that escapes the media root is rejected by Task 2 tests.
- A destination nested inside the source is rejected by Task 3 tests.
- Hash mismatch prevents registration by Task 3 tests.
- Removing media during an unfinished UI operation produces a recoverable state in Task 5 tests.
- An unrecognized controller cannot trigger a launch or installation action in Task 5 tests.

---

## File Structure

- `src-tauri/src/disc.rs`: manifest model, parser, and path containment validation.
- `src-tauri/src/storage.rs`: free-space check, verified copy, and progress payloads.
- `src-tauri/src/library.rs`: app-data library record persistence.
- `src-tauri/src/commands.rs`: narrow command boundary and Tauri registration.
- `src/services/*`: typed frontend contracts and Tauri adapters.
- `src/features/disc/*`: disc state, commands, and dedicated page components.
- `src/features/library/*`: installed-game display.
- `demo-media/*`: fictional, inert portable-game sample.

### Task 1: Prepare the native Tauri host

**Files:**
- Modify: `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `README.md`

**Interfaces:**
- Produces: `npm run tauri dev`, `npm run tauri build` once Rust/MSVC prerequisites are installed.

- [ ] Write a failing configuration test asserting the `tauri` script exists.
- [ ] Run it and observe failure.
- [ ] Add `@tauri-apps/cli`, Rust dependencies (`serde`, `serde_json`, `sha2`, filesystem helper), and Windows prerequisite guidance.
- [ ] Run the test and `npm run build`; run Tauri validation when Cargo is available.
- [ ] Commit: `chore: prepare tauri native host`.

### Task 2: Parse and validate a BaconDisc manifest

**Files:**
- Create: `src-tauri/src/disc.rs`, `src-tauri/tests/disc_manifest.rs`, `demo-media/lunar-archive/bacon.json`
- Modify: `src-tauri/src/main.rs`

**Interfaces:**
- Produces: `load_manifest(root: &Path) -> Result<BaconManifest, DiscError>` and `resolve_media_file(root: &Path, relative: &str) -> Result<PathBuf, DiscError>`.

- [ ] Write Rust tests for accepted portable manifest, missing fields, wrong platform/package type, traversal, absolute path, and root-escaping symlink.
- [ ] Run `cargo test --test disc_manifest` and observe the absent-module failure.
- [ ] Implement the serde model, canonical containment checks, and SHA-256 field validation.
- [ ] Run the manifest tests to PASS.
- [ ] Commit: `feat: validate simulated bacondisc manifests`.

### Task 3: Verify and copy declared media files

**Files:**
- Create: `src-tauri/src/storage.rs`, `src-tauri/tests/storage_copy.rs`
- Modify: `src-tauri/src/main.rs`

**Interfaces:**
- Consumes: `BaconManifest`, `resolve_media_file`.
- Produces: `verify_manifest_files`, `copy_manifest_files`, and `CopyProgress`.

- [ ] Write Rust tests for hash mismatch, insufficient destination space abstraction, source-contained destination rejection, byte progress, and copied file contents.
- [ ] Run `cargo test --test storage_copy` and observe failure.
- [ ] Implement verified regular-file copying into a validated destination and progress events; do not copy on failed integrity.
- [ ] Run storage tests to PASS.
- [ ] Commit: `feat: add verified portable game copy`.

### Task 4: Persist the installed-game library and expose typed commands

**Files:**
- Create: `src-tauri/src/library.rs`, `src-tauri/src/commands.rs`, `src-tauri/tests/library.rs`, `src/services/{contracts,tauriAdapters}.ts`
- Modify: `src-tauri/src/main.rs`

**Interfaces:**
- Produces: `DiscService`, `StorageService`, `GameLibrary`, `GameLauncher` TypeScript contracts; Tauri inspect/verify/copy/list commands.

- [ ] Write Rust persistence tests and TypeScript contract tests for an installed-game record after successful copy.
- [ ] Run targeted suites and observe failure.
- [ ] Implement app-data JSON persistence and narrow command DTOs. `GameLauncher` returns eligibility only.
- [ ] Run Rust and Vitest suites to PASS.
- [ ] Commit: `feat: register installed bacondisc games`.

### Task 5: Build the Disc and Library UI flow

**Files:**
- Create: `src/features/disc/{discReducer,DiscPage,DiscPage.test}.tsx`, `src/features/library/{LibraryPage,LibraryPage.test}.tsx`
- Modify: `src/app/App.tsx`, `src/features/home/DiscStatus.tsx`, `src/components/TopBar.tsx`, `src/app/App.css`

**Interfaces:**
- Consumes: services from Task 4.
- Produces: inserted/removed/exchanged media state, verified copy progress, and installed-library display.

- [ ] Write component tests for insert → inspect → direct-play eligibility/copy choice → progress → library registration → removal; include Escape focus restoration and disabled unsafe actions.
- [ ] Run Vitest and observe failure.
- [ ] Implement a development-only insert selector, normal disc page, progress presentation, notifications outside Home, and a library tab using the existing design system.
- [ ] Run all Vitest tests and `npm run build` to PASS; run `npm run tauri dev` manually when prerequisites are available.
- [ ] Commit: `feat: add simulated bacondisc ui flow`.

### Task 6: Document and verify the end-to-end demo

**Files:**
- Modify: `README.md`, `docs/design-system.md`

- [ ] Add a failing documentation-contract test for the demo-media path and explicit simulated-only warning.
- [ ] Run it to observe failure.
- [ ] Document Rust/MSVC/WebView2 setup, the demo manifest, safe execution boundary, test commands, and manual Windows validation flow.
- [ ] Run `npm run test -- --run`, `npm run build`, and `cargo test`; document any native command blocked solely by missing environment prerequisites.
- [ ] Commit: `docs: document bacondisc development flow`.
