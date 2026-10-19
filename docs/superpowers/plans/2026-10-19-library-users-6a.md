# Biblioteca unificada e usuários locais — 6A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistir catálogo unificado e perfis locais offline em SQLite, integrando instalações BaconDisc e histórico de execução sem implementar serviços online.

**Architecture:** Um módulo Rust `catalog` encapsula SQLite, migrações e consultas; comandos Tauri expõem DTOs sem SQL ao React. A biblioteca React consome filtros e estado do usuário ativo, enquanto o launcher registra eventos somente após validar o conteúdo como já faz hoje.

**Tech Stack:** Tauri 2, Rust, `rusqlite` com SQLite embutido, serde, React, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-19-library-users-6a-design.md`

## Global Constraints

- Banco em `AppData/library/baconconsole.sqlite3`; frontend não acessa arquivo ou SQL diretamente.
- Importar `library.json` uma única vez e nunca apagá-lo.
- Deduplicar exclusivamente por `identity_key`; títulos não são identidade.
- Criar o perfil Convidado automaticamente; nunca mover saves/configurações existentes.
- Toda operação deve funcionar offline; não acessar Steam, SteamGridDB, ScreenScraper ou RetroAchievements.
- Validar caminhos no Rust e não aceitar argumentos executáveis externos.
- Não fazer push sem autorização explícita.

## Review Focus

- Banco existente corrompido ou sem permissão deve retornar erro, sem recriar/sobrescrever o arquivo.
- Dois títulos iguais com `identity_key` distintos precisam aparecer como jogos diferentes.
- Importação repetida de JSON não pode duplicar registros após reinício.
- Troca de usuário durante sessão em execução deve manter o histórico associado ao usuário que iniciou o jogo.
- Remoção de mídia somente reduz disponibilidade; não apaga instalação, favorito ou histórico.

---

## File structure

- Create: `src-tauri/src/catalog.rs` — conexão SQLite, migrações, DTOs e operações de catálogo/usuário.
- Create: `src-tauri/tests/catalog_persistence.rs` — migração, importação e deduplicação.
- Create: `src-tauri/tests/catalog_users.rs` — Convidado, favoritos, histórico e isolamento de perfis.
- Modify: `src-tauri/src/lib.rs`, `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`, `src-tauri/Cargo.toml` — módulo, comandos e estado nativo.
- Modify: `src/services/contracts.ts`, `src/services/tauriAdapters.ts` — DTOs e adaptadores de biblioteca/usuários.
- Create: `src/features/library/libraryState.ts`, `src/features/library/libraryState.test.ts` — filtros e estado tipado da biblioteca.
- Create: `src/features/users/UserSwitcher.tsx`, `src/features/users/userSwitcher.test.tsx` — seleção e edição de perfis.
- Modify: `src/features/library/LibraryPage.tsx`, `src/app/App.tsx`, `src/app/App.css`, `README.md` — telas, integração e documentação.

### Task 1: Criar catálogo SQLite e migração do JSON legado

**Files:**
- Create: `src-tauri/src/catalog.rs`, `src-tauri/tests/catalog_persistence.rs`
- Modify: `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`

**Interfaces:**
- Produces `Catalog`, `Game`, `Installation`, `CatalogFilter`, `CatalogError`, `Catalog::open`, `Catalog::list_games` e `Catalog::upsert_installation`.
- Consumes o formato existente `library::LibraryRecord` apenas durante importação única.

- [ ] **Step 1: Escrever testes Rust que falham**

Cobrir `opens_schema_and_creates_guest_user`, `imports_legacy_library_once`, `aggregates_same_identity_key` e `does_not_merge_equal_titles_with_distinct_identity_keys` usando diretório temporário.

- [ ] **Step 2: Verificar RED**

Run: `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml --test catalog_persistence`

Expected: FAIL porque `catalog` não existe.

- [ ] **Step 3: Implementar `Catalog` e migrações**

Adicionar `rusqlite` com feature `bundled`; abrir o banco em transação, criar `schema_migrations`, `games`, `installations`, `media`, `users`, `user_preferences`, `favorites` e `play_history`. Usar `identity_key` único, importar JSON somente quando uma marca de migração não existir e preservar `library.json`.

- [ ] **Step 4: Verificar GREEN**

Run o comando da etapa 2.

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src-tauri/Cargo.toml src-tauri/src/catalog.rs src-tauri/src/lib.rs src-tauri/tests/catalog_persistence.rs
git commit -m "feat: add persistent sqlite catalog"
```

### Task 2: Perfis, favoritos e histórico isolados

**Files:**
- Create: `src-tauri/tests/catalog_users.rs`
- Modify: `src-tauri/src/catalog.rs`

**Interfaces:**
- Consumes `Catalog` da Task 1.
- Produces `UserProfile`, `PlaySession`, `Catalog::create_user`, `Catalog::set_active_user`, `Catalog::toggle_favorite`, `Catalog::start_play_session` e `Catalog::finish_play_session`.

- [ ] **Step 1: Escrever testes Rust que falham**

Cobrir criação/edição de perfil, favoritos isolados entre Convidado e outro usuário, e duração atribuída ao usuário que iniciou a sessão mesmo após a troca do usuário ativo.

- [ ] **Step 2: Verificar RED**

Run: `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml --test catalog_users`

Expected: FAIL porque APIs de usuário e sessão não existem.

- [ ] **Step 3: Implementar APIs de usuários e histórico**

Guardar usuário ativo em `user_preferences`; manter `user_id` imutável no `PlaySession`; inserir favorito com chave composta e concluir duração no retorno. Armazenar avatar somente como referência textual opcional.

- [ ] **Step 4: Verificar GREEN**

