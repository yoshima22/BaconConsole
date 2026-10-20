# BaconConsole — Experiência de Console e Integrações

## Objetivo

Transformar a Biblioteca e as Configurações em uma experiência de console navegável por gamepad, com fluxos próprios para confirmações, erros, carregamento e conexões externas. Esta entrega prepara a interface para Steam local, SteamGridDB, ScreenScraper e RetroAchievements sem declarar uma integração como funcional antes que ela tenha sido configurada e verificada.

## Contexto e problema

O BaconConsole já possui design tokens, Home, Biblioteca, BaconDisc, catálogo SQLite, perfis locais e um provedor SteamGridDB com cache de imagens. Entretanto, a chave SteamGridDB está escondida no seletor de artes, o ScreenScraper é somente um stub, RetroAchievements e Steam não possuem adaptadores, e alguns fluxos ainda usam confirmações nativas do navegador. Isso faz recursos existentes parecerem ausentes e quebra a linguagem visual de console.

Esta entrega não implementa descoberta Steam, chamadas ScreenScraper, chamadas RetroAchievements, provisionamento de emuladores ou leitura de mídia física. Ela constrói a experiência visual, os contratos e os estados de integração sobre os quais essas etapas serão implementadas.

## Escopo

### Incluído

- Um sistema de sobreposição próprio do BaconConsole para confirmação, escolha e informação, com foco restaurado ao fechar.
- Notificações não intrusivas e mensagens de erro acessíveis.
- Transições discretas de página, prateleira e painel, respeitando `prefers-reduced-motion`.
- Página de detalhes de jogo dentro da Biblioteca, usando capa, background, dados locais, instalações e ações existentes.
- Página **Configurações → Integrações** com cartões para Steam, SteamGridDB, ScreenScraper e RetroAchievements.
- SteamGridDB movido para a página de Integrações, com estado persistente, teste de conexão real e configuração segura da chave existente.
- Um contrato unificado de estado de integração, permitindo representar `não configurado`, `verificando`, `conectado`, `erro` e `indisponível` sem dados demonstrativos.
- Ligação do seletor de artes da Biblioteca à configuração central: quando SteamGridDB não estiver conectado, ele conduz o usuário à página correta; quando estiver conectado, mantém a escolha manual e o cache local já existentes.
- Navegação por teclado e gamepad para todos os controles novos, sem elementos focáveis invisíveis ou desabilitados.
- Testes de componentes para foco, modal, notificações, estados de integração e abertura do seletor de arte.

### Excluído

- Descoberta de bibliotecas Steam, execução via `steam://run/<AppID>`, Steam OpenID ou catálogo online Steam.
- Requisições ScreenScraper ou RetroAchievements.
- Armazenamento de credenciais ScreenScraper ou RetroAchievements.
- Importação de executáveis Windows genéricos.
- Alterações nos emuladores, BIOS, ROMs, saves ou mapeamento de controles.
- Mudanças na semântica de segurança do BaconDisc, cópia ou launcher.

## Experiência do usuário

### Navegação e foco

O foco de console continua sendo a fonte de verdade. Setas e direcional alternam entre controles focáveis; Enter/A confirma; Escape/B volta ou fecha a sobreposição mais alta. LB/RB continua reservado à alternância de abas quando aplicável. Ao abrir modal, painel de detalhes ou seletor de artes, o item que iniciou o fluxo é memorizado. Ao fechar, o foco retorna a ele caso ainda exista e esteja habilitado; caso contrário, retorna ao primeiro elemento focável da região ativa.

Mouse e toque permanecem alternativas, mas não são necessários. Os controles usam atributos semânticos e mensagens com `role=status` ou `role=alert` conforme a gravidade.

### Biblioteca

A Biblioteca passa a apresentar uma grade de jogos com arte local quando disponível, fallback aprovado quando não houver e estados inequívocos para instalação, disco requerido e origem. Escolher um cartão abre detalhes do jogo na própria superfície do aplicativo: background panorâmico com gradiente de legibilidade, capa, plataformas, instalações e ações.

O botão Jogar abre confirmação BaconConsole, não `window.confirm`. A confirmação identifica a instalação escolhida e preserva as validações nativas do launcher. Ações indisponíveis permanecem visíveis apenas quando explicam um requisito concreto; caso contrário, não entram na ordem de foco.

### Configurações → Integrações

Cada serviço tem um cartão com:

- nome, finalidade e estado;
- texto que descreve exatamente o que pode ser feito no estado atual;
- ação primária contextual;
- erro sanitizado e recuperável, quando houver;
- nenhum dado fictício de perfil, jogos, pontos ou credenciais.

Estados dos cartões:

| Serviço | Inicial | Conectado | Ainda indisponível nesta entrega |
| --- | --- | --- | --- |
| Steam | `Disponível em breve` | Não aplicável | Detecção local e vínculo de conta |
| SteamGridDB | `Não conectado` | `Conectado` após teste remoto válido | Busca automática e associação por AppID |
| ScreenScraper | `Credenciais necessárias` | Não aplicável | Adaptador de rede e busca |
| RetroAchievements | `Disponível em breve` | Não aplicável | Perfil, API, cache e conquistas |

