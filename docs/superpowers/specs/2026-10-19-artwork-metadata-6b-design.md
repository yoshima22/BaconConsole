# BaconConsole — Etapa 6B: artes e metadados

## Objetivo

Adicionar busca e escolha manual de artes para jogos da biblioteca, usando a API oficial SteamGridDB quando o usuário configurar uma chave. O aplicativo deve continuar útil offline: artes locais existentes e o fundo padrão permanecem o fallback.

## Limites da subetapa

- Implementar SteamGridDB, cache local e experiência de escolha de correspondência.
- Criar somente o contrato e o estado "não configurado" para ScreenScraper; não criar credenciais nem fazer chamadas a esse serviço.
- Não implementar Steam, RetroAchievements, login remoto ou download de jogos.

## Arquitetura

### Limites de confiança

O React não conhece nem recebe a chave SteamGridDB. Os comandos Tauri chamam um módulo Rust de metadados, que aceita somente o domínio HTTPS oficial da API e URLs HTTPS de imagem aprovadas na resposta. Respostas, nomes, MIME e tamanho dos arquivos são dados não confiáveis e são validados antes de entrar no cache.

### Segredo

A chave é persistida no Gerenciador de Credenciais do Windows pelo backend Rust, sob um nome de serviço exclusivo do BaconConsole. SQLite armazena apenas o estado de configuração e identificadores de origem; a chave não é enviada ao frontend, gravada em logs, banco, arquivos de configuração ou Git. Sem chave, os comandos retornam um estado explícito `notConfigured`.

### Provedores

O contrato `MetadataProvider` expõe busca por título/plataforma e listagem de arte por candidato. `SteamGridDbProvider` usa os endpoints v2 de autocomplete, grids, heroes e logos, sempre com filtros seguros, limites de página e sem conteúdo marcado NSFW. `ScreenScraperProvider` é um adaptador que retorna `notConfigured` até existir credencial e requisitos confirmados.

### Persistência e cache

O catálogo SQLite ganha tabelas para correspondência de metadados e arte selecionada: jogo, provedor, ID remoto, tipo de arte, URL original, caminho relativo seguro, MIME, hash e data de cache. Os binários ficam em `app_data/artwork/`, com nome baseado em hash do conteúdo; a escrita é atômica. A mesma URL/hash não é baixada novamente. Falhas de rede deixam uma entrada de erro curta e não removem arte válida existente.

### Interface

Na Biblioteca, cada jogo pode abrir detalhes de arte. O usuário informa ou revisa o termo, vê múltiplas correspondências e confirma uma delas. A próxima tela mostra opções de capa vertical, background e logo para escolher individualmente. A renderização resolve primeiro uma seleção local em cache; depois a arte demonstrativa existente; por fim, `baconconsole-default-bg.png`. Os botões participam da navegação existente por teclado/gamepad.

## Fluxos e erros

1. Sem chave: configurações mostram SteamGridDB como não conectado; a busca explica que uma chave é necessária.
2. Chave salva: o backend confirma somente `configured`, nunca retorna o valor.
3. Busca: título e plataforma produzem zero, um ou vários candidatos; nenhuma correspondência é aplicada automaticamente quando for ambígua.
4. Download: o backend limita tamanho, aceita apenas PNG/JPEG/WebP, bloqueia `file:`, IP local e domínios não autorizados, grava o cache e associa a escolha ao jogo.
5. Offline/falha: a UI informa a falha sem bloquear a Biblioteca e usa fallback local.

## Testes

- contrato do provedor com chave ausente, resposta ambígua e resposta vazia;
- validação de URL, tipo MIME e tamanho de arte;
- cache atômico, deduplicação por hash e preservação da arte existente em falha;
- persistência da associação do jogo e resolução de fallback;
- componentes React para estados não configurado, busca e seleção.

## Critérios de aceite

- A chave SteamGridDB nunca é exposta ao frontend ou SQLite.
- Uma busca real só ocorre após configuração explícita da chave.
- O usuário escolhe correspondência e artes; não há associação pelo nome sem confirmação quando houver ambiguidade.
- Capas/backgrounds/logos escolhidos continuam disponíveis offline.
- ScreenScraper aparece corretamente como não configurado.
- Gamepad, BaconDisc, Home e launcher existentes permanecem funcionais.