Run o comando da etapa 2.

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src-tauri/src/catalog.rs src-tauri/tests/catalog_users.rs
git commit -m "feat: add local user profiles and history"
```

### Task 3: Expor catálogo e ligar BaconDisc/launcher ao banco

**Files:**
- Modify: `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`, `src-tauri/src/launcher.rs`, `src-tauri/tests/storage_install.rs`
- Create: `src-tauri/tests/catalog_commands.rs`

**Interfaces:**
- Consumes `Catalog`, `BaconManifest` e eventos do launcher existentes.
- Produces comandos `list_catalog_games`, `list_users`, `create_user`, `update_user`, `set_active_user`, `toggle_favorite` e `get_active_user`.

- [ ] **Step 1: Escrever testes de integração que falham**

Cobrir instalação BaconDisc que cria/atualiza uma instalação `bacondisc:<id>`, remoção de mídia que preserva o jogo e chamada de retorno do launcher que conclui o histórico associado ao usuário inicial.

- [ ] **Step 2: Verificar RED**

Run: `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml --test catalog_commands`

Expected: FAIL porque comandos/catálogo não estão conectados.

- [ ] **Step 3: Integrar comandos e fluxo nativo**

Substituir o registro JSON de instalação por `Catalog::upsert_installation`, preservar os comandos legados apenas se necessário para compatibilidade, e capturar o usuário/instalação antes de iniciar o worker do launcher. Não expor SQL ou caminhos não validados ao frontend.

- [ ] **Step 4: Verificar GREEN**

Run o comando da etapa 2 e `$rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml --test storage_install`.

Expected: ambos PASS.

- [ ] **Step 5: Commit**

```powershell
git add src-tauri/src/commands.rs src-tauri/src/main.rs src-tauri/src/launcher.rs src-tauri/tests/catalog_commands.rs src-tauri/tests/storage_install.rs
git commit -m "feat: connect catalog to installs and launches"
```

### Task 4: Modelar estado TypeScript e filtros da biblioteca

**Files:**
- Create: `src/features/library/libraryState.ts`, `src/features/library/libraryState.test.ts`
- Modify: `src/services/contracts.ts`, `src/services/tauriAdapters.ts`

**Interfaces:**
- Consumes DTOs nativos `CatalogGame`, `UserProfile` e `CatalogFilter`.
- Produces `CatalogService`, `UserService`, `filterCatalogGames` e `LibraryFilterState`.

- [ ] **Step 1: Escrever testes Vitest que falham**

Cobrir busca sem diferenciação de caixa, filtros cumulativos por origem/plataforma/instalado, favorito por usuário e jogo indisponível que permanece visível.

- [ ] **Step 2: Verificar RED**

Run: `npm run test -- --run src/features/library/libraryState.test.ts`

Expected: FAIL porque estado e DTOs não existem.

- [ ] **Step 3: Implementar contratos, adaptadores e filtros puros**

Manter filtros sem efeitos colaterais e não criar dados de demonstração para catálogo persistido. Adaptadores chamam apenas comandos Tauri documentados.

- [ ] **Step 4: Verificar GREEN**

Run o comando da etapa 2.

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/services/contracts.ts src/services/tauriAdapters.ts src/features/library/libraryState.ts src/features/library/libraryState.test.ts
git commit -m "feat: add unified library state and filters"
```

### Task 5: Implementar UI de Biblioteca e perfis

**Files:**
- Create: `src/features/users/UserSwitcher.tsx`, `src/features/users/userSwitcher.test.tsx`
- Modify: `src/features/library/LibraryPage.tsx`, `src/app/App.tsx`, `src/app/App.css`

**Interfaces:**
- Consumes `CatalogService`, `UserService`, `filterCatalogGames` e componentes base existentes.
- Produces seleção de perfil, filtros de biblioteca, pesquisa e favorito com foco navegável.

- [ ] **Step 1: Escrever testes de componentes que falham**

Cobrir seleção de Convidado/outro perfil, criação de perfil, filtro de origem, pesquisa, favorito e indicação de disco necessário sem remover card da tela.

- [ ] **Step 2: Verificar RED**

Run: `npm run test -- --run src/features/users/userSwitcher.test.tsx src/features/library/library-ui.test.tsx`

Expected: FAIL porque controles e filtros não existem.

- [ ] **Step 3: Implementar telas usando design system existente**

Adicionar botões focáveis para filtros e favorito, modal de perfil com restauração de foco e placeholders de avatar do design system. Carregar dados reais do catálogo e exibir erros offline sem bloquear Home/Disco.

- [ ] **Step 4: Verificar GREEN**

Run o comando da etapa 2 e `npm run test -- --run src/app/App.test.tsx`.

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/users src/features/library src/app/App.tsx src/app/App.css
git commit -m "feat: add library filters and local profiles ui"
```

### Task 6: Documentar e validar a 6A

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes implementação concluída das Tasks 1–5.
- Produces instruções de localização de banco, migração, uso de perfil Convidado e limitações offline.

- [ ] **Step 1: Atualizar documentação**

Documentar `AppData/library/baconconsole.sqlite3`, preservação de `library.json`, escopo offline e ausência deliberada de Steam/serviços online em 6A.

- [ ] **Step 2: Executar verificação completa**

Run: `npm run test -- --run; npm run build; $rustBin = Join-Path $env:USERPROFILE '.cargo\bin'; & (Join-Path $rustBin 'cargo.exe') test --manifest-path src-tauri\Cargo.toml`

Expected: todos os testes e build passam.

- [ ] **Step 3: Gerar bundle nativo de depuração**

Run: `$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"; npm run tauri build -- --debug`

Expected: `src-tauri/target/debug/baconconsole.exe` e bundles Windows são gerados.

- [ ] **Step 4: Commit**

```powershell
git add README.md
git commit -m "docs: document local catalog and profiles"
```
