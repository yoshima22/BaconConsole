import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { GameDetailsPanel } from './GameDetailsPanel';

const game = { id: 7, identityKey: 'local:ps1:c:/chrono.cue', title: 'Chrono', platform: 'ps1', favorite: false, installations: [{ id: 9, source: 'local-import', platform: 'ps1', installPath: 'C:/chrono.cue', installKind: 'local-import', available: true, requiresDisc: false, emulatorProfileId: 'duckstation' }] };

describe('GameDetailsPanel', () => {
  it('uses fallback background and keeps play action available without artwork cover', () => {
    render(<GameDetailsPanel game={game} artwork={{ background: '/assets/baconconsole-default-bg.png' }} onPlay={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Jogar Chrono' })).toBeEnabled();
    expect((screen.getByTestId('game-details') as HTMLElement).style.backgroundImage).toContain('/assets/baconconsole-default-bg.png');
  });
});
