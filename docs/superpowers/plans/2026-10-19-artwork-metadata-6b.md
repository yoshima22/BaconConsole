# BaconConsole Artwork Metadata 6B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure SteamGridDB artwork search, selection and offline cache to the local game library.

**Architecture:** Rust owns provider calls, Credential Manager secrets, URL/MIME/size validation and artwork cache writes. The SQLite catalog stores only provider identity and cache metadata. React uses Tauri commands to configure, search, choose and render local cached assets, falling back to existing demonstrative artwork.

**Tech Stack:** Tauri 2, Rust, rusqlite, Windows Credential Manager, React, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-19-artwork-metadata-6b-design.md`

## Global Constraints

- Never expose SteamGridDB API keys to the frontend, SQLite, logs or Git.
- Restrict network access and downloaded image URLs to expected HTTPS hosts.
- Accept only bounded PNG/JPEG/WebP artwork and write cache files atomically.
- ScreenScraper is a disabled adapter only; no credentials or requests.
- Preserve offline behavior, BaconDisc, launcher and existing gamepad/keyboard navigation.

## Review Focus

- Redirects or URLs targeting local/private addresses must be rejected before download.
- A failed refresh must not replace a valid selected local artwork.
- Ambiguous title search must not automatically overwrite game metadata.
- Missing credentials must return an explicit configuration state without a network request.
- Cached images must remain usable when the API is unreachable.

---

### Task 1: Secure metadata configuration and catalog records

**Files:**
- Modify: `src-tauri/Cargo.toml`, `src-tauri/src/catalog.rs`, `src-tauri/src/main.rs`
- Create: `src-tauri/src/metadata.rs`, `src-tauri/tests/metadata_catalog.rs`

**Interfaces:**
- Produces `MetadataStore` APIs for source IDs and selected artwork without secrets.
- Produces credential backend APIs reporting only `configured`.

- [ ] Write failing tests for artwork-selection persistence and for a missing key producing `notConfigured`.
- [ ] Run the focused Cargo test and confirm it fails because metadata APIs are absent.
- [ ] Implement migrations for provider mappings/artwork selections and a Windows Credential Manager-backed key store.
- [ ] Re-run focused tests, then full `cargo test --manifest-path src-tauri/Cargo.toml`.
- [ ] Commit catalog and secret-store work.

### Task 2: SteamGridDB provider and safe cache

**Files:**
- Modify: `src-tauri/src/metadata.rs`, `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`
- Create: `src-tauri/tests/metadata_provider.rs`

**Interfaces:**
- Produces `MetadataProvider::search`, `artwork_for_game`, and cache selection commands.
- Consumes configured secure key and catalog mapping APIs.

- [ ] Write failing tests for an empty/ambiguous result, rejected URL/MIME/size, hash deduplication and cache retention after failed download.
- [ ] Run focused tests and confirm failures are caused by absent provider/cache code.
- [ ] Implement SteamGridDB v2 request parsing with bounded results, explicit HTTP failure handling, host validation, atomic cache writes and a no-request ScreenScraper placeholder.
- [ ] Add Tauri commands that return safe DTOs and never return the API key.
- [ ] Re-run focused and full native suites.
- [ ] Commit provider and cache work.

### Task 3: Typed frontend services and artwork resolution

**Files:**
- Modify: `src/services/contracts.ts`, `src/services/tauriAdapters.ts`, `src/features/disc/artwork.ts`
- Create: `src/features/library/metadataState.ts`, `src/features/library/metadataState.test.ts`

**Interfaces:**
- Produces provider status, candidate and artwork-choice TypeScript types.
- Produces resolver order: cached selection, approved demonstrative art, default background.

- [ ] Write failing frontend tests for the resolver fallback and `notConfigured` state.
- [ ] Run the focused Vitest test and confirm it fails for missing contracts/state.
- [ ] Implement typed adapter and pure selection state without embedding credentials.
- [ ] Re-run focused and complete web test suites.
- [ ] Commit frontend metadata contracts.

### Task 4: Library details and integration settings UI

**Files:**
- Modify: `src/features/library/LibraryPage.tsx`, `src/features/emulators/EmulatorSettingsPage.tsx`, `src/app/App.tsx`, `src/app/App.css`
- Create: `src/features/library/ArtworkPicker.tsx`, `src/features/library/ArtworkPicker.test.tsx`

**Interfaces:**
- Consumes catalog games and metadata adapter state.
- Produces keyboard/gamepad-focusable configuration, search, candidate and artwork choice views.

- [ ] Write failing component tests for no-key guidance, multiple-result selection and offline fallback rendering.
- [ ] Run focused Vitest tests and confirm they fail because the picker is absent.
- [ ] Implement settings card for key entry, provider status, manually initiated search and explicit candidate/art selection.
- [ ] Integrate selected local assets in library/detail rendering while retaining existing fallback artwork.
- [ ] Re-run full web and native tests; run `npm run build`.
- [ ] Commit UI and documentation changes.

### Task 5: Final verification and manual validation guide

**Files:**
- Modify: `README.md`

- [ ] Document cache location, provider configuration, offline behavior and how to clear/update artwork without exposing a key.
- [ ] Run `npm run build`, `npm test -- --run`, and `cargo test --manifest-path src-tauri/Cargo.toml`.
- [ ] Inspect `git diff --check` and working tree state.
- [ ] Commit the final documentation only after all checks are green.
