export type LaunchSession = {
  state: 'idle' | 'launching' | 'running' | 'returned' | 'failed';
  focusToken: string | null;
  error: string | null;
};

export type LaunchSessionAction =
  | { type: 'launch-requested'; focusToken: string }
  | { type: 'game-running' }
  | { type: 'game-returned' }
  | { type: 'launch-failed'; error: string }
  | { type: 'reset' };

export const createLaunchSession = (): LaunchSession => ({ state: 'idle', focusToken: null, error: null });

export function launchSessionReducer(state: LaunchSession, action: LaunchSessionAction): LaunchSession {
  switch (action.type) {
    case 'launch-requested': return { state: 'launching', focusToken: action.focusToken, error: null };
    case 'game-running': return { ...state, state: 'running' };
    case 'game-returned': return { ...state, state: 'returned', error: null };
    case 'launch-failed': return { ...state, state: 'failed', error: action.error };
    case 'reset': return createLaunchSession();
  }
}
