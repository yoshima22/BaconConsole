import type { BaconDiscSummary, CopyProgress, DiscService, EmulatorProfile, EmulatorProfileService, GameLibrary, LauncherService, LibraryRecord, StorageTarget } from './contracts';
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
export const tauriEmulatorProfiles: EmulatorProfileService = { async list() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<EmulatorProfile[]>('list_emulator_profiles'); }, async bundled() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<EmulatorProfile[]>('bundled_emulator_profiles'); }, async save(profile) { const { invoke } = await import('@tauri-apps/api/core'); await invoke('save_emulator_profile', { profile }); } };
export const tauriLauncher: LauncherService = { async launch(request) { const { invoke } = await import('@tauri-apps/api/core'); await invoke('launch_game', { ...request }); }, async onState(listener) { if (!('__TAURI_INTERNALS__' in window)) return () => {}; const { listen } = await import('@tauri-apps/api/event'); return listen<'running' | 'returned' | 'failed'>('baconconsole-launch-state', (event) => listener(event.payload)); } };
