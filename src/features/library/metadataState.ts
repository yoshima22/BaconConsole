import { resolveArtwork } from '../disc/artwork';
export type CachedArtwork = { cover?: string; background?: string; logo?: string };
export const resolveLibraryArtwork = (gameId: string, cached?: CachedArtwork) => ({ ...resolveArtwork(gameId), ...cached });
