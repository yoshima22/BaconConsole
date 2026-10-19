# BaconConsole Visual Foundation and Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri 2/React/TypeScript BaconConsole shell and a static, keyboard/gamepad-navigable Home demonstration.

**Architecture:** React owns static presentation and normalized local input state; Tauri is scaffolded as the Windows host without application commands in this delivery. CSS design tokens underpin small reusable components, while Home state is demonstrative and isolated from future service adapters.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Vitest, Testing Library, custom CSS.

**Spec:** `docs/superpowers/specs/2026-10-19-baconconsole-visual-foundation-design.md`; `docs/superpowers/specs/2026-10-19-baconconsole-home-design.md`

## Global Constraints

- Use the exact approved palette and Inter/Sora typography; do not use a pre-styled UI library.
- All demo art is locally authored abstract CSS/SVG treatment, never protected game covers or logos.
- Keep this delivery static: no Rust commands, device I/O, fake backend requests, real installs, accounts, or physical disc handling.
- Navigation excludes invisible or disabled targets and restores prior focus after a modal closes.
- Respect `prefers-reduced-motion` and target 1920 × 1080 while adapting to 16:9 windows.

## Review Focus

- A disabled game action is never chosen by keyboard or gamepad input; test focus registration filtering in Task 4.
- Escape closes a modal and returns focus to precisely the prior control; test in Task 5.
- A disconnected or non-standard controller cannot emit unbounded repeated actions; test input normalization in Task 7.
- Removing a disc while its contextual action has focus returns focus to a visible fallback; test state reconciliation in Task 8.
- A narrow 16:9 window preserves accessible labels and reachable controller hints; verify visually in Task 10.

---

## File Structure

- `src/design-system/tokens.css`: design-token source of truth.
- `src/design-system/global.css`: reset, typography, state, and motion rules.
- `src/components/*`: focused visual components and their styles.
- `src/hooks/*`: focus registry and normalized keyboard/gamepad input.
- `src/features/home/*`: demo data, local Home state, and Home-specific compositions.
- `src/test/*`: shared Vitest setup and behavioral tests.
- `docs/design-system.md`: concise component/token reference.

### Task 1: Scaffold the Windows host and test runner

**Files:**
- Create: Tauri 2/Vite-generated host files, `package.json`, `vite.config.ts`, `src/test/setup.ts`

**Interfaces:**
- Produces: `npm run dev`, `npm run test`, `npm run tauri dev`.

- [ ] **Step 1: Create a failing smoke test**

Write `src/app/App.test.tsx` asserting that the future app renders the name “BaconConsole”.

- [ ] **Step 2: Run the smoke test**

Run: `npm run test -- --run src/app/App.test.tsx`
Expected: FAIL because the app/test configuration does not exist.

- [ ] **Step 3: Scaffold Tauri 2 + Vite React TypeScript and add Vitest**

Create the standard Tauri host and minimal `App` that renders `BaconConsole`; configure jsdom and Testing Library.

- [ ] **Step 4: Verify the smoke test and host**

Run: `npm run test -- --run src/app/App.test.tsx` and `npm run build`
Expected: PASS and a successful Vite build.

- [ ] **Step 5: Commit**

Commit message: `chore: scaffold tauri react application`

### Task 2: Establish tokens and global states

**Files:**
- Create: `src/design-system/tokens.css`, `src/design-system/global.css`, `src/design-system/tokens.test.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: CSS variables consumed by every component.

- [ ] **Step 1: Write failing token assertions**

Assert that the rendered root exposes `--color-background-primary` as `#0B1220` and the focus token as `#35C2FF`.

- [ ] **Step 2: Run token test to verify failure**

Run: `npm run test -- --run src/design-system/tokens.test.ts`
Expected: FAIL because tokens are absent.

- [ ] **Step 3: Add the approved token scale and global styles**

Define palette, spacing, radius, shadows, typography, focus/hover/selected/disabled states, and reduced-motion overrides; import them from the entry point.

