import { fireEvent, render, screen } from '@testing-library/react';
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
      onChooseExecutable={vi.fn()}
      onImport={vi.fn()}
      onSyncSteam={vi.fn()}
      onRegisterWindowsApp={vi.fn()}
      onLaunch={vi.fn()}
    /></OverlayHost>);

    expect(screen.getByRole('button', { name: 'Jogar chrono' })).toBeEnabled();
  });

  it('offers play for an available Steam installation', () => {
    render(<OverlayHost><LibraryPage
      games={[{ id: 8, identityKey: 'steam:42', title: 'Steam Chrono', platform: 'windows', favorite: false, installations: [{ id: 10, source: 'steam', platform: 'windows', installPath: '42', installKind: 'steam', available: true, requiresDisc: false }] }]}
      profiles={[]}
      onToggleFavorite={vi.fn()}
      onChooseFolder={vi.fn()}
      onChooseExecutable={vi.fn()}
      onImport={vi.fn()}
      onSyncSteam={vi.fn()}
      onRegisterWindowsApp={vi.fn()}
      onLaunch={vi.fn()}
    /></OverlayHost>);

    expect(screen.getByRole('button', { name: 'Jogar Steam Chrono' })).toBeEnabled();
  });

  it('moves card focus with normalized console input', () => {
    render(<OverlayHost><LibraryPage
      games={[{ id: 11, identityKey: 'steam:42', title: 'One', platform: 'windows', favorite: false, installations: [{ id: 12, source: 'steam', platform: 'windows', installPath: '42', installKind: 'steam', available: true, requiresDisc: false }] }, { id: 13, identityKey: 'steam:43', title: 'Two', platform: 'windows', favorite: false, installations: [{ id: 14, source: 'steam', platform: 'windows', installPath: '43', installKind: 'steam', available: true, requiresDisc: false }] }]}
      profiles={[]} onToggleFavorite={vi.fn()} onChooseFolder={vi.fn()} onChooseExecutable={vi.fn()} onImport={vi.fn()} onSyncSteam={vi.fn()} onRegisterWindowsApp={vi.fn()} onLaunch={vi.fn()}
    /></OverlayHost>);
    fireEvent(window, new CustomEvent('baconconsole-input', { detail: 'move-right' }));
    expect(screen.getByRole('button', { name: 'Jogar One' })).toHaveFocus();
    fireEvent(window, new CustomEvent('baconconsole-input', { detail: 'move-right' }));
    expect(screen.getByRole('button', { name: 'Jogar Two' })).toHaveFocus();
  });
});
