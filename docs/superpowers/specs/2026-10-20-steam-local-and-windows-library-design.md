# BaconConsole — Biblioteca Steam Local e Jogos Windows

## Objetivo

Permitir que o BaconConsole descubra jogos Steam instalados localmente e os apresente na Biblioteca sem seleção manual de executáveis. Também permitir o cadastro explícito e seguro de aplicativos Windows fora da Steam.

## Escopo

### Steam local

- Detectar o diretório principal Steam por caminhos Windows conhecidos e, quando necessário, por uma pasta Steam escolhida pelo usuário.
- Ler `steamapps/libraryfolders.vdf` e todos os `appmanifest_*.acf` apenas como dados locais de leitura.
- Registrar AppID, nome, diretório de instalação, biblioteca de origem, disponibilidade e identidade estável `steam:<appid>`.
- Sincronizar o catálogo sem apagar cadastro histórico quando uma instalação estiver indisponível.
- Iniciar jogo instalado pela URI `steam://run/<appid>`, delegando DRM, atualizações e execução ao cliente Steam.
- Nunca copiar, modificar ou remover arquivos Steam; nunca executar o executável interno do jogo diretamente.

### Aplicativos Windows externos

- Aceitar uma seleção explícita de arquivo `.exe` ou atalho `.lnk` local feita pelo usuário.
- Canonicalizar e validar o destino; rejeitar executáveis ausentes, caminhos inseguros e atalhos sem destino local confiável.
- Registrar uma identidade baseada no caminho canônico e iniciar sem argumentos adicionais.
- Pedir confirmação BaconConsole antes de cada execução.

## Biblioteca e interface

A Biblioteca ganha ações `Sincronizar Steam` e `Adicionar aplicativo Windows`. Cartões e detalhes exibem a origem como Steam, Windows local, BaconDisc ou emulado. Jogos Steam indisponíveis permanecem conhecidos, mas a ação Jogar fica desabilitada com explicação. Uma sincronização mostra resultado não intrusivo e não move foco.

O fluxo de aplicativo Windows usa seletor nativo somente para a escolha inicial. Depois de cadastrado, o usuário inicia pelo cartão do BaconConsole, não pelo Explorador de Arquivos.

## Arquitetura

O módulo Rust `steam_library` é independente do catálogo e produz registros de descoberta validados. Ele interpreta apenas o subconjunto VDF necessário para bibliotecas e manifestos, sem avaliar conteúdo como código. `windows_library` resolve e valida uma seleção pontual antes de convertê-la em instalação de catálogo.

Os comandos Tauri convertem descobertas em `InstallationInput` e retornam uma contagem e títulos. O launcher recebe um novo tipo de pedido seguro para URI Steam; o processo nativo abre apenas URI com esquema fixo e AppID decimal validado. React continua dependendo de contratos e adaptadores, nunca de caminhos Steam diretos.

## Segurança e falhas

- Manifestos VDF, nomes e caminhos são dados não confiáveis.
- AppID deve ser decimal positivo e a instalação precisa existir sob a biblioteca declarada.
- A URI Steam nunca aceita texto livre do frontend.
- Falha ou ausência de Steam mostra estado local claro; não bloqueia ROMs, BaconDisc ou jogos já cadastrados.
- Aplicativos Windows externos não aceitam argumentos, scripts, URLs ou diretórios como destino.

## Testes e aceitação

- Fixtures VDF cobrem duas bibliotecas, manifesto válido, AppID inválido e instalação ausente.
- Catálogo une nova sincronização a uma entrada Steam de mesmo AppID sem duplicar.
- Construção de URI recusa identificadores não numéricos.
- UI mostra Steam instalado, Steam indisponível e aplicativo Windows cadastrado.
- Testes web, Rust e build permanecem verdes.

## Fora desta entrega

- Steam OpenID, GetOwnedGames, biblioteca online e perfil Steam.
- SteamGridDB por AppID, ScreenScraper e RetroAchievements.
- Instalação, cópia ou reparo de jogos Steam.
- Gerenciamento de emuladores.