- [ ] **Step 4: Verify token tests**

Run: `npm run test -- --run src/design-system/tokens.test.ts`
Expected: PASS.

### Task 3: Build reusable visual primitives

**Files:**
- Create: `src/components/{AppShell,TopBar,PageTitle,ActionButton,StatusBadge,Modal}/`, tests beside each component

**Interfaces:**
- Produces: `AppShell`, `TopBar`, `PageTitle`, `ActionButton`, `StatusBadge`, and controlled `Modal` props.

- [ ] **Step 1: Write failing component behavior tests**

Test an accessible action button, a status badge label, and a closed/open modal with an accessible dialog role.

- [ ] **Step 2: Run the component tests to verify failure**

Run: `npm run test -- --run src/components`
Expected: FAIL because primitive components are absent.

- [ ] **Step 3: Implement the primitives with token-only styling**

Use semantic HTML, visible focus treatment, and a controlled `Modal` with `open`, `onClose`, and `restoreFocusTo` props.

- [ ] **Step 4: Verify component tests**

Run: `npm run test -- --run src/components`
Expected: PASS.

### Task 4: Create cards, hero, shelves, and static demonstration data

**Files:**
- Create: `src/components/{GameCard,HeroPanel,SectionShelf}/`, `src/features/home/demoGames.ts`, tests

**Interfaces:**
- Consumes: visual primitives from Task 3.
- Produces: `DemoGame`, `GameCard`, `HeroPanel`, and `SectionShelf`.

- [ ] **Step 1: Write failing selection tests**

Render demo games and assert that selected state is exposed accessibly while disabled cards/actions cannot be tabbed to.

- [ ] **Step 2: Run selection tests to verify failure**

Run: `npm run test -- --run src/features/home`
Expected: FAIL because the demo model and components are absent.

- [ ] **Step 3: Implement abstract-art cards, hero, and horizontal shelf**

Define `DemoGame` with installation/disc flags and create local gradient artwork from stable color seeds.

- [ ] **Step 4: Verify selection tests**

Run: `npm run test -- --run src/features/home`
Expected: PASS.

### Task 5: Implement keyboard focus management and modal restoration

**Files:**
- Create: `src/hooks/useSpatialKeyboardNavigation.ts`, `src/hooks/useSpatialKeyboardNavigation.test.ts`

**Interfaces:**
- Produces: `registerTarget(target: FocusTarget): () => void`, `move(direction)`, `confirm()`, `back()`.

- [ ] **Step 1: Write failing focus tests**

Test directional movement, invisibility/disabled filtering, Enter activation, and Escape restoration after a dialog.

- [ ] **Step 2: Run focus tests to verify failure**

Run: `npm run test -- --run src/hooks/useSpatialKeyboardNavigation.test.ts`
Expected: FAIL because the hook is absent.

- [ ] **Step 3: Implement the ordered focus registry**

Use stable target IDs and directional relationships constrained to currently enabled, rendered targets.

- [ ] **Step 4: Verify focus tests**

Run: `npm run test -- --run src/hooks/useSpatialKeyboardNavigation.test.ts`
Expected: PASS.

### Task 6: Compose the Stage 1 Home demo and document it

**Files:**
- Modify: `src/app/App.tsx`
- Create: `docs/design-system.md`, `README.md`

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces: a static, keyboard-navigable Home.

- [ ] **Step 1: Write a failing integration test**

Assert that selecting a shelf game updates the hero title.

- [ ] **Step 2: Run the integration test to verify failure**

Run: `npm run test -- --run src/app/App.test.tsx`
Expected: FAIL because selection is not wired to the hero.

- [ ] **Step 3: Compose the static Home and write usage documentation**

Keep data local; explain token groups, component responsibilities, and available development commands.

- [ ] **Step 4: Verify Stage 1**

Run: `npm run test -- --run` and `npm run build`
Expected: all tests and build PASS.

### Task 7: Add normalized gamepad input

