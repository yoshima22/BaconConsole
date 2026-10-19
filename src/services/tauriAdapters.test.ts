import { expect, it } from 'vitest';
import { tauriDiscService } from './tauriAdapters';

it('does not subscribe to native events outside the Tauri runtime', async () => {
  const stop = await tauriDiscService.onCopyProgress(() => {});
  expect(stop).toBeTypeOf('function');
});
