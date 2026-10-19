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

No painel de desenvolvimento, informe a pasta que contém `bacon.json` e escolha **Inserir BaconDisc**. No host Tauri, a mídia é inspecionada pelo backend e a instalação usa cópia verificada com eventos de progresso. A imagem do disco é um placeholder local temporário.

## BaconDisc simulado

O backend Rust expõe comandos Tauri para inspecionar, verificar hashes e copiar exclusivamente os arquivos declarados por um `bacon.json` portátil. Os paths do manifesto são relativos e bloqueiam traversal/paths absolutos. A execução automática de programas permanece intencionalmente desabilitada; qualquer launch futuro exige confirmação explícita.

Use `demo-media/lunar-archive/bacon.json` como referência de formato. A aba **Disco** mostra as ações autorizadas pelo manifesto; a aba **Biblioteca** exibe instalações permanentes registradas localmente. Cache só aparece quando o manifesto autoriza explicitamente o modo `use-cache`. Para validar o backend: `cargo test --manifest-path src-tauri/Cargo.toml`.

## Limitações atuais

- A execução direta é apenas uma confirmação visual: o launcher seguro será concluído em uma etapa posterior.
- A seleção de um destino externo para “Instalar no PC” ainda reutiliza o destino gerenciado; o seletor nativo de pasta é a próxima integração necessária.
- O fluxo completo requer abrir o host Tauri, pois o navegador comum não expõe a ponte de comandos nativos.
- A API Gamepad é uma camada browser/WebView2 defensiva para layouts `standard`; a compatibilidade com hardware deve ser validada no host Tauri após instalar Rust.
- A Home utiliza dados e arte abstrata locais.
