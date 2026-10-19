import { describe, expect, it } from 'vitest';
import { createDiscSession, deriveDiscActions, discSessionReducer } from './discSession';

const disc = {
  id: 'demo', title: 'Demo Disc', platform: 'windows', packageType: 'portable', entryPoint: 'Game/demo.exe',
  modes: ['play-direct', 'copy-to-storage'], fileCount: 1, totalBytes: 24,
};

describe('disc session', () => {
  it('derives disabled cache and installation actions when their modes are absent', () => {
    const actions = deriveDiscActions({ ...disc, modes: ['play-direct'] }, [{ kind: 'ssd', root: 'C:/SSD', availableBytes: 100 }]);

    expect(actions.find((action) => action.id === 'play-direct')).toMatchObject({ enabled: true });
    expect(actions.find((action) => action.id === 'use-cache')).toMatchObject({ enabled: false, reason: 'Cache não permitido por esta mídia.' });
    expect(actions.find((action) => action.id === 'install-ssd')).toMatchObject({ enabled: false, reason: 'Instalação não permitida por esta mídia.' });
  });

  it('completes a zero-byte cache copy without a fabricated percentage', () => {
    const ready = discSessionReducer(createDiscSession(), { type: 'disc-inserted', disc: { ...disc, fileCount: 0, totalBytes: 0 }, root: 'C:/Disc' });
    const copying = discSessionReducer(ready, { type: 'copy-started', jobId: 'job-1', target: 'cache' });
    const completed = discSessionReducer(copying, { type: 'copy-completed' });

    expect(completed.job).toMatchObject({ state: 'completed', copiedBytes: 0, totalBytes: 0, target: 'cache' });
  });

  it('marks a copied job as failed when the disc is removed before completion', () => {
    const inserted = discSessionReducer(createDiscSession(), { type: 'disc-inserted', disc, root: 'C:/Disc' });
    const copying = discSessionReducer(inserted, { type: 'copy-started', jobId: 'job-1', target: 'ssd' });
    const removed = discSessionReducer(copying, { type: 'disc-removed' });

    expect(removed.media).toMatchObject({ state: 'removed' });
    expect(removed.job).toMatchObject({ state: 'failed', error: 'A mídia foi removida durante a cópia.' });
  });
});
