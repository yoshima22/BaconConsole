import { describe, expect, it } from 'vitest';
import { resolveLibraryArtwork } from './metadataState';

describe('resolveLibraryArtwork', () => {
  it('prefers a locally selected cached asset', () => {
    expect(resolveLibraryArtwork('chrono-legends', { cover: 'asset://localhost/artwork/cover.png' })).toMatchObject({ cover: 'asset://localhost/artwork/cover.png' });
  });
  it('keeps the approved demonstrative and default fallbacks', () => {
    expect(resolveLibraryArtwork('chrono-legends')).toMatchObject({ cover: '/assets/chronolegends-cover.png' });
    expect(resolveLibraryArtwork('unknown')).toMatchObject({ background: '/assets/baconconsole-default-bg.png' });
  });
});
