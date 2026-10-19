# Game Launcher and Emulator Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch authorized local content through configured emulator profiles and restore BaconConsole after exit.

**Architecture:** Rust owns profile persistence, path validation, safe argument construction, process lifetime, and window recovery. React consumes typed commands to configure profiles and render launch/return state without exposing raw launch arguments.

**Tech Stack:** Tauri 2, Rust, React, TypeScript, Vitest, serde.

**Spec:** `docs/superpowers/specs/2026-10-19-game-launcher-emulators-design.md`

## Global Constraints

- Preserve all implemented BaconConsole UI, disc, library, and gamepad behavior.
- Use `std::process::Command`; never use a shell or manifest-provided commands/arguments.
- Launch only content under a validated installed, cache, or simulated-disc root.
- Permit one game process at once; disc removal does not end it.
- Do not download games, ROMs, BIOS, firmware, emulators, or metadata.
- RetroArch is the first enabled emulator; DuckStation and PCSX2 require installed-version capability validation.
- Do not push without explicit authorization.

## Review Focus

- Path traversal, symlink, or Windows-prefix escape must be refused by Task 1 tests.
- Existing non-`.exe` executables must remain unavailable in Task 1 tests.
- Concurrent launch must be rejected in Task 2 tests.
- Missing RetroArch core must not fall back to a guessed core in Task 2 tests.
- Process exit/failure must restore the original focus token in Task 3/4 tests.

---

## File structure

- Create `src-tauri/src/emulators.rs`: profiles, persistence, validation, builders.
- Create `src-tauri/src/launcher.rs`: launch session, runner abstraction, process recovery.
- Modify `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`, `src-tauri/tauri.conf.json`: commands, managed state, permitted events.
- Create `src-tauri/tests/emulator_profiles.rs` and `src-tauri/tests/game_launcher.rs`.
- Modify `src/services/contracts.ts` and `src/services/tauriAdapters.ts`.
- Create `src/features/launcher/launchSession.ts` and tests.
- Create `src/features/emulators/EmulatorSettingsPage.tsx` and tests.
- Modify `src/app/App.tsx`, `src/app/App.css`, `src/components/TopBar.tsx`, and `README.md`.

### Task 1: Add validated persistent emulator profiles

**Files:**
- Create: `src-tauri/src/emulators.rs`, `src-tauri/tests/emulator_profiles.rs`
- Modify: `src-tauri/src/lib.rs`, `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`

**Interfaces:**
- Produces `EmulatorProfile`, `Platform`, `EmulatorKind`, `ProfileValidation`, `resolve_profile_path`, and `retroarch_arguments`.
- Produces `list_emulator_profiles`, `save_emulator_profile`, `validate_emulator_profile`, and `set_default_emulator` commands.

- [ ] **Step 1: Write failing native profile tests**

Test relative resolution beneath app directory, absolute `.exe`, root escape rejection, non-`.exe` rejection, missing RetroArch core rejection, and exact `-L <core> <content>` arguments.

- [ ] **Step 2: Verify RED**

Run `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml --test emulator_profiles`.
Expected: FAIL because profile APIs do not exist.

- [ ] **Step 3: Implement profile registry and capability probe**

Persist profiles atomically in app-data; canonicalize executable paths; build only profile-owned arguments; run a fixed `--help` probe without user-controlled arguments.

- [ ] **Step 4: Verify GREEN and commit**

Run the Task 1 command; expect PASS. Commit with `feat: add validated emulator profiles`.

### Task 2: Implement the safe native process launcher

**Files:**
- Create: `src-tauri/src/launcher.rs`, `src-tauri/tests/game_launcher.rs`
- Modify: `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`, `src-tauri/tauri.conf.json`

**Interfaces:**
- Consumes Task 1 profile validation.
- Produces `LaunchRequest`, `LaunchState`, `GameLauncher::launch`, `launch_game`, and `get_launch_state`.

- [ ] **Step 1: Write failing launcher tests**

With an injectable process runner, assert discrete executable/argument spawn, concurrent launch rejection, missing-content error, and `Exited` state after child completion.

- [ ] **Step 2: Verify RED**

Run `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml --test game_launcher`.
Expected: FAIL because `GameLauncher` is absent.

- [ ] **Step 3: Implement session lifecycle**

Use direct `Command` arguments, mutex-backed exclusive state, native wait worker, declared lifecycle events, and window hide/show/focus recovery. Never terminate it when media changes.

- [ ] **Step 4: Verify GREEN and commit**

Run the Task 2 command; expect PASS. Commit with `feat: add safe native game launcher`.

### Task 3: Model launcher state in TypeScript

**Files:**
- Modify: `src/services/contracts.ts`, `src/services/tauriAdapters.ts`
- Create: `src/features/launcher/launchSession.ts`, `src/features/launcher/launchSession.test.ts`

**Interfaces:**
- Consumes native launcher/profile DTOs.
- Produces `LauncherService`, `EmulatorProfileService`, `launchSessionReducer`, and focus-token-aware events.

- [ ] **Step 1: Write failing state tests**

Assert `idle → launching → running → returned`, failure messages, and original focus token restoration.

- [ ] **Step 2: Verify RED**

Run `npm run test -- --run src/features/launcher/launchSession.test.ts`.
Expected: FAIL because no launcher state exists.

- [ ] **Step 3: Implement adapters and reducer**

Subscribe only in a Tauri runtime, clean up event listeners, and do not expose raw executable/arguments to ordinary play controls.

- [ ] **Step 4: Verify GREEN and commit**

Run the Task 3 command; expect PASS. Commit with `feat: model launcher lifecycle in frontend`.

### Task 4: Add emulator settings and RetroArch-first controls

**Files:**
- Create: `src/features/emulators/EmulatorSettingsPage.tsx`, `src/features/emulators/emulatorSettings.test.tsx`
- Modify: `src/app/App.tsx`, `src/app/App.css`, `src/components/TopBar.tsx`

**Interfaces:**
- Consumes Task 3 services/state.
- Produces Settings → Jogos → Emuladores and focus-safe launch transition.

- [ ] **Step 1: Write failing UI tests**

Cover configured/missing RetroArch, NES/SNES/Mega Drive/GBA core choice, unavailable DuckStation/PCSX2, loading/failure states, and focus restoration.

- [ ] **Step 2: Verify RED**

Run `npm run test -- --run src/features/emulators/emulatorSettings.test.tsx`.
Expected: FAIL because settings UI is absent.

- [ ] **Step 3: Implement UI integration**

Use existing visual components, user-initiated executable selection, enabled-only focus, default profile selection, and launch actions from Library/Disc.

- [ ] **Step 4: Verify GREEN and commit**

Run the Task 4 command; expect PASS. Commit with `feat: add emulator settings and RetroArch launch UI`.

### Task 5: Document and validate

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document setup and data ownership**

Document profile setup, authorized demo testing, RetroArch config/save ownership, capability gates, and no-download policy.

- [ ] **Step 2: Run automated verification**

Run `npm run test -- --run; npm run build; $rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml`.
Expected: all tests and web build pass.

- [ ] **Step 3: Run manual RetroArch smoke test**

Configure an installed RetroArch executable and user-authorized content, launch from Library and simulated disc, close RetroArch, and verify focus recovery. Record any unavailable dependency.

- [ ] **Step 4: Build and commit**

Run `$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"; npm run tauri build -- --debug`.
Expected: Windows debug bundle succeeds. Commit with `docs: document emulator launcher setup`.
