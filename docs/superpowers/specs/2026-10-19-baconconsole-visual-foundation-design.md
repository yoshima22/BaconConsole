# BaconConsole Visual Foundation — Design Specification

## Purpose

Create the first visual foundation for BaconConsole: a premium, console-first Windows frontend built with Tauri 2, React, and TypeScript. This delivery is intentionally static apart from local keyboard focus interaction; it creates no game, disc, storage, or backend behavior.

## Scope

The application provides a static Home demonstration using reusable visual components and placeholder game data that does not use protected covers or logos. It must feel like a console operating system at a 16:9 desktop/TV resolution, rather than a conventional web site.

## Technical Baseline

- Tauri 2 with React and TypeScript.
- Custom CSS only for the design system; no pre-styled UI library.
- Inter is the UI font and Sora is the display/title font, with safe CSS fallbacks.
- The visual system is independent from future Rust services and backend integration.

## Design Tokens

Tokens live in a dedicated CSS module and are the only source for shared color, spacing, radius, shadow, duration, easing, and z-index values.

| Token group | Required values |
| --- | --- |
| Colors | `#0B1220`, `#141D2E`, `#1C2940`, `#33435E`, `#35C2FF`, `#7DE3FF`, `#E8EEF7`, `#B7C2D6`, `#39D98A`, `#F5B942`, `#FF5C76`, `#7A6CFF` |
| Spacing | A compact 4 px base scale suitable for TV-distance reading |
| Radius | Small controls, medium panels, and large hero/shelf values |
| Shadow | Surface depth and a restrained cyan focus glow |
| Motion | Short, subtle focus, section, and modal transitions; reduced-motion support |

## Components

`AppShell` supplies the full-screen canvas and shared content bounds. `TopBar` establishes product identity and navigation. `PageTitle` labels major context. `HeroPanel` presents the selected game, and `SectionShelf` lays out horizontal rows of `GameCard` items. `ActionButton`, `StatusBadge`, and `Modal` establish shared interaction conventions.

Each component owns its markup and scoped styling while consuming design tokens. Components accept semantic props and do not depend on any eventual disc, storage, launcher, or library implementation.

## Interaction States

All interactive primitives support rest, hover, visible keyboard focus, selected, disabled, and pressed/activation feedback. Focus uses a restrained cyan outline, surface lift, and minimal scale; color alone does not communicate selection or status. Disabled controls cannot receive focus or activation.

## Static Home Demonstration

The Home page composes a top bar, a selected-game hero, and several horizontal shelves from local demo data. Artwork is generated abstractly with gradients and shapes, not third-party covers, logos, or trademarks. Layout targets 1920 × 1080 first, scales cleanly across ordinary 16:9 windows, and preserves an intentional full-screen presentation.

## Keyboard Navigation

A reusable focus-navigation hook keeps an ordered registry of enabled, visible controls. Arrow keys move within a shelf or between semantic rows; Enter confirms the focused action; Escape closes an open modal and restores the prior focused control. The hook deliberately models console navigation but does not claim hardware-gamepad support. Gamepad API behavior in WebView2 will be documented after a supported integration is built.

## Out of Scope for This Delivery

- Physical disc discovery or reading.
- Game installation, launching, saves, library persistence, or Rust commands.
- Steam, RetroAchievements, scraping, ROM/BIOS acquisition, DVD recording, and third-party installers.
- Any claim that simulated account, device, installation, or backend behavior is real.

These exclusions are temporary delivery boundaries, not permanent architectural prohibitions. Future capabilities must be added through separate adapters and service contracts rather than coupling visual components to platform-specific behavior.

## Quality Requirements

- Unit tests cover keyboard focus movement, disabled/hidden exclusion, Enter activation, and Escape focus restoration.
- The project provides a short developer document describing tokens and components.
- Build and test commands pass before handoff.
