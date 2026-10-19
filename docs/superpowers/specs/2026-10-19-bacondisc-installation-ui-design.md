# BaconDisc Installation UI Design

## Purpose

This increment turns the existing simulated BaconDisc backend into a console-oriented
experience for inspecting a mounted disc, choosing an allowed action, installing or
caching its files, and seeing the resulting game in the library. It is for a local
Windows MVP and intentionally excludes physical optical drives, stores, scraping,
and third-party installers.

## Scope and constraints

- Preserve the existing Home and its visual design system.
- Use the supplied circular-disc image only as a local, provisional placeholder.
- Derive every offered disc action from the validated `bacon.json` modes; never
  infer permissions from the UI.
- Support simulated `portable` Windows packages only in this increment.
- Do not execute arbitrary manifest commands. Direct launch remains an explicitly
  confirmed action and may target only the validated, relative `entryPoint`.
- Keep keyboard and normalized gamepad navigation equivalent; disabled or hidden
  actions cannot receive focus.
- Keep the simulated-disc adapter separate from any future physical-drive adapter.

## Architecture

### Application state

Introduce a focused `discSession` state boundary shared by Home, Disc, and Library.
It models media as `empty`, `loading`, `inserted`, `invalid`, or `removed`. An
inserted state contains the validated summary, its source path, derived action
availability, media size, and free space for supported destinations.

An `installJob` is independent from media presentation and has the explicit states
`idle`, `preparing`, `verifying`, `copying`, `completed`, `cancelled`, and `failed`.
It records a `target` of `cache`, `ssd`, or `pc`, copied and total byte counts, and
a human-readable non-sensitive error message. A reducer owns state transitions so
the UI cannot enter impossible combinations such as completed installation with no
recorded destination.

The active page remains owned by the app shell. `TopBar` changes pages; the Disc
page is the authoritative detail view and Home only renders a concise reflection of
the same session. Closing a modal restores its recorded focus target.

### Service boundary

Extend the TypeScript `DiscService` contract rather than binding view components to
Tauri commands. The Tauri adapter remains the implementation used by the desktop
app; tests may use a deterministic in-memory fake.

The Rust command surface expands the existing safe manifest/copy layer with:

- inspection data for `platform`, `packageType`, total manifest bytes and allowed
  modes;
- a destination-space query;
- a verified copy operation reporting byte progress to the frontend;
- cancellation observed between files/chunks; and
- local registration of a completed permanent installation or temporary cache
  entry.

Only validated manifest file paths are copied. Copying continues to verify each
declared digest before it writes the corresponding file. The UI must display a
native failure, removed-media condition, or insufficient-space result as an error
state; it must not fabricate a successful copy.

### Destinations and library

`cache` is a temporary, app-managed location and is visually labelled as such. It
does not create a permanent library installation. `ssd` uses the BaconConsole
managed storage root. `pc` is a user-chosen directory selected through a deliberate
native picker; no file-picker dialog appears until that action is selected.

The library stores lightweight local records: game identity, title, installation
path, install kind (`permanent` or `cache`), and whether original media is required
to play. The Home and Library read these records through a `GameLibrary` contract.
Removing media never removes an installed record, but it makes disc-required play
unavailable and communicates that state clearly.

## User experience

### Disc page

The Disc tab presents the supplied placeholder art, title, platform, package/media
type, origin (`Disco simulado`), total size, and relevant free-space figure. It has
clear variants for no disc, invalid disc, removed media, and unavailable actions.

Action cards appear in a stable order and only when permitted:

1. `Jogar do disco` for `play-direct` packages whose entry point is valid;
2. `Usar cache` for a cache-capable mode;
3. `Instalar no SSD` for `copy-to-storage`;
4. `Instalar no PC` when the portable package supports a user-selected installation;
5. `Ver detalhes` when an inserted manifest exists.

Unavailable action cards stay informative but disabled, with a reason. The action
list itself is driven by a pure selector so visual states and focus rules match the
manifest exactly.

### Installation and cache

Choosing cache or installation opens one console-style panel. It first shows the
target and free space, then moves through preparation, verification, and real byte
progress from the native copy operation. The panel exposes cancellation while an
operation is active.

On success, a permanent install offers `Jogar agora` and `Ir para biblioteca`.
Cache success labels the result temporary and returns to disc actions or offers
play when the manifest permits it. Failure, insufficient space, cancellation, and
media removal have distinct copy and safe recovery actions.

### Navigation and feedback

The current normalized input mapping retains arrows/left stick for movement,
Enter/A/Cross for confirmation, Escape/B/Circle for back, and shoulder buttons for
tabs. The focus manager registers only visible, enabled controls and restores the
last triggering control after a panel closes. Mouse remains supported as a
secondary input.

Insertion and removal outside the Disc page generate a compact notification.
Home uses the shared session to show disc information immediately, and Library
updates after permanent installation without reloading the app.

## Error handling and safety

- An invalid or unreadable `bacon.json` produces an invalid-media state with no
  install or launch actions.
- Free-space checks occur before copy and again when a destination refuses data.
- Missing files, digest mismatches, I/O failures, cancellation, and removed media
  become failed/cancelled jobs and leave no registered permanent installation.
- Relative-path validation, canonical-root checks, and executable allowlisting stay
  in Rust. No UI state can bypass them.
- Direct play requires an explicit confirmation. This increment does not add
  manifest-provided command arguments, shells, installers, or arbitrary launchers.

## Testing and acceptance evidence

- TypeScript tests cover action derivation, reducer transitions, focus restoration,
  Disc page variants, and Library reflection after a completed install.
- Rust tests cover manifest summary metadata, insufficient space, path safety,
  verified copying, cancellation/progress boundaries, and registration behavior.
- Existing frontend tests, production web build, and `cargo test` must pass.
- Manual desktop verification covers insert, inspect, cache, install, library
  update, and removal with keyboard-only navigation.

## Known limits after this increment

There is no physical DVD/CD reader, Steam integration, online metadata, scraping,
RetroAchievements, ROM/BIOS acquisition, third-party silent installer, or
production artwork system. The supplied image remains a temporary local asset.
