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

## Biblioteca e perfis locais

A biblioteca unificada é persistida em SQLite em `%APPDATA%\com.baconconsole.app\library\baconconsole.sqlite3` (o diretório exato segue o identificador configurado do Tauri). A primeira abertura importa o registro legado `library.json` uma única vez. Jogos são identificados por uma chave estável de origem — nunca somente pelo título — portanto títulos iguais podem coexistir sem sobrescrever instalações diferentes.

O perfil **Convidado** é criado automaticamente. A barra de perfil permite criar perfis locais, alternar o perfil ativo e manter favoritos e histórico de tempo de jogo separados. A Biblioteca permite buscar, filtrar por instalação, mídia e favoritos, e alternar favoritos sem comunicação online. Não há login remoto, Steam, scraping ou RetroAchievements nesta etapa.

## Artes e metadados (SteamGridDB)

Em **Configurações → Integrações → SteamGridDB**, informe a chave e escolha **Salvar e testar**. O estado só muda para conectado quando a API responde com sucesso; uma falha de rede, chave recusada ou limitação de taxa aparece sem expor a chave. Em seguida, use **Biblioteca → Artes** para associar capa, background ou logo manualmente.

Em **Biblioteca**, abra **Artes** em um jogo. O SteamGridDB começa como **não conectado**; informe uma chave criada no serviço para habilitar uma busca manual por título. A chave é enviada uma vez para o backend e guardada pelo Gerenciador de Credenciais do Windows; ela não é gravada no SQLite, em arquivos do projeto, logs ou Git.

O BaconConsole mostra resultados de jogos separadamente e exige escolher a correspondência e a arte (capa, background ou logo). Downloads aceitam somente HTTPS dos domínios SteamGridDB e imagens PNG, JPEG ou WebP de até 16 MiB. O backend armazena os binários em `%APPDATA%\com.yoshima22.baconconsole\artwork` e registra somente caminhos relativos, hash, MIME e origem no banco local. Após o download, a arte selecionada continua disponível offline; se a busca falhar, o app conserva a seleção válida ou usa a arte demonstrativa/fundo padrão.

ScreenScraper aparece como **não configurado** nesta etapa. Não há credenciais, chamadas de rede ou dados demonstrativos para ele.

Steam, ScreenScraper e RetroAchievements são mostrados em **Configurações → Integrações** com seu estado real. Nesta versão eles permanecem indisponíveis: Steam local, o adaptador ScreenScraper e a Web API do RetroAchievements serão integrados em entregas próprias, sem simular conta, biblioteca, conquistas ou pontuação.

## Emuladores e conteúdo autorizado

O BaconConsole não baixa, distribui ou procura ROMs, BIOS, firmware ou jogos. Use apenas conteúdo que você possua e esteja autorizado a executar. A Etapa 5 instala ferramentas portáteis locais em `%LOCALAPPDATA%\BaconConsole\tools`:

- RetroArch, com os cores FCEUmm (NES), Snes9x (SNES), Genesis Plus GX (Mega Drive) e mGBA;
- DuckStation para conteúdo de PS1;
- PCSX2 para conteúdo de PS2.

Na aba **Configurações → Emuladores**, o app detecta esses executáveis locais. Revise o caminho e clique em **Salvar** para registrar um perfil. A validação aceita somente arquivos `.exe` existentes; RetroArch também valida cada core configurado. A execução é construída com argumentos discretos (sem shell ou argumentos vindos de manifestos), permite uma sessão por vez e recusa conteúdo que escape da pasta raiz informada.

Saves, estados e configurações pertencem a cada emulador em sua instalação portátil. BIOS de PS1/PS2 continuam sendo responsabilidade do usuário e nunca são incluídas pelo BaconConsole.

## Limitações atuais

- O caminho completo da ROM ou executável autorizado pode ser informado em **Configurações → Emuladores → Conteúdo autorizado**. Um diálogo nativo de arquivo poderá substituir esse campo em uma etapa futura; o launcher só aceita conteúdo dentro da raiz validada.
- A seleção de um destino externo para “Instalar no PC” ainda reutiliza o destino gerenciado; o seletor nativo de pasta é a próxima integração necessária.
- O fluxo completo requer abrir o host Tauri, pois o navegador comum não expõe a ponte de comandos nativos.
- A API Gamepad é uma camada browser/WebView2 defensiva para layouts `standard`; a compatibilidade com hardware deve ser validada no host Tauri após instalar Rust.
- A Home utiliza dados e arte abstrata locais.
# BaconConsole

## Biblioteca local em modo console

O BaconConsole usa os emuladores gerenciados instalados em %LOCALAPPDATA%\BaconConsole\tools quando eles estão disponíveis: RetroArch para NES, SNES, Mega Drive e GBA; DuckStation para PS1; e PCSX2 para PS2. A tela de Emuladores mostra esse estado automaticamente. A escolha manual de executável existe somente para substituir uma instalação em uma configuração avançada.

Na Biblioteca, selecione **Adicionar jogos locais**, escolha uma pasta local autorizada, a plataforma e o emulador compatível. A importação apenas lê nomes e caminhos dos arquivos aceitos; ela não executa mídia durante a varredura e não envia arquivos para a internet.

| Plataforma | Formatos importados |
| --- | --- |
| NES | .nes |
| SNES | .sfc, .smc |
| Mega Drive | .md, .gen, .bin |
| GBA | .gba |
| PS1 | .cue, .chd, .iso |
| PS2 | .chd, .iso |

Após importar, use **Jogar** no cartão da Biblioteca e confirme a abertura. O BaconConsole valida a mídia e o emulador associado antes de iniciar qualquer processo. BIOS e configurações de cada emulador continuam sendo responsabilidade do usuário e permanecem locais.

Steam ainda é um adaptador separado: esta etapa não usa executáveis Steam escolhidos manualmente e não descobre bibliotecas Steam automaticamente.
