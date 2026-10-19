import { useCallback, useEffect, useMemo, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { GameCard } from '../components/GameCard';
import { demoGames } from '../features/home/demoGames';
import { HomeHero } from '../features/home/HomeHero';
import { DiscStatus } from '../features/home/DiscStatus';
import { ControllerHints } from '../features/home/ControllerHints';
import { useGamepadInput } from '../hooks/useGamepadInput';
import './App.css';

export default function App() {
  const [selectedId, setSelectedId] = useState(demoGames[0].id);
  const [discInserted, setDiscInserted] = useState(false);
  const [tab, setTab] = useState(0);
  const selected = useMemo(() => demoGames.find((game) => game.id === selectedId) ?? demoGames[0], [selectedId]);
  const selectOffset = (offset: number) => { const index = demoGames.findIndex((game) => game.id === selectedId); setSelectedId(demoGames[(index + offset + demoGames.length) % demoGames.length].id); };
  const onInput = useCallback((action: string) => { if (action === 'move-right') selectOffset(1); if (action === 'move-left') selectOffset(-1); if (action === 'previous-tab') setTab((value) => (value + 3) % 4); if (action === 'next-tab') setTab((value) => (value + 1) % 4); if (action === 'confirm' && selected.requiresDisc && !discInserted) setDiscInserted(true); }, [selected, discInserted]);
  useGamepadInput(onInput);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') onInput('move-right'); if (event.key === 'ArrowLeft') onInput('move-left'); if (event.key.toLowerCase() === 'q') onInput('previous-tab'); if (event.key.toLowerCase() === 'e') onInput('next-tab'); if (event.key === 'Enter') onInput('confirm'); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onInput]);
  return <main className="console-shell" aria-label="BaconConsole"><TopBar tab={tab} onTab={setTab} /><HomeHero game={selected} discInserted={discInserted} onPlay={() => undefined} /><section><div className="section-heading"><h2>Jogos recentes</h2><span>{demoGames.length} na sua coleção</span></div><div className="games-shelf">{demoGames.map((game) => <GameCard key={game.id} game={game} selected={game.id === selected.id} onSelect={() => setSelectedId(game.id)} />)}</div></section><DiscStatus inserted={discInserted} onToggle={() => setDiscInserted((value) => !value)} /><ControllerHints /><aside className="dev-panel" aria-label="Painel de desenvolvimento"><span>Simulação</span><button className="action-button action-button--ghost" onClick={() => setDiscInserted((value) => !value)}>{discInserted ? 'Ejetar BaconDisc' : 'Inserir BaconDisc'}</button></aside></main>;
}
