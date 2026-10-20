import { useEffect, useMemo, useState } from 'react';
import type { CatalogGame, EmulatorProfile, LocalImportRequest, LocalImportResult, SteamSyncResult, WindowsAppResult } from '../../services/contracts';
import { resolveArtwork } from '../disc/artwork';
import { tauriMetadata } from '../../services/tauriAdapters';
import { ArtworkPicker } from './ArtworkPicker';
import { LocalImportPanel } from './LocalImportPanel';
import { GameDetailsPanel } from './GameDetailsPanel';
import { useOverlay } from '../../components/OverlayHost';

type Filter = 'all' | 'installed' | 'disc' | 'favorites';

export function LibraryPage({ games, profiles, onToggleFavorite, onChooseFolder, onChooseExecutable, onImport, onSyncSteam, onRegisterWindowsApp, onLaunch }: {
  games: CatalogGame[];
  profiles: EmulatorProfile[];
  onToggleFavorite: (gameId: number) => void;
  onChooseFolder: () => Promise<string | null>;
  onChooseExecutable: () => Promise<string | null>;
  onImport: (request: LocalImportRequest) => Promise<LocalImportResult>;
  onSyncSteam: (root?: string) => Promise<SteamSyncResult>;
  onRegisterWindowsApp: (path: string) => Promise<WindowsAppResult>;
  onLaunch: (gameId: number, installationId: number) => Promise<void>;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CatalogGame | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [cached, setCached] = useState<Record<number, Record<string, string>>>({});
  const overlay = useOverlay();
  const refreshArtwork = async (gameId: number) => {
    try {
      const records = await tauriMetadata.selectedArtwork(gameId);
      setCached((previous) => ({ ...previous, [gameId]: Object.fromEntries(records.map((record) => [record.kind === 'background' ? 'background' : record.kind === 'cover' ? 'cover' : 'logo', record.localPath])) }));
    } catch { /* Offline fallback remains visible. */ }
  };
  useEffect(() => { void Promise.all(games.map((game) => refreshArtwork(game.id))); }, [games]);
  const visible = useMemo(() => games.filter((game) => {
    const matchesQuery = game.title.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    const installed = game.installations.some((item) => item.available && item.installKind !== 'disc');
    const requiresDisc = game.installations.some((item) => item.requiresDisc);
    return matchesQuery && (filter === 'all' || filter === 'installed' && installed || filter === 'disc' && requiresDisc || filter === 'favorites' && game.favorite);
  }), [games, filter, query]);
  const launch = async (game: CatalogGame, installationId: number) => {
    if (!await overlay.confirm({ title: 'Iniciar jogo', message: `Abrir ${game.title} na instalação selecionada?`, confirmLabel: 'Jogar' })) return;
    setNotice(null);
    try { await onLaunch(game.id, installationId); }
    catch (error) { overlay.notify({ kind: 'error', message: error instanceof Error ? error.message : 'Não foi possível iniciar este jogo.' }); }
  };
  const syncSteam = async (root?: string) => {
    try { const result = await onSyncSteam(root); setNotice(result.imported ? `${result.imported} jogo${result.imported === 1 ? '' : 's'} Steam sincronizado${result.imported === 1 ? '' : 's'}.` : 'Nenhum jogo Steam instalado foi encontrado.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Não foi possível sincronizar a Steam.'); }
  };
  const chooseSteamLibrary = async () => { const root = await onChooseFolder(); if (root) await syncSteam(root); };
  const chooseWindowsApplication = async () => { const path = await onChooseExecutable(); if (!path) return; try { const result = await onRegisterWindowsApp(path); setNotice(`${result.title} foi adicionado à Biblioteca.`); } catch (error) { setNotice(error instanceof Error ? error.message : 'Não foi possível adicionar este aplicativo.'); } };
  if (showImport) return <LocalImportPanel profiles={profiles} onChooseFolder={onChooseFolder} onImport={onImport} onClose={() => setShowImport(false)} onImported={() => setNotice('Biblioteca atualizada.')} />;
  if (selected) { const fallback = resolveArtwork(selected.identityKey.replace('bacondisc:', '')); const artwork = { ...fallback, ...cached[selected.id] }; return <section className="library-page"><GameDetailsPanel game={selected} artwork={artwork} onPlay={(installationId) => void launch(selected, installationId)} onClose={() => setSelected(null)} onEditArtwork={() => setNotice('Use o seletor de artes abaixo para escolher uma imagem.')} />{notice && <p className="settings-notice" role="status">{notice}</p>}<ArtworkPicker gameId={selected.id} title={selected.title} service={tauriMetadata} onUpdated={() => void refreshArtwork(selected.id)} /></section>; }
  return <section className="library-page">
    <div className="section-heading"><div><p className="eyebrow">COLEÇÃO LOCAL</p><h1>Minha Biblioteca</h1></div><span>{visible.length} jogos</span></div>
    <div className="library-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar na biblioteca" aria-label="Buscar na biblioteca" /><button className="action-button" onClick={() => setShowImport(true)}>Adicionar jogos locais</button><button className="action-button action-button--ghost" onClick={() => void chooseWindowsApplication()}>Adicionar aplicativo Windows</button><button className="action-button action-button--ghost" onClick={() => void syncSteam()}>Sincronizar Steam</button><button className="library-filter" onClick={() => void chooseSteamLibrary()}>Pasta Steam</button>{([['all', 'Todos'], ['installed', 'Instalados'], ['disc', 'Com disco'], ['favorites', 'Favoritos']] as const).map(([id, label]) => <button key={id} onClick={() => setFilter(id)} className={filter === id ? 'library-filter library-filter--active' : 'library-filter'}>{label}</button>)}</div>
    {notice && <p className="settings-notice" role="status">{notice}</p>}
    <div className="library-grid">{visible.length ? visible.map((game) => {
      const fallback = resolveArtwork(game.identityKey.replace('bacondisc:', ''));
      const artwork = { ...fallback, ...cached[game.id] };
      const installed = game.installations.some((item) => item.available && item.installKind !== 'disc');
      const requiresDisc = game.installations.some((item) => item.requiresDisc);
      const launchable = game.installations.find((item) => item.available && (item.source === 'steam' || Boolean(item.emulatorProfileId)));
      return <article className="library-card" key={game.id}>
        <button className="library-card__favorite" aria-label={game.favorite ? 'Remover ' + game.title + ' dos favoritos' : 'Favoritar ' + game.title} onClick={() => onToggleFavorite(game.id)}>{game.favorite ? '★' : '☆'}</button>
        <div className="disc-art">{artwork.cover ? <img src={artwork.cover} alt="" /> : '◉'}</div><h2>{game.title}</h2><small>{game.platform.toUpperCase()} · {installed ? 'Instalado' : requiresDisc ? 'Requer disco' : 'Conteúdo local'}</small>
        <div className="library-card__actions">{launchable && <button className="action-button" aria-label={'Jogar ' + game.title} onClick={() => void launch(game, launchable.id)}>Jogar</button>}<button className="library-filter" onClick={() => setSelected(game)}>Artes</button></div>
      </article>;
    }) : <p className="empty-copy">Nenhum jogo corresponde aos filtros atuais.</p>}</div>
  </section>;
}
