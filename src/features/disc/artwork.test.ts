import { expect, it } from 'vitest';
import { resolveArtwork } from './artwork';

it('uses the Chrono Legends artwork only for its matching demonstrative game', () => {
  expect(resolveArtwork('chrono-legends')).toEqual({ background: '/assets/chronolegends-background.png', cover: '/assets/chronolegends-cover.png' });
  expect(resolveArtwork('another-game')).toEqual({ background: '/assets/baconconsole-default-bg.png', cover: undefined });
});
