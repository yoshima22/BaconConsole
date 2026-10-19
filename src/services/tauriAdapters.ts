import type { ArtworkKind, ArtworkRecord, BaconDiscSummary, CatalogGame, CatalogService, CopyProgress, DiscService, EmulatorProfile, EmulatorProfileService, GameLibrary, LauncherService, LibraryRecord, MetadataCandidate, MetadataService, MetadataStatus, StorageTarget, UserProfile } from './contracts';
export const tauriDiscService: DiscService = {
  async inspect(root) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<BaconDiscSummary>('inspect_simulated_disc', { root }); },
  async verify(root) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<number>('verify_simulated_disc', { root }); },
  async copy(root, destination) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<number>('copy_simulated_disc', { root, destination }); },
  async storageTargets() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<StorageTarget[]>('get_storage_targets'); },
  async startCopy(request) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<number>('start_verified_copy', { ...request }); },
  async cancelCopy(jobId) { const { invoke } = await import('@tauri-apps/api/core'); await invoke('cancel_copy', { jobId }); },
  async onCopyProgress(listener) { if (!('__TAURI_INTERNALS__' in window)) return () => {}; const { listen } = await import('@tauri-apps/api/event'); return listen<CopyProgress>('bacondisc-copy-progress', (event) => listener(event.payload)); },
};
export const tauriGameLibrary: GameLibrary = { async list() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<LibraryRecord[]>('list_library_records'); } };
export const tauriCatalog: CatalogService = {
  async listGames() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<CatalogGame[]>('list_catalog_games'); },
  async listUsers() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<UserProfile[]>('list_local_users'); },
  async activeUser() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<UserProfile>('get_active_local_user'); },
  async createUser(name, avatar) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<UserProfile>('create_local_user', { name, avatar }); },
  async setActiveUser(userId) { const { invoke } = await import('@tauri-apps/api/core'); await invoke('set_active_local_user', { userId }); },
  async toggleFavorite(gameId) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<boolean>('toggle_catalog_favorite', { gameId }); },
};
export const tauriMetadata: MetadataService = { async status() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<MetadataStatus>('steamgriddb_status'); }, async configureSteamGridDb(key) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<MetadataStatus>('configure_steamgriddb', { apiKey: key }); }, async searchSteamGridDb(title) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<MetadataCandidate[]>('search_steamgriddb', { title }); }, async cacheSteamGridDbArtwork(gameId, remoteId, kind, url) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<ArtworkRecord>('cache_steamgriddb_artwork', { gameId, remoteId, kind, url }); } };
export const tauriEmulatorProfiles: EmulatorProfileService = { async list() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<EmulatorProfile[]>('list_emulator_profiles'); }, async bundled() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<EmulatorProfile[]>('bundled_emulator_profiles'); }, async save(profile) { const { invoke } = await import('@tauri-apps/api/core'); await invoke('save_emulator_profile', { profile }); } };
export const tauriLauncher: LauncherService = { async launch(request) { const { invoke } = await import('@tauri-apps/api/core'); await invoke('launch_game', { ...request }); }, async onState(listener) { if (!('__TAURI_INTERNALS__' in window)) return () => {}; const { listen } = await import('@tauri-apps/api/event'); return listen<'running' | 'returned' | 'failed'>('baconconsole-launch-state', (event) => listener(event.payload)); } };
