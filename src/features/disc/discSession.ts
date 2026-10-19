import type { BaconDiscSummary, CopyProgress, StorageTarget } from '../../services/contracts';

export type DiscActionId = 'play-direct' | 'use-cache' | 'install-ssd' | 'install-pc' | 'details';
export type DiscAction = { id: DiscActionId; label: string; enabled: boolean; reason?: string };
export type MediaState = { state: 'empty' } | { state: 'inserted'; disc: BaconDiscSummary; root: string } | { state: 'invalid'; error: string } | { state: 'removed' };
export type InstallTarget = 'cache' | 'ssd' | 'pc';
export type InstallJob = { state: 'idle' | 'preparing' | 'verifying' | 'copying' | 'completed' | 'cancelled' | 'failed'; jobId?: string; target?: InstallTarget; copiedBytes: number; totalBytes: number; error?: string };
export type DiscSessionState = { media: MediaState; job: InstallJob; storageTargets: StorageTarget[] };
export type DiscSessionEvent = { type: 'disc-inserted'; disc: BaconDiscSummary; root: string } | { type: 'disc-invalid'; error: string } | { type: 'disc-removed' } | { type: 'storage-targets-loaded'; targets: StorageTarget[] } | { type: 'copy-started'; jobId: string; target: InstallTarget } | { type: 'copy-progressed'; progress: CopyProgress } | { type: 'copy-completed' } | { type: 'copy-cancelled' } | { type: 'copy-failed'; error: string } | { type: 'job-reset' };

const idleJob = (): InstallJob => ({ state: 'idle', copiedBytes: 0, totalBytes: 0 });
export const createDiscSession = (): DiscSessionState => ({ media: { state: 'empty' }, job: idleJob(), storageTargets: [] });
export function deriveDiscActions(disc: BaconDiscSummary, targets: StorageTarget[]): DiscAction[] {
  const allowsCopy = disc.modes.includes('copy-to-storage'); const hasSpace = targets.find((target) => target.kind === 'ssd')?.availableBytes ?? 0;
  return [
    { id: 'play-direct', label: 'Jogar do disco', enabled: disc.modes.includes('play-direct') },
    { id: 'use-cache', label: 'Usar cache', enabled: disc.modes.includes('use-cache'), reason: disc.modes.includes('use-cache') ? undefined : 'Cache não permitido por esta mídia.' },
    { id: 'install-ssd', label: 'Instalar no SSD', enabled: allowsCopy && hasSpace >= disc.totalBytes, reason: !allowsCopy ? 'Instalação não permitida por esta mídia.' : hasSpace < disc.totalBytes ? 'Espaço insuficiente no SSD.' : undefined },
    { id: 'install-pc', label: 'Instalar no PC', enabled: allowsCopy, reason: allowsCopy ? undefined : 'Instalação não permitida por esta mídia.' },
    { id: 'details', label: 'Ver detalhes', enabled: true },
  ];
}
export function discSessionReducer(state: DiscSessionState, event: DiscSessionEvent): DiscSessionState {
  switch (event.type) {
    case 'disc-inserted': return { ...state, media: { state: 'inserted', disc: event.disc, root: event.root }, job: idleJob() };
    case 'disc-invalid': return { ...state, media: { state: 'invalid', error: event.error }, job: idleJob() };
    case 'disc-removed': return { ...state, media: { state: 'removed' }, job: ['copying', 'preparing', 'verifying'].includes(state.job.state) ? { ...state.job, state: 'failed', error: 'A mídia foi removida durante a cópia.' } : state.job };
    case 'storage-targets-loaded': return { ...state, storageTargets: event.targets };
    case 'copy-started': return { ...state, job: { state: 'preparing', jobId: event.jobId, target: event.target, copiedBytes: 0, totalBytes: state.media.state === 'inserted' ? state.media.disc.totalBytes : 0 } };
    case 'copy-progressed': return event.progress.jobId === state.job.jobId ? { ...state, job: { ...state.job, state: 'copying', copiedBytes: event.progress.copiedBytes, totalBytes: event.progress.totalBytes } } : state;
    case 'copy-completed': return { ...state, job: { ...state.job, state: 'completed' } };
    case 'copy-cancelled': return { ...state, job: { ...state.job, state: 'cancelled' } };
    case 'copy-failed': return { ...state, job: { ...state.job, state: 'failed', error: event.error } };
    case 'job-reset': return { ...state, job: idleJob() };
  }
}
