export type DemoGame = { id: string; title: string; subtitle: string; genre: string; installed: boolean; requiresDisc?: boolean; gradient: string };

export const demoGames: DemoGame[] = [
  { id: 'neon-horizon', title: 'Neon Horizon', subtitle: 'Continue your expedition', genre: 'Action adventure', installed: true, gradient: 'linear-gradient(135deg,#7A6CFF,#35C2FF 58%,#0B1220)' },
  { id: 'orbit-ember', title: 'Orbit of Ember', subtitle: 'A signal beyond the heliosphere', genre: 'Space exploration', installed: true, gradient: 'linear-gradient(135deg,#F5B942,#FF5C76 52%,#1C2940)' },
  { id: 'glass-circuit', title: 'Glass Circuit', subtitle: 'Time trial · 61% complete', genre: 'Arcade racing', installed: true, gradient: 'linear-gradient(135deg,#39D98A,#35C2FF 50%,#141D2E)' },
  { id: 'lunar-archive', title: 'Lunar Archive', subtitle: 'BaconDisc required', genre: 'Narrative puzzle', installed: false, requiresDisc: true, gradient: 'linear-gradient(135deg,#E8EEF7,#7A6CFF 55%,#0B1220)' },
];
