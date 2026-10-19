# BaconConsole

Frontend de videogame para Windows, construído com React, TypeScript e uma base Tauri 2 preparada para ativação após instalar Rust/Cargo.

## Desenvolvimento

```powershell
npm install
npm run dev
npm run test -- --run
npm run build
```

## Pré-requisitos Tauri no Windows

Para executar o host nativo, instale Rust com `winget install --id Rustlang.Rustup`, escolha o toolchain MSVC, e instale Visual Studio Build Tools com **Desktop development with C++**. Windows 10/11 normalmente já inclui o WebView2 Runtime. Reinicie o terminal e valide com `cargo --version`, então execute `npm run tauri dev`.

O painel de simulação no canto inferior direito alterna o estado local do BaconDisc. Nenhuma mídia, instalação, conta ou jogo real é acessado nesta etapa.

## Limitações atuais

- O host Tauri não foi executado porque Rust/Cargo não estão presentes nesta máquina.
- A API Gamepad é uma camada browser/WebView2 defensiva para layouts `standard`; a compatibilidade com hardware deve ser validada no host Tauri após instalar Rust.
- A Home utiliza dados e arte abstrata locais.
