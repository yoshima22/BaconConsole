import type { DemoGame } from './demoGames';
import { ActionButton } from '../../components/ActionButton';
import { StatusBadge } from '../../components/StatusBadge';
export function HomeHero({ game, discInserted, onPlay }: { game: DemoGame; discInserted: boolean; onPlay: () => void }) {
  const unavailable = game.requiresDisc && !discInserted;
  return <section className="hero" style={{ backgroundImage: `${game.gradient}, radial-gradient(circle at 78% 18%, rgb(255 255 255 / 25%), transparent 29%)` }}><div className="hero-content"><p className="eyebrow">JOGO SELECIONADO</p><h1>{game.title}</h1><p className="hero-subtitle">{game.subtitle}</p><div className="hero-details"><StatusBadge tone={game.installed ? 'success' : 'warning'}>{game.installed ? 'Instalado' : 'Na mídia'}</StatusBadge><span>{game.genre}</span></div><div className="hero-actions"><ActionButton onClick={onPlay} disabled={unavailable}>{unavailable ? 'Insira o BaconDisc' : '▶ Jogar'}</ActionButton><ActionButton className="action-button--ghost">Detalhes</ActionButton></div></div><div className="hero-orbit" aria-hidden="true"><i /><i /><i /></div></section>;
}
