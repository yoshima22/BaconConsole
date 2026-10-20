export type Artwork = { background: string; cover?: string };

const defaultArtwork: Artwork = { background: '/assets/baconconsole-default-bg.png' };
const artworkByGame: Record<string, Artwork> = {
  'chrono-legends': { background: '/assets/chronolegends-background.png', cover: '/assets/chronolegends-cover.png' },
  'baconconsole.lunar-archive-demo': { background: '/assets/chronolegends-background.png', cover: '/assets/chronolegends-cover.png' },
};

const normalizedTitleArtwork: Record<string, Artwork> = { 'chrono legends': artworkByGame['chrono-legends'] };

export const resolveArtwork = (gameId?: string, title?: string): Artwork => {
  if (gameId && artworkByGame[gameId]) return artworkByGame[gameId];
  const titleKey = title?.trim().toLocaleLowerCase();
  return titleKey ? normalizedTitleArtwork[titleKey] ?? defaultArtwork : defaultArtwork;
};
