# Console Experience and Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver console-native overlays, game details and Integration settings with a securely testable SteamGridDB connection state.

**Architecture:** React components own presentation and focus behavior, while Tauri adapters invoke narrow Rust commands. A reusable overlay provider owns a modal stack and notification queue. The Rust metadata module owns SteamGridDB verification and returns sanitized connection state without exposing secrets.

**Tech Stack:** React 18, TypeScript, Vitest/Testing Library, Tauri 2, Rust, rusqlite, reqwest, Windows Credential Manager.

**Spec:** `docs/superpowers/specs/2026-10-20-console-experience-and-integrations-design.md`

## Global Constraints

- Keep keyboard and standard-mapping gamepad operation complete; Enter/A confirms and Escape/B closes the highest overlay.
- Do not use `window.confirm`, `window.alert`, browser dialogs or plaintext credential storage for product flows.
- Do not implement Steam discovery, ScreenScraper network traffic, RetroAchievements network traffic, emulator changes or physical media reading in this delivery.
- Never return credentials, headers, raw remote response bodies or local secret paths to the frontend.
- Preserve the existing artwork cache validation, offline fallbacks and all BaconDisc/launcher safety checks.
- Every production behavior begins with a failing automated test and ends with relevant test and build verification.

## Review Focus

- A modal opener removed while the modal is open must restore focus safely to the active page rather than throw; covered in Task 1.
- A SteamGridDB network timeout, 401 or 429 must produce a distinct sanitized state and preserve offline cache; covered in Task 4.
- A configured key must never render in input value, notices, adapter responses or database records; covered in Tasks 3 and 4.
- A game with no selected or unreadable artwork must retain a legible detail panel using the default background; covered in Task 2.
- A non-standard or disconnected gamepad must not prevent keyboard focus and Escape from closing overlays; covered in Task 1.

---

## File Structure

- `src/components/ConsoleModal.tsx`: accessible confirmation/information overlay with focus capture and restoration.
- `src/components/ConsoleNotification.tsx`: non-blocking status/error notification queue presentation.
- `src/components/OverlayHost.tsx`: application-level modal and notification state API.
- `src/components/overlay.test.tsx`: focus, keyboard and notification component tests.
- `src/features/library/GameDetailsPanel.tsx`: game detail surface and installation choice.
- `src/features/library/gameDetailsPanel.test.tsx`: artwork fallback, play confirmation and installation selection tests.
- `src/features/integrations/IntegrationsPage.tsx`: service cards and SteamGridDB configuration flow.
- `src/features/integrations/integrationsPage.test.tsx`: connection-state and no-fake-service UI tests.
- `src/features/integrations/integrationState.ts`: state labels and action mapping independent of React.
- `src/features/integrations/integrationState.test.ts`: state mapping tests.
- `src/services/contracts.ts`: integration status and test-result types plus `MetadataService` methods.
- `src/services/tauriAdapters.ts`: Tauri adapter calls for integration summaries and SteamGridDB verification.
- `src/features/library/ArtworkPicker.tsx`: central-configuration route/request when SteamGridDB is unavailable.
- `src/app/App.tsx`: host overlays, game details, integrations tab/panel routing and replacement of native dialogs.
- `src/app/App.css`, `src/app/artwork.css`, `src/design-system/global.css`: console transitions, overlay, detail and integration styling.
- `src-tauri/src/metadata.rs`: sanitized SteamGridDB connection test and typed failure classification.
- `src-tauri/src/commands.rs`: Tauri commands for integration status and configure-and-test operation.
- `src-tauri/src/main.rs`: command registration.
- `src-tauri/tests/metadata_provider.rs`: metadata parsing and connection-state classification tests.

## Tasks

### Task 1: Overlay host, modal, notification and focus behavior

**Files:**
- Create: `src/components/ConsoleModal.tsx`
- Create: `src/components/ConsoleNotification.tsx`
- Create: `src/components/OverlayHost.tsx`
- Create: `src/components/overlay.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.css`
- Modify: `src/design-system/global.css`

**Interfaces:**
- Produces `useOverlay(): { confirm(request: ConfirmRequest): Promise<boolean>; notify(notification: NotificationRequest): void }`.
- `ConfirmRequest` contains `title`, `message`, `confirmLabel`, optional `cancelLabel` and optional `destructive`.
- `NotificationRequest` contains `message` and `kind: 'info' | 'success' | 'error'`.
- Later tasks call `useOverlay().confirm` rather than browser dialogs.

- [ ] **Step 1: Write failing overlay component tests**

