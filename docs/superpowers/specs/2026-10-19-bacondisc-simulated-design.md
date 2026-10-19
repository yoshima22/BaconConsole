# BaconDisc Simulado — Design Specification

## Purpose

Implementar um fluxo funcional de mídia local simulada para jogos portáteis de PC. Uma pasta escolhida pelo usuário representa um BaconDisc inserido; o aplicativo valida seu manifesto, apresenta suas informações, permite verificar/copiar arquivos ao armazenamento simulado e registra o jogo na biblioteca.

## Architecture

O frontend React consome contratos tipados e nunca realiza I/O de mídia diretamente. Comandos Rust implementam as operações locais e retornam dados serializáveis: leitura de manifesto, inspeção de espaço, integridade e cópia com eventos de progresso. O adaptador `SimulatedDiscService` encapsula diretórios locais e permanece separado de qualquer futuro adaptador de unidade física.

```text
React Home / Disco / Biblioteca
  → DiscService | StorageService | GameLibrary | GameLauncher contracts
  → typed Tauri commands
  → Rust validation + filesystem operations
```

## Manifest

O arquivo `bacon.json` deve estar na raiz da mídia selecionada. A versão inicial aceita somente `packageType: "portable"` e `platform: "windows"`.

```json
{
  "schemaVersion": 1,
  "id": "example.game",
  "title": "Example Game",
  "platform": "windows",
  "packageType": "portable",
  "entryPoint": "Game/example.exe",
  "files": [{ "path": "Game/example.exe", "sha256": "..." }],
  "modes": ["play-direct", "copy-to-storage"]
}
```

All paths use forward slashes, are relative to the selected media root, and must resolve inside that root. The manifest never supplies a shell command, working directory, URL, environment override, or arbitrary arguments.

## Services

- `DiscService`: select, inspect, insert, remove, and exchange simulated media.
- `StorageService`: validates a user-selected destination, verifies free space, copies declared files, and reports byte-based progress.
- `GameLibrary`: persists registered installed games in the app-data directory.
- `GameLauncher`: assesses direct-launch eligibility only. A real executable launch requires a separate, explicit confirmation flow and an allowed entry point; this delivery does not execute a program automatically.

## Safety Rules

- Canonicalize source and destination paths before use; reject traversal, absolute manifest paths, symlinks escaping the approved root, and non-file entries.
- Copy only files enumerated by the validated manifest.
- Confirm sufficient free destination space before copying.
- Hash only declared files with SHA-256 and report mismatches without copying corrupted content.
- Store metadata, saves, and configuration outside the media root.
- Do not invoke a shell or execute command strings from `bacon.json`.

## UI Flow

The Home disc panel and a dedicated Disco page render the same inserted-media state. Selecting a media folder is an explicit development action; normal flow operates from the inserted state rather than presenting a file picker repeatedly. The user can remove or exchange media at any time. Copy progress is visible, cancellable where the native command supports cancellation, and finishes by registering an installed game in Biblioteca. A game that requires disc remains marked as such when the media is removed.

## Testing and Demo Data

Tests cover manifest acceptance/rejection, path containment, hash mismatch, free-space rejection, copy progress, library registration, and React state transitions. Demo data provides a portable fictional game with inert files and valid hashes; it contains no protected software or assets.

## Prerequisites

Native execution requires Rust stable MSVC, Microsoft C++ Build Tools with Desktop development with C++, and Microsoft Edge WebView2 Runtime. Node/npm are already available in the development workspace.

## Out of Scope

Physical CD/DVD devices, Steam, RetroAchievements, scraping, protected content acquisition, disc burning, silent installers, third-party installers, and automatic program execution are out of scope for this delivery.
