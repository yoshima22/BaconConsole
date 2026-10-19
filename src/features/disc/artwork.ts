export type Artwork = { background: string; cover?: string };

const defaultArtwork: Artwork = { background: '/assets/baconconsole-default-bg.png' };
const artworkByGame: Record<string, Artwork> = {
  'chrono-legends': { background: '/assets/chronolegends-background.png', cover: '/assets/chronolegends-cover.png' },
  'baconconsole.lunar-archive-demo': { background: '/assets/chronolegends-background.png', cover: '/assets/chronolegends-cover.png' },
};

export const resolveArtwork = (gameId?: string): Artwork => gameId ? artworkByGame[gameId] ?? defaultArtwork : defaultArtwork;