```tsx
it('confirms with Enter and restores focus to the opener after Escape', async () => {
  render(<OverlayHarness />);
  const opener = screen.getByRole('button', { name: 'Abrir confirmação' });
  opener.focus();
  await userEvent.click(opener);
  await userEvent.keyboard('{Escape}');
  expect(opener).toHaveFocus();
});

it('does not move focus for a status notification', () => {
  render(<OverlayHarness />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the overlay test to verify it fails**

Run: `npm test -- --run src/components/overlay.test.tsx`

Expected: FAIL because `OverlayHost` and `useOverlay` do not exist.

- [ ] **Step 3: Implement overlay API and components**

Implement `OverlayHost` with a context-backed single confirmation queue and transient notifications. `ConsoleModal` must use `role="dialog"`, `aria-modal="true"`, initial focus on the safe action, Escape/B handling, and focus restoration only when the original element remains connected and enabled. Add CSS entrance/exit transitions with reduced-motion override.

- [ ] **Step 4: Run overlay tests to verify they pass**

Run: `npm test -- --run src/components/overlay.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components src/app/App.tsx src/app/App.css src/design-system/global.css
git commit -m "feat: add console overlays and notifications"
```

### Task 2: Library game details and console launch confirmation

**Files:**
- Create: `src/features/library/GameDetailsPanel.tsx`
- Create: `src/features/library/gameDetailsPanel.test.tsx`
- Modify: `src/features/library/LibraryPage.tsx`
- Modify: `src/features/library/libraryLaunch.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/artwork.css`
- Modify: `src/app/App.css`

**Interfaces:**
- Consumes `useOverlay().confirm` from Task 1.
- Produces `GameDetailsPanel({ game, artwork, onPlay, onClose }): JSX.Element`.
- `onPlay(installationId: number): Promise<void>` receives the explicitly chosen available installation.

- [ ] **Step 1: Write failing detail-panel tests**

```tsx
it('uses the default background and retains play text when art is absent', () => {
  render(<GameDetailsPanel game={gameWithoutArtwork} artwork={{ background: '/assets/baconconsole-default-bg.png' }} onPlay={vi.fn()} onClose={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Jogar Chrono' })).toBeEnabled();
});

it('requests console confirmation before launching the selected installation', async () => {
  render(<LibraryHarness game={gameWithTwoInstallations} />);
  await userEvent.click(screen.getByRole('button', { name: 'Jogar Chrono' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run detail-panel tests to verify they fail**

Run: `npm test -- --run src/features/library/gameDetailsPanel.test.tsx src/features/library/libraryLaunch.test.tsx`

Expected: FAIL because the details panel and overlay-based launch flow do not exist.

- [ ] **Step 3: Implement details and migrate Library launch**

Make game card selection open `GameDetailsPanel`; leave card quick actions only when still useful. Render backdrop art via CSS background plus gradient overlay, display cover/metadata/installations, and disable unavailable installations without placing them in the normal action focus order. Replace `window.confirm` with the overlay promise and emit sanitized launch failures through notifications.

- [ ] **Step 4: Run library tests to verify they pass**

Run: `npm test -- --run src/features/library/gameDetailsPanel.test.tsx src/features/library/libraryLaunch.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/library src/app/App.tsx src/app/App.css src/app/artwork.css
git commit -m "feat: add console game details flow"
```

### Task 3: Integration status contract and Settings UI

**Files:**
- Create: `src/features/integrations/integrationState.ts`
- Create: `src/features/integrations/integrationState.test.ts`
- Create: `src/features/integrations/IntegrationsPage.tsx`
- Create: `src/features/integrations/integrationsPage.test.tsx`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/tauriAdapters.ts`
- Modify: `src/features/library/ArtworkPicker.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.css`

**Interfaces:**
- Adds `IntegrationId = 'steam' | 'steamgriddb' | 'screenscraper' | 'retroachievements'`.
- Adds `IntegrationStatus = { id: IntegrationId; state: 'notConfigured' | 'configured' | 'checking' | 'connected' | 'error' | 'unavailable'; detail: string }`.
- Extends `MetadataService` with `integrationStatus(): Promise<IntegrationStatus[]>` and `configureAndTestSteamGridDb(key: string): Promise<IntegrationStatus>`.
- `ArtworkPicker` receives `onOpenIntegrations(): void` and never renders the API-key input itself.

- [ ] **Step 1: Write failing integration state and page tests**

```tsx
it('labels unimplemented providers as unavailable without fake account data', () => {
  expect(presentationFor({ id: 'retroachievements', state: 'unavailable', detail: 'Integração será adicionada em etapa posterior.' }).action).toBeUndefined();
});

it('opens a protected key modal only for SteamGridDB', async () => {
  render(<IntegrationsPage statuses={statuses} service={service} />);
  await userEvent.click(screen.getByRole('button', { name: 'Configurar SteamGridDB' }));
  expect(screen.getByLabelText('Chave SteamGridDB')).toHaveAttribute('type', 'password');
});
```

- [ ] **Step 2: Run integration UI tests to verify they fail**

Run: `npm test -- --run src/features/integrations/integrationState.test.ts src/features/integrations/integrationsPage.test.tsx`

Expected: FAIL because the contract, presentation mapper and page do not exist.

- [ ] **Step 3: Implement the shared status contract and page**

Render cards with state-specific copy and no synthetic data. Configure SteamGridDB through `ConsoleModal` content; clear its local input after submission and use only returned status. Make the existing Settings view render Emulators and Integrações as sub-navigation. Update `ArtworkPicker` to show a focused `Abrir integrações` action whenever SteamGridDB is not connected.

- [ ] **Step 4: Run integration UI tests to verify they pass**

Run: `npm test -- --run src/features/integrations/integrationState.test.ts src/features/integrations/integrationsPage.test.tsx src/features/library/ArtworkPicker.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/integrations src/features/library/ArtworkPicker.tsx src/services src/app/App.tsx src/app/App.css
git commit -m "feat: add integration settings experience"
```

### Task 4: Secure SteamGridDB test endpoint and status aggregation

**Files:**
- Modify: `src-tauri/src/metadata.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/tests/metadata_provider.rs`

**Interfaces:**
- Adds `IntegrationStatus` Rust serializable response matching Task 3.
- Adds `SteamGridDbProvider::connection_status() -> MetadataResult<IntegrationStatus>`.
- Adds `integration_status() -> Vec<IntegrationStatus>` and `configure_and_test_steamgriddb(api_key: String) -> Result<IntegrationStatus, String>` commands.
- Uses `WindowsCredentialStore` only inside Rust.

- [ ] **Step 1: Write failing Rust tests for sanitized connection states**

```rust
#[test]
fn classifies_unauthorized_and_rate_limited_connection_checks_without_secret_text() {
    assert_eq!(classify_connection_status(StatusCode::UNAUTHORIZED), IntegrationState::Error);
    assert_eq!(classify_connection_status(StatusCode::TOO_MANY_REQUESTS), IntegrationState::Error);
}

#[test]
fn unavailable_integrations_have_no_account_payload() {
    let status = unavailable_status(IntegrationId::RetroAchievements);
    assert_eq!(status.state, IntegrationState::Unavailable);
    assert!(!status.detail.contains("token"));
}
```

- [ ] **Step 2: Run metadata tests to verify they fail**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test metadata_provider`

Expected: FAIL because integration state and test command helpers do not exist.

- [ ] **Step 3: Implement status aggregation and secure connection test**

Use a bounded, authenticated SteamGridDB endpoint that does not download artwork. Convert 401, 429 and transport failures into Portuguese sanitized detail strings. Keep a configured key after the remote test fails; never include it in any serializable type. Return static `unavailable` records for Steam, ScreenScraper and RetroAchievements in this delivery.

- [ ] **Step 4: Run Rust metadata tests to verify they pass**

Run: `cargo test --manifest-path src-tauri/Cargo.toml --test metadata_provider`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src-tauri/src/metadata.rs src-tauri/src/commands.rs src-tauri/src/main.rs src-tauri/tests/metadata_provider.rs
git commit -m "feat: verify SteamGridDB integration securely"
```

### Task 5: End-to-end wiring, keyboard/gamepad regression coverage and documentation

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/hooks/gamepadInput.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes overlay, library details and integration status interfaces from Tasks 1–4.
- Produces no new public service API.

- [ ] **Step 1: Write failing application integration tests**

```tsx
it('closes the integration key modal with Escape and returns to Settings', async () => {
  render(<App />);
  // navigate to Configurações → Integrações, open configuration, escape
  expect(screen.getByRole('heading', { name: 'Integrações' })).toBeInTheDocument();
});

it('maps gamepad B to close an open console overlay', () => {
  expect(mapStandardGamepad(standardPad({ 1: true }))).toContain('back');
});
```

- [ ] **Step 2: Run application tests to verify they fail**

Run: `npm test -- --run src/app/App.test.tsx src/hooks/gamepadInput.test.ts`

Expected: FAIL because App does not yet expose the integration navigation and modal close behavior.

- [ ] **Step 3: Wire overlay-aware back handling and document user flows**

Route normalized `back` to the top overlay before page navigation. Ensure Settings exposes the Emuladores and Integrações sections without changing top-level tab count. Update README with exact paths for SteamGridDB configuration and the honest availability of Steam, ScreenScraper and RetroAchievements.

- [ ] **Step 4: Run focused and full verification**

Run: `npm test -- --run`

Expected: PASS for all frontend tests.

Run: `cargo test --manifest-path src-tauri/Cargo.toml`

Expected: PASS for all Rust tests.

Run: `npm run build`

Expected: PASS with production assets generated.

- [ ] **Step 5: Commit**

```powershell
git add src/app/App.tsx src/app/App.test.tsx src/hooks/gamepadInput.test.ts README.md
git commit -m "docs: document console integrations flow"
```