**Files:**
- Create: `src/hooks/gamepadInput.ts`, `src/hooks/gamepadInput.test.ts`, `src/features/home/GamepadFocusManager.tsx`

**Interfaces:**
- Produces: `NormalizedInputAction` and `createGamepadAdapter(onAction): GamepadAdapter`.

- [ ] **Step 1: Write failing mapping tests**

Test standard-layout D-pad/stick, confirm/back mapping, tab switching, disconnect, unknown mappings, and repeat throttling.

- [ ] **Step 2: Run adapter tests to verify failure**

Run: `npm run test -- --run src/hooks/gamepadInput.test.ts`
Expected: FAIL because the adapter is absent.

- [ ] **Step 3: Implement defensive Gamepad API polling**

Normalize recognized controls into semantic actions and report connection without assuming every browser device layout.

- [ ] **Step 4: Verify adapter tests**

Run: `npm run test -- --run src/hooks/gamepadInput.test.ts`
Expected: PASS.

### Task 8: Model and render Home contextual states

**Files:**
- Create: `src/features/home/{homeState,HomeHero,RecentGamesShelf,DiscStatus,GameSelectionCard,ControllerHints,ConsoleNotification,DeveloperPanel}.tsx`, tests

**Interfaces:**
- Consumes: `DemoGame`, focus manager, normalized input.
- Produces: `useHomeDemoState()` and Home-specific visual components.

- [ ] **Step 1: Write failing state-transition tests**

Test no disc, insertion, removal, installed/needs-disc statuses, progress, controller status, notification, and focused-disc-action fallback on removal.

- [ ] **Step 2: Run state-transition tests to verify failure**

Run: `npm run test -- --run src/features/home/homeState.test.ts`
Expected: FAIL because the reducer/components are absent.

- [ ] **Step 3: Implement a pure local reducer and Home components**

Use explicit demo actions only; write notification copy that says “simulated” and never invoke a backend.

- [ ] **Step 4: Verify state-transition tests**

Run: `npm run test -- --run src/features/home/homeState.test.ts`
Expected: PASS.

### Task 9: Integrate the navigable Home

**Files:**
- Modify: `src/app/App.tsx`, `src/components/TopBar/*`
- Create: `src/features/home/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: Tasks 5, 7, and 8.
- Produces: full Home navigation and static top-level tabs.

- [ ] **Step 1: Write failing end-to-end component tests**

Test arrow selection updates hero, Enter triggers compatible action, Escape closes a modal/restores focus, shoulder actions move tabs, and developer simulation updates the disc panel.

- [ ] **Step 2: Run integration tests to verify failure**

Run: `npm run test -- --run src/features/home/HomeScreen.test.tsx`
Expected: FAIL because Home integrations are absent.

- [ ] **Step 3: Integrate input, top bar, hero, shelf, disc, footer, and dev panel**

Preserve Stage 1 primitive APIs and ensure only visible enabled elements are registered.

- [ ] **Step 4: Verify integration tests**

Run: `npm run test -- --run src/features/home/HomeScreen.test.tsx`
Expected: PASS.

### Task 10: Validate full-screen behavior and document limitations

**Files:**
- Modify: `README.md`, `docs/design-system.md`

- [ ] **Step 1: Add a failing layout-contract test**

Assert landmark labels and controller hints remain in the Home render at 16:9 viewport dimensions.

- [ ] **Step 2: Run it to verify failure**

Run: `npm run test -- --run src/features/home/HomeScreen.test.tsx`
Expected: FAIL before the final responsive accessibility changes.

- [ ] **Step 3: Add responsive refinements and limitation notes**

Document Gamepad API/WebView2 observations, simulated-only boundaries, local demo controls, and the manual 1920 × 1080 capture procedure.

- [ ] **Step 4: Run final verification**

Run: `npm run test -- --run`, `npm run build`, and `npm run tauri build`
Expected: all commands PASS; if Rust is unavailable, report `npm` results and list Tauri build as environment-blocked.

- [ ] **Step 5: Commit**

Commit message: `feat: add navigable baconconsole home`
