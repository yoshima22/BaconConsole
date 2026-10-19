# BaconDisc Installation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a gamepad-navigable simulated BaconDisc detail, cache, and installation experience that updates Home and Library with real verified-copy state.

**Architecture:** A frontend `discSession` reducer will model mounted media, installation jobs, and notifications while independent pages render that shared state. The Tauri adapter remains behind typed contracts and is expanded with safe metadata, storage-space, progress, cancellation, and library-registration operations. Rust continues to own manifest and path validation; React derives every visible action from the validated modes returned by that layer.

**Tech Stack:** Tauri 2, React, TypeScript, Vitest/Testing Library, Rust, serde, sha2.

**Spec:** `docs/superpowers/specs/2026-10-19-bacondisc-installation-ui-design.md`

## Global Constraints

- Preserve the approved Home and its existing navy/graphite/cyan design system.
- Use the user-supplied disc image only as a local, provisional placeholder.
- Support simulated Windows `portable` packages only.
- Derive actions only from validated `bacon.json` modes; do not execute arbitrary manifest commands.
- Direct launch requires explicit confirmation and only targets the validated relative entry point.
- Do not add Steam, scraping, RetroAchievements, physical DVD access, protected art, ROM/BIOS acquisition, or third-party installers.
- Keep keyboard and normalized gamepad navigation equivalent; hidden/disabled controls must not receive focus.
- Do not push commits without explicit user authorization.

## Review Focus

- A manifest whose `files` list is empty must report total size `0` and complete copy without inventing progress; Task 1 tests this.
- A destination nested inside disc media must be rejected even when its parent does not already exist; Task 1 tests this.
- A disc removed during a copy must leave no permanent library registration and show the removed-media failure state; Tasks 1 and 4 test this.
- A package without `cache` or `copy-to-storage` must render its unavailable actions without allowing keyboard focus; Task 2 tests this.
- Closing an install result panel must return focus to the action that opened it rather than an off-screen control; Task 3 tests this.

---

## File structure

- Modify: `src-tauri/src/disc.rs` — expose validated manifest size and safe mode helpers.
- Modify: `src-tauri/src/storage.rs` — streaming verified copy, destination-space checks, cancellation/progress reporting, and cleanup semantics.
- Create: `src-tauri/src/library.rs` — serializable local records and atomic registration helpers.
- Modify: `src-tauri/src/lib.rs` — export the new library module.
- Modify: `src-tauri/src/commands.rs` — typed Tauri command DTOs and event-backed operations.
- Modify: `src-tauri/src/main.rs` — register commands and managed cancellation state.
- Modify: `src-tauri/tests/disc_manifest.rs` — native metadata/path/verified-copy tests.
- Create: `src-tauri/tests/storage_install.rs` — progress, cancellation, capacity, and registration tests.
- Modify: `src/services/contracts.ts` — DiscService/GameLibrary contracts and UI-facing DTOs.
- Modify: `src/services/tauriAdapters.ts` — Tauri implementation and progress subscription.
- Create: `src/features/disc/discSession.ts` — state types, reducer, selectors, and pure action derivation.
- Create: `src/features/disc/discSession.test.ts` — reducer and selector tests.
- Create: `src/features/disc/DiscPage.tsx` — inserted/empty/invalid/removed disc states and action shelf.
- Create: `src/features/disc/InstallPanel.tsx` — installation/cache lifecycle and completion controls.
- Create: `src/features/library/LibraryPage.tsx` — locally installed-game shelf and disc-required affordances.
- Create: `src/features/disc/disc-ui.test.tsx` — visible states, disabled actions, and focus restoration tests.
- Modify: `src/app/App.tsx` — shared provider/state wiring, page selection, Home synchronization, notifications, and development media controls.
- Modify: `src/app/App.css` — console-style layouts, visual states, transitions, and responsive 16:9 behavior.
- Modify: `src/app/App.test.tsx` — cross-page Home/Disc/Library user-path coverage.
- Modify: `README.md` — supported demo flow, requirements, and known limitations.

### Task 1: Make the native simulated-disc workflow observable and safe

**Files:**
- Modify: `src-tauri/src/disc.rs`
- Modify: `src-tauri/src/storage.rs`
- Create: `src-tauri/src/library.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/tests/disc_manifest.rs`
- Create: `src-tauri/tests/storage_install.rs`

