import type { DemoGame } from '../features/home/demoGames';
import { StatusBadge } from './StatusBadge';
export function GameCard({ game, selected, onSelect }: { game: DemoGame; selected: boolean; onSelect: () => void }) {
  return <button className={`game-card ${selected ? 'game-card--selected' : ''}`} onClick={onSelect} aria-label={`Select ${game.title}`} aria-pressed={selected}><span className="game-card-art" style={{ background: game.gradient }}><span className="game-card-orb" /></span><span className="game-card-copy"><strong>{game.title}</strong><small>{game.genre}</small>{game.requiresDisc && <StatusBadge tone="warning">Disco necessário</StatusBadge>}</span></button>;
}
