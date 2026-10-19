import type { BaconDiscSummary, CopyProgress, DiscService, GameLibrary, LibraryRecord, StorageTarget } from './contracts';
export const tauriDiscService: DiscService = {
  async inspect(root) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<BaconDiscSummary>('inspect_simulated_disc', { root }); },
  async verify(root) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<number>('verify_simulated_disc', { root }); },
  async copy(root, destination) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<number>('copy_simulated_disc', { root, destination }); },
  async storageTargets() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<StorageTarget[]>('get_storage_targets'); },
  async startCopy(request) { const { invoke } = await import('@tauri-apps/api/core'); return invoke<number>('start_verified_copy', { ...request }); },
  async cancelCopy(jobId) { const { invoke } = await import('@tauri-apps/api/core'); await invoke('cancel_copy', { jobId }); },
  async onCopyProgress(listener) { const { listen } = await import('@tauri-apps/api/event'); return listen<CopyProgress>('bacondisc-copy-progress', (event) => listener(event.payload)); },
};
export const tauriGameLibrary: GameLibrary = { async list() { const { invoke } = await import('@tauri-apps/api/core'); return invoke<LibraryRecord[]>('list_library_records'); } };
