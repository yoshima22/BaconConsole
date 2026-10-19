import { describe, expect, it } from 'vitest';
import { createLaunchSession, launchSessionReducer } from './launchSession';

describe('launchSessionReducer', () => {
  it('restores the focus token after a launched game returns', () => {
    let state = createLaunchSession();
    state = launchSessionReducer(state, { type: 'launch-requested', focusToken: 'library-game-1' });
    state = launchSessionReducer(state, { type: 'game-running' });
    state = launchSessionReducer(state, { type: 'game-returned' });

    expect(state).toEqual({ state: 'returned', focusToken: 'library-game-1', error: null });
  });

  it('keeps the original focus token when launch fails', () => {
    let state = launchSessionReducer(createLaunchSession(), { type: 'launch-requested', focusToken: 'disc-play' });
    state = launchSessionReducer(state, { type: 'launch-failed', error: 'Emulador não configurado.' });

    expect(state).toEqual({ state: 'failed', focusToken: 'disc-play', error: 'Emulador não configurado.' });
  });
});
