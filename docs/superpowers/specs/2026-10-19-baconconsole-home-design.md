# BaconConsole Home — Design Specification

## Purpose

Extend the visual foundation with a console-first Home screen that is fully navigable without a mouse and remains a static local demonstration. It prepares clear seams for future physical-disc, emulator, installation, and game-library integrations without pretending that those integrations exist.

## Layout

The 1920 × 1080-first, 16:9 layout contains a persistent top bar, selected-game hero, horizontal recent-games shelf, contextual disc panel, and controller-hint footer. It uses the existing navy, graphite, silver, cyan, Inter, and Sora system. All artwork is locally authored abstract imagery, never a protected cover or logo.

## Home State Model

`HomeDemoState` is local UI state only. It includes the selected game ID, selected top-level tab, disc state (`empty` or `inserted`), controller state (`connected` or `disconnected`), and an optional installation progress value. Demo game flags distinguish installed games and games that require a disc.

The developer panel may toggle inserted/removed media and installation progress. Insertion updates the Home disc panel immediately; removal restores the no-disc presentation. The app displays a non-intrusive toast when a simulated disc changes while the current page is not Home. No backend call, file access, device read, account request, or actual installation occurs.

## Input Abstraction

`GamepadFocusManager` accepts normalized semantic input actions rather than browser-specific controller button numbers: `move-up`, `move-down`, `move-left`, `move-right`, `confirm`, `back`, `previous-tab`, and `next-tab`.

The keyboard adapter maps Arrow keys, Enter, Escape, and appropriate shoulder-key equivalents. The browser Gamepad API adapter polls defensively and maps only recognized standard layouts; unsupported controllers remain safely connected-but-unmapped. The UI preserves the active focus target before a modal opens and restores it after it closes. Disabled and hidden elements cannot be selected.

## Components

- `HomeHero`: selected-game metadata and compatible actions.
- `RecentGamesShelf`: focusable horizontal set of recent games.
- `DiscStatus`: empty and inserted-media presentations, plus compatible actions.
- `GameSelectionCard`: Home-specific composition around the existing game-card styling.
- `ControllerHints`: footer legend for the available normalized actions.
- `ConsoleNotification`: non-modal, time-limited local status message.
- `GamepadFocusManager`: non-visual hook/provider that owns input routing and focus restoration.

## Acceptance and Boundaries

The Tauri app must open on Home; selection updates the hero; keyboard/gamepad navigation works without a mouse; simulated disc insertion/removal updates visible state; focus remains coherent; and full-screen presentation remains usable. Physical DVD reading, real account/device/install behavior, Steam, RetroAchievements, scraping, protected placeholder artwork, and backend stubs are excluded from this delivery.
