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

## Emuladores e conteúdo autorizado

O BaconConsole não baixa, distribui ou procura ROMs, BIOS, firmware ou jogos. Use apenas conteúdo que você possua e esteja autorizado a executar. A Etapa 5 instala ferramentas portáteis locais em `%LOCALAPPDATA%\BaconConsole\tools`:

- RetroArch, com os cores FCEUmm (NES), Snes9x (SNES), Genesis Plus GX (Mega Drive) e mGBA;
- DuckStation para conteúdo de PS1;
- PCSX2 para conteúdo de PS2.

Na aba **Configurações → Emuladores**, o app detecta esses executáveis locais. Revise o caminho e clique em **Salvar** para registrar um perfil. A validação aceita somente arquivos `.exe` existentes; RetroArch também valida cada core configurado. A execução é construída com argumentos discretos (sem shell ou argumentos vindos de manifestos), permite uma sessão por vez e recusa conteúdo que escape da pasta raiz informada.

Saves, estados e configurações pertencem a cada emulador em sua instalação portátil. BIOS de PS1/PS2 continuam sendo responsabilidade do usuário e nunca são incluídas pelo BaconConsole.

## Limitações atuais

- O seletor visual de conteúdo autorizado será substituído por um diálogo nativo de arquivo; por enquanto o caminho pode ser informado/configurado na interface e o launcher só aceita conteúdo dentro da raiz validada.
- A seleção de um destino externo para “Instalar no PC” ainda reutiliza o destino gerenciado; o seletor nativo de pasta é a próxima integração necessária.
- O fluxo completo requer abrir o host Tauri, pois o navegador comum não expõe a ponte de comandos nativos.
- A API Gamepad é uma camada browser/WebView2 defensiva para layouts `standard`; a compatibilidade com hardware deve ser validada no host Tauri após instalar Rust.
- A Home utiliza dados e arte abstrata locais.