**Interfaces:**
- Produces `DiscDetails { id, title, platform, package_type, entry_point, modes, file_count, total_bytes }`.
- Produces `CopyProgress { job_id, copied_bytes, total_bytes, file_count, completed_files }` emitted on `bacondisc-copy-progress`.
- Produces `StorageTarget { kind, root, available_bytes }` and `LibraryRecord { id, title, install_path, install_kind, requires_disc }`.
- Produces commands `inspect_simulated_disc`, `get_storage_targets`, `start_verified_copy`, `cancel_copy`, and `list_library_records`.

- [ ] **Step 1: Write failing Rust tests for metadata and storage edge cases**

Add fixture-based tests proving that a valid empty-file manifest reports `total_bytes == 0`, a nested destination is rejected, insufficient available space fails before copy, cancellation leaves no permanent record, and successful copy registers a permanent record.

- [ ] **Step 2: Run the targeted tests to verify failure**

Run: `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml storage_install disc_manifest`

Expected: FAIL because the DTOs, storage checks, and registration behavior do not exist.

- [ ] **Step 3: Extend manifest and storage APIs**

Implement `manifest_total_bytes(manifest: &BaconManifest) -> u64` and make verified copy consume a progress callback and cancellation token between source reads/files. Canonicalize or validate both source and destination ancestors before writing; delete an incomplete target created by a failed/cancelled job. Use `fs2` or the Windows-compatible standard approach selected by Cargo for free-space inspection, without shelling out.

- [ ] **Step 4: Implement local library registration and Tauri commands**

Implement a JSON-backed app-data library registry with atomic temporary-write/rename replacement. Start-copy returns a `job_id`, emits `CopyProgress`, and registers only successful permanent installs; cache records remain temporary and are not returned by `list_library_records` as installed titles.

- [ ] **Step 5: Run native tests**

Run: `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src-tauri
git commit -m "feat: add observable simulated disc copy workflow"
```

### Task 2: Add typed frontend services and pure session behavior

**Files:**
- Modify: `src/services/contracts.ts`
- Modify: `src/services/tauriAdapters.ts`
- Create: `src/features/disc/discSession.ts`
- Create: `src/features/disc/discSession.test.ts`

**Interfaces:**
- Consumes `DiscDetails`, `CopyProgress`, `StorageTarget`, and `LibraryRecord` from Task 1.
- Produces `deriveDiscActions(details, targets): DiscAction[]` and `discSessionReducer(state, event): DiscSessionState`.
- Produces `DiscService.startCopy(request, onProgress): Promise<CopyResult>` and `GameLibrary.list(): Promise<LibraryRecord[]>`.

- [ ] **Step 1: Write failing session tests**

Test that `play-direct` exposes direct play, absent cache/copy modes produce disabled unfocusable reasons, a zero-byte copy completes cleanly, and remove-during-copy transitions from `copying` to `failed` without a library-added event.

- [ ] **Step 2: Run the focused test to verify failure**

Run: `npm run test -- --run src/features/disc/discSession.test.ts`

Expected: FAIL because the state module does not exist.

- [ ] **Step 3: Define contracts and adapters**

Replace the minimal summary/copy signatures with exact DTOs from Task 1. Add an adapter subscription that unregisters its Tauri listener on cleanup; retain a deterministic browser/dev fake rather than pretending native calls work in web tests.

- [ ] **Step 4: Implement the reducer and derived action selector**

Use discriminated unions for media and job state. Map modes to action IDs `play-direct`, `use-cache`, `install-ssd`, `install-pc`, and `details`; attach explicit disabled reason strings when media or capacity makes an action unavailable.

- [ ] **Step 5: Run session tests**

Run: `npm run test -- --run src/features/disc/discSession.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/services src/features/disc/discSession.ts src/features/disc/discSession.test.ts
git commit -m "feat: model disc session and installation state"
```

### Task 3: Build the disc and installation views with focus-safe navigation

**Files:**
- Create: `src/features/disc/DiscPage.tsx`
- Create: `src/features/disc/InstallPanel.tsx`
- Create: `src/features/disc/disc-ui.test.tsx`
- Modify: `src/app/App.css`

