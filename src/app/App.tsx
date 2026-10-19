import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { GameCard } from '../components/GameCard';
import { demoGames } from '../features/home/demoGames';
import { HomeHero } from '../features/home/HomeHero';
import { DiscStatus } from '../features/home/DiscStatus';
import { ControllerHints } from '../features/home/ControllerHints';
import { useGamepadInput } from '../hooks/useGamepadInput';
import { DiscPage } from '../features/disc/DiscPage';
import { InstallPanel } from '../features/disc/InstallPanel';
import { createDiscSession, discSessionReducer, type DiscAction } from '../features/disc/discSession';
import { LibraryPage } from '../features/library/LibraryPage';
import { tauriDiscService, tauriGameLibrary } from '../services/tauriAdapters';
import type { LibraryRecord } from '../services/contracts';
import './App.css';
import './disc-flow.css';

export default function App() {
  const [selectedId, setSelectedId] = useState(demoGames[0].id);
  const [session, dispatch] = useReducer(discSessionReducer, undefined, createDiscSession);
  const [library, setLibrary] = useState<LibraryRecord[]>([]);
  const [devPath, setDevPath] = useState('.\\demo-media\\lunar-archive');
  const [tab, setTab] = useState(0);
  const selected = useMemo(() => demoGames.find((game) => game.id === selectedId) ?? demoGames[0], [selectedId]);
  const selectOffset = (offset: number) => { const index = demoGames.findIndex((game) => game.id === selectedId); setSelectedId(demoGames[(index + offset + demoGames.length) % demoGames.length].id); };
  const discInserted = session.media.state === 'inserted';
  const insertDisc = useCallback(async () => { try { const [disc, targets] = await Promise.all([tauriDiscService.inspect(devPath), tauriDiscService.storageTargets()]); dispatch({ type: 'disc-inserted', disc, root: devPath }); dispatch({ type: 'storage-targets-loaded', targets }); } catch { dispatch({ type: 'disc-invalid', error: 'Não foi possível ler bacon.json nesta pasta.' }); } }, [devPath]);
  const onInput = useCallback((action: string) => { if (action === 'move-right') selectOffset(1); if (action === 'move-left') selectOffset(-1); if (action === 'previous-tab') setTab((value) => (value + 3) % 4); if (action === 'next-tab') setTab((value) => (value + 1) % 4); if (action === 'confirm' && selected.requiresDisc && !discInserted) void insertDisc(); }, [selected, discInserted, insertDisc]);
  useGamepadInput(onInput);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'ArrowRight') onInput('move-right'); if (event.key === 'ArrowLeft') onInput('move-left'); if (event.key.toLowerCase() === 'q') onInput('previous-tab'); if (event.key.toLowerCase() === 'e') onInput('next-tab'); if (event.key === 'Enter') onInput('confirm'); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onInput]);
  useEffect(() => { let stop = () => {}; void tauriDiscService.onCopyProgress((progress) => dispatch({ type: 'copy-progressed', progress })).then((unlisten) => { stop = unlisten; }); return () => stop(); }, []);
  const onAction = async (action: DiscAction) => { if (!action.enabled || session.media.state !== 'inserted') return; if (action.id === 'details') return; if (action.id === 'play-direct') { window.alert('A execução direta exigirá confirmação explícita.'); return; } const target = action.id === 'use-cache' ? 'cache' : action.id === 'install-pc' ? 'pc' : 'ssd'; const storage = session.storageTargets[0]; if (!storage) return dispatch({ type: 'copy-failed', error: 'Destino indisponível.' }); const jobId = crypto.randomUUID(); dispatch({ type: 'copy-started', jobId, target }); try { await tauriDiscService.startCopy({ jobId, root: session.media.root, destination: storage.root, targetKind: target === 'cache' ? 'cache' : 'permanent' }); dispatch({ type: 'copy-completed' }); setLibrary(await tauriGameLibrary.list()); } catch (error) { dispatch({ type: 'copy-failed', error: error instanceof Error ? error.message : 'Falha na cópia.' }); } };
  const home = <><HomeHero game={selected} discInserted={discInserted} onPlay={() => undefined} /><section><div className="section-heading"><h2>Jogos recentes</h2><span>{demoGames.length} na sua coleção</span></div><div className="games-shelf">{demoGames.map((game) => <GameCard key={game.id} game={game} selected={game.id === selected.id} onSelect={() => setSelectedId(game.id)} />)}</div></section><DiscStatus inserted={discInserted} onToggle={() => discInserted ? dispatch({ type: 'disc-removed' }) : void insertDisc()} /></>;
  return <main className="console-shell" aria-label="BaconConsole"><TopBar tab={tab} onTab={setTab} />{tab === 2 ? <DiscPage session={session} onAction={onAction} /> : tab === 1 ? <LibraryPage records={library} /> : home}<ControllerHints /><aside className="dev-panel" aria-label="Painel de desenvolvimento"><input aria-label="Pasta do BaconDisc simulado" value={devPath} onChange={(event) => setDevPath(event.target.value)} /><button className="action-button action-button--ghost" onClick={() => discInserted ? dispatch({ type: 'disc-removed' }) : void insertDisc()}>{discInserted ? 'Ejetar BaconDisc' : 'Inserir BaconDisc'}</button></aside>{session.job.state !== 'idle' && <InstallPanel job={session.job} title={session.media.state === 'inserted' ? session.media.disc.title : 'BaconDisc'} onCancel={() => session.job.jobId && void tauriDiscService.cancelCopy(session.job.jobId)} onClose={() => dispatch({ type: 'job-reset' })} onLibrary={() => { dispatch({ type: 'job-reset' }); setTab(1); }} />}</main>;
}
