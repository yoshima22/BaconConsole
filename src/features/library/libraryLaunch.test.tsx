import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LibraryPage } from './LibraryPage';
import { OverlayHost } from '../../components/OverlayHost';

describe('LibraryPage local launches', () => {
  it('offers play only for an available imported game', () => {
    render(<OverlayHost><LibraryPage
      games={[{ id: 7, identityKey: 'local:ps1:c:/chrono.cue', title: 'chrono', platform: 'ps1', favorite: false, installations: [{ id: 9, source: 'local-import', platform: 'ps1', installPath: 'C:/chrono.cue', installKind: 'local-import', available: true, requiresDisc: false, emulatorProfileId: 'duckstation' }] }]}
      profiles={[]}
      onToggleFavorite={vi.fn()}
      onChooseFolder={vi.fn()}
      onImport={vi.fn()}
      onLaunch={vi.fn()}
    /></OverlayHost>);

    expect(screen.getByRole('button', { name: 'Jogar chrono' })).toBeEnabled();
  });
});