**Interfaces:**
- Consumes `DiscSessionState`, `DiscAction`, and `DiscService` from Task 2.
- Produces `DiscPage` with `onAction(action: DiscAction)` and `InstallPanel` with `onClose(): void`.

- [ ] **Step 1: Write failing UI tests**

Cover empty, invalid, inserted, removed, insufficient-space, copy-error, copying, cache-complete, and installation-complete views. Assert `Usar cache` is unavailable when disallowed and that closing a result panel focuses the opening action.

- [ ] **Step 2: Run UI tests to verify failure**

Run: `npm run test -- --run src/features/disc/disc-ui.test.tsx`

Expected: FAIL because the views do not exist.

- [ ] **Step 3: Implement `DiscPage`**

Render the local placeholder art, title, platform, package type, origin, byte size, free space, and a stable action column. Use only local CSS and existing `ActionButton`/`StatusBadge`; apply focus registration only to enabled, rendered actions.

- [ ] **Step 4: Implement `InstallPanel`**

Render preparation, verification, copied-byte percentage, completion, cancellation, and error content. Preserve the invoking element with a ref and call `.focus()` only after the panel closes. Provide permanent completion actions `Jogar agora` and `Ir para biblioteca`; label cache completion temporary.

- [ ] **Step 5: Add console visual styling**

Extend `App.css` with a 16:9 two-column disc layout, compact action rail, staged-progress timeline, and restrained opacity/transform transitions. Use the provided disc image as an object-cover placeholder; do not add external images.

- [ ] **Step 6: Run UI tests**

Run: `npm run test -- --run src/features/disc/disc-ui.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/features/disc src/app/App.css
git commit -m "feat: add navigable disc installation interface"
```

### Task 4: Integrate Home, Library, dev media controls, and notifications

**Files:**
- Create: `src/features/library/LibraryPage.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.css`

**Interfaces:**
- Consumes the reducer and services from Task 2 and visual components from Task 3.
- Produces tab-selected Home, Disc, Library, and existing Settings placeholders in one app shell.

- [ ] **Step 1: Write failing cross-page app tests**

Test keyboard-only insertion, switch to Disc, invoke installation through progress to completion, switch to Library, observe the installed game, then remove media and observe a disc-required state on Home. Include an insert notification while on Library.

- [ ] **Step 2: Run app tests to verify failure**

Run: `npm run test -- --run src/app/App.test.tsx`

Expected: FAIL because App owns only boolean media state and has no Library page.

- [ ] **Step 3: Wire shared state through `App`**

Replace the Home-only `discInserted` boolean with the session state. Keep demo controls explicitly labelled as development simulation; inspect the demo-media path through the adapter. Route TopBar tabs to page views, subscribe/unsubscribe from native copy progress, and show non-intrusive insertion/removal notifications outside Disc.

- [ ] **Step 4: Implement `LibraryPage`**

Render permanent library records alongside existing demonstrative game cards. Mark an installed title as requiring its disc where applicable and route selection back to Disc or playable confirmation without claiming a launcher ran.

- [ ] **Step 5: Run app tests**

Run: `npm run test -- --run src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/app src/features/library
git commit -m "feat: integrate disc workflow with home and library"
```

### Task 5: Document and verify the complete increment

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes the implemented application from Tasks 1-4.
- Produces reproducible development instructions and explicit known limits.

- [ ] **Step 1: Update the project documentation**

Document how to run frontend/native tests, use the demo simulated medium, exercise cache vs permanent installation, and the intentionally unsupported features. State that the placeholder disc art is temporary and local.

- [ ] **Step 2: Run frontend tests and production build**

Run: `npm run test -- --run; npm run build`

Expected: all Vitest suites pass and TypeScript/Vite build completes without diagnostics.

- [ ] **Step 3: Run native tests and debug build**

Run: `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml; npm run tauri build -- --debug`

Expected: Rust tests pass and Tauri completes a Windows debug bundle/build. If the operating system dependency prevents bundle generation, record the exact missing dependency without weakening test results.

- [ ] **Step 4: Perform the manual keyboard smoke test**

Run the Tauri app at 1920×1080 and verify insert, detail, cache, installation, completion, library update, and removal using keyboard only. Capture local screenshots only if the desktop run is available.

- [ ] **Step 5: Commit**

```powershell
git add README.md
git commit -m "docs: document bacondisc installation workflow"
```