SteamGridDB aceita a chave em um modal seguro. A chave é enviada diretamente ao comando Tauri e gravada somente no Gerenciador de Credenciais do Windows. Depois de salvar, o app executa uma requisição de teste autenticada ao SteamGridDB. Uma resposta não autorizada, limite de taxa ou falha de rede muda o cartão para `erro`, preservando a chave somente quando a gravação foi bem-sucedida. Nenhuma chave é devolvida para o React, SQLite, logs ou notificações.

O ScreenScraper não ganha campos decorativos nem chave falsa. O cartão explica que sua ativação será adicionada somente quando as credenciais de desenvolvedor e as regras do serviço estiverem disponíveis.

## Arquitetura

### Frontend

`AppShell` passa a ser responsável por uma pilha de sobreposições e uma fila de notificações. Componentes reutilizáveis ficam em `src/components`:

- `ConsoleModal`: diálogo acessível com foco inicial e restauração.
- `ConsoleNotification`: mensagens transitórias sem roubar foco.
- `IntegrationCard`: apresentação independente de um serviço e seu estado.
- `GameDetailsPanel`: detalhes do jogo e seleção de instalação.

Cada componente recebe dados e callbacks; não chama Tauri diretamente. Adaptadores permanecem em `src/services/tauriAdapters.ts`; contratos em `src/services/contracts.ts`. A página de Integrações concentra a configuração de serviços; `ArtworkPicker` se limita à pesquisa e seleção de imagens para um jogo.

### Backend

O backend ganha um contrato de diagnóstico de integração. SteamGridDB expõe um comando de teste que realiza uma chamada autenticada de baixo custo e converte erros de transporte, autorização e limite em estados seguros para a UI. O segredo continua encapsulado por `WindowsCredentialStore`.

Os adaptadores futuros para Steam, ScreenScraper e RetroAchievements implementam o mesmo formato de status, mas nesta entrega retornam estados explicitamente indisponíveis e não fazem chamadas de rede.

### Dados e segurança

Não há migração de catálogo para esta entrega. As artes selecionadas continuam na tabela `artwork_selections` e os binários continuam no cache local por hash. Credenciais não entram em SQLite, arquivos de configuração, props persistentes nem telemetria.

URLs, caminhos de arte e validações de tamanho atuais permanecem obrigatórios. Mensagens de rede apresentadas ao usuário não incluem cabeçalhos, chave, caminho interno ou corpo de resposta remoto.

## Fluxo de dados

1. A página de Integrações solicita o resumo de cada serviço ao adaptador Tauri.
2. Para SteamGridDB, o resumo consulta apenas a presença segura da chave e o resultado efêmero do último teste da sessão.
3. O usuário salva uma nova chave no modal; o backend armazena a chave no Windows Credential Manager e executa o teste remoto.
4. O resumo atualizado volta sem segredo e atualiza o cartão e o seletor de artes.
5. A Biblioteca solicita artes já selecionadas para cada jogo; se não houver uma arte local, aplica o fallback visual existente.
6. A ação Jogar abre `ConsoleModal`; somente a confirmação chama o launcher já existente.

## Falhas e recuperação

- Sem internet: SteamGridDB mostra erro de rede e mantém artes já em cache.
- Chave inválida: mostra erro de autorização, sem ecoar ou apagar a chave automaticamente.
- Limite de taxa: mostra estado temporário com opção de tentar novamente; não realiza repetição automática agressiva.
- Serviço não implementado: mostra `Disponível em breve`, sem controles que finjam efetuar login.
- Modal interrompido por mudança de página: fecha sem confirmar ação e restaura foco de forma segura.
- Arte ausente, arquivo removido ou inválido: usa o background padrão e mantém texto e ações renderizados em React/CSS.

## Critérios de aceitação

- Nenhum fluxo novo usa `window.confirm`, `window.alert` ou diálogos do navegador.
- Um usuário consegue abrir, navegar e fechar detalhes, modais e integrações somente com teclado.
- SteamGridDB pode ser configurado, validado e exibido como conectado ou com erro real, sem expor a chave.
- O seletor de artes orienta corretamente para Integrações quando o serviço não está conectado.
- Steam, ScreenScraper e RetroAchievements não mostram dados ou conexão fictícia.
- Artes offline e fallbacks aprovados continuam funcionando.
- Testes web, testes Rust e build Tauri existentes permanecem verdes.

## Próximas entregas dependentes

1. Steam local e importação segura de aplicativos Windows, usando a superfície de Biblioteca e os estados desta entrega.
2. Busca SteamGridDB aprimorada por AppID/plataforma e adaptador ScreenScraper mediante credenciais reais.
3. RetroAchievements com chave de API segura, perfil, cache e progresso por jogo.
4. Preparação gerenciada de DuckStation, PCSX2 e RetroArch, usando os mesmos padrões de diagnóstico e modal.
