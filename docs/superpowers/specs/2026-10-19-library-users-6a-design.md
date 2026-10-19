# BaconConsole 6A — Biblioteca unificada e usuários locais

## Objetivo

Substituir o catálogo local baseado em JSON por uma biblioteca SQLite persistente e offline, capaz de representar jogos e instalações separadamente e manter preferências, favoritos, histórico e tempo de jogo por perfil local. Esta etapa não inclui provedores de metadados, RetroAchievements ou Steam.

## Estado atual e limite da etapa

O projeto possui `LibraryRecord` persistido em `library.json`, instalações BaconDisc, perfis de emulador e um launcher nativo. O catálogo atual não possui usuários, identidade canônica do jogo, múltiplas instalações, disponibilidade ou histórico de execução.

A 6A incorpora os registros JSON existentes uma única vez e preserva o arquivo original. Steam local, Steam OpenID, SteamGridDB, ScreenScraper e RetroAchievements pertencem às subetapas 6B–6D e não serão implementados aqui.

## Armazenamento

O banco ficará em `AppData` do BaconConsole, em `library/baconconsole.sqlite3`. O Rust controlará integralmente as consultas e migrações; o frontend acessará somente comandos Tauri tipados. Não haverá dados de API, senha, token ou segredo nesta etapa.

Migrações serão aplicadas em transação e identificadas por uma tabela `schema_migrations`. A primeira migração cria:

- `games`: identidade canônica, título, plataforma primária e timestamps.
- `installations`: jogo, origem, plataforma, caminho local, emulador opcional, disponibilidade, requisito de disco e tipo de instalação.
- `media`: mídia BaconDisc conhecida, associada ao jogo quando seu ID for confiável.
- `users`: perfis locais, incluindo o perfil Convidado inicial.
- `user_preferences`: preferências de interface serializadas por perfil.
- `favorites`: relação usuário/jogo.
- `play_history`: eventos de lançamento/retorno, instalação escolhida e duração local calculada.

Índices únicos serão aplicados para `games.identity_key`, `installations(source, external_id)` quando houver ID forte e `favorites(user_id, game_id)`. Títulos não compõem chaves únicas.

## Identidade e deduplicação

Cada jogo terá uma `identity_key`. Em 6A, chaves aceitas são:

- `bacondisc:<manifest-id>` para títulos de BaconDisc;
- `portable:<normalized-path>` para conteúdo portátil sem ID de mídia;
- `manual:<uuid>` para registros criados localmente sem identidade confiável.

Uma instalação é agregada somente quando a mesma `identity_key` é fornecida. Títulos visualmente parecidos nunca unem jogos. Uma operação de associação manual poderá ser incluída posteriormente quando existirem metadados e confirmação humana.

## Perfis e privacidade local

O banco cria Convidado na primeira inicialização e registra o usuário ativo em uma preferência local. Perfis contêm nome, referência de avatar local e preferências; a troca de perfil não move nem reconfigura saves existentes. Favoritos, histórico e tempo de jogo pertencem ao perfil que iniciou a execução.

O avatar será inicialmente uma referência textual/placeholder do design system; seleção de imagem externa é adiada para evitar permissões de arquivo adicionais nesta etapa.

## Fluxo nativo

1. A inicialização abre o banco, executa migrações e importa `library.json` caso ainda não tenha sido importado.
2. Uma instalação BaconDisc bem-sucedida grava ou atualiza `games` e `installations` com a identidade do manifesto.
3. Inserção/remoção de mídia atualiza somente disponibilidade de `media` e instalações dependentes de disco; não remove cadastros.
4. O launcher registra início, seleciona o usuário ativo e, no evento de retorno, finaliza o histórico e adiciona a duração ao total local do perfil.
5. O frontend requisita biblioteca, filtros, usuários e favoritos por contratos tipados.

## Interface 6A

A página Biblioteca recebe pesquisa, filtros de origem/plataforma/instalação, favoritos e estado de mídia exigida. Os cards exibem instalação disponível ou indisponível sem apagar o jogo. Uma tela/modal de usuários permite escolher, criar e editar nome/avatar do perfil. A navegação reutiliza os controles focáveis existentes; elementos indisponíveis não entram no fluxo de foco.

## Segurança e falhas

Todo caminho continua validado no Rust antes de lançamento ou registro. Banco corrompido, migração falha ou diretório sem permissão retornam erro explícito e não substituem o banco existente. Operações de leitura continuam offline. Nenhuma rotina de 6A pesquisa disco, Steam ou internet automaticamente.

## Testes e aceitação

- Migrações repetidas são idempotentes e a importação JSON ocorre uma vez.
- Duas instalações com a mesma identidade são agregadas; títulos iguais com chaves diferentes não são.
- Convidado é criado e favoritos/histórico não vazam entre usuários.
- Mídia removida deixa a instalação indisponível sem apagar jogo/histórico.
- Retorno do launcher contabiliza duração para o usuário ativo.
- Testes existentes e builds web/nativo permanecem aprovados.

## Riscos conhecidos

- O launcher atual precisa emitir identidade de instalação e horários suficientes para histórico preciso; isso será acrescentado à sua interface nativa sem aceitar argumentos arbitrários.
- A interface atual tem foco básico; os novos controles serão adicionados apenas se puderem participar da navegação sem selecionar campos invisíveis.
