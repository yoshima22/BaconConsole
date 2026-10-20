import { useEffect, useState } from 'react';
import type { IntegrationStatus, MetadataService, RetroAchievementsProfile } from '../../services/contracts';
import { presentationFor } from './integrationState';

export function IntegrationsPage({ service }: { service: MetadataService }) {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [key, setKey] = useState('');
  const [username, setUsername] = useState('');
  const [editing, setEditing] = useState<'steamgriddb' | 'retroachievements' | null>(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<RetroAchievementsProfile | null>(null);
  const refresh = () => void service.integrationStatus().then(setStatuses).catch(() => setStatuses([]));
  useEffect(refresh, [service]);
  useEffect(() => { const retro = statuses.find((status) => status.id === 'retroachievements'); if (retro?.state === 'connected') void service.retroAchievementsProfile().then(setProfile).catch(() => setProfile(null)); else setProfile(null); }, [service, statuses]);
  const save = async () => {
    if (!editing || !key.trim() || editing === 'retroachievements' && !username.trim()) return;
    try {
      const result = editing === 'retroachievements' ? await service.configureAndTestRetroAchievements(username, key) : await service.configureAndTestSteamGridDb(key);
      setKey(''); setUsername(''); setEditing(null); setError(''); setStatuses((current) => current.map((item) => item.id === result.id ? result : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível validar a integração.'); }
  };
  return <section className="integrations-page" aria-label="Integrações"><p className="eyebrow">CONFIGURAÇÕES / SERVIÇOS</p><h1>Integrações</h1><p className="settings-copy">Conecte somente serviços que você deseja usar. Credenciais permanecem protegidas no Windows.</p><div className="integration-grid">{statuses.map((status) => { const view = presentationFor(status); const name = status.id === 'steamgriddb' ? 'SteamGridDB' : status.id === 'retroachievements' ? 'RetroAchievements' : status.id === 'screenscraper' ? 'ScreenScraper' : 'Steam'; const configurable = status.id === 'steamgriddb' || status.id === 'retroachievements'; return <article className="integration-card" key={status.id}><div><h2>{name}</h2><span className={`status-badge status-badge--${view.tone}`}>{view.label}</span></div><p>{status.detail}</p>{status.id === 'retroachievements' && profile && <div className="ra-profile"><strong>{profile.username} · {profile.totalPoints.toLocaleString()} pontos</strong>{profile.richPresence && <small>{profile.richPresence}</small>}</div>}{configurable && <button className="action-button" onClick={() => { setEditing(status.id as 'steamgriddb' | 'retroachievements'); setError(''); }}>{status.id === 'retroachievements' ? 'Conectar RetroAchievements' : view.action ?? 'Configurar SteamGridDB'}</button>}</article>; })}</div>{editing && <section className="integration-key-panel" role="dialog" aria-label={`Configurar ${editing === 'retroachievements' ? 'RetroAchievements' : 'SteamGridDB'}`}><h2>Conectar {editing === 'retroachievements' ? 'RetroAchievements' : 'SteamGridDB'}</h2><p>{editing === 'retroachievements' ? 'Use seu usuário e chave web da API. A chave só será salva após a conexão ser validada.' : 'Informe sua chave de API. Ela não será exibida nem salva no catálogo local.'}</p>{editing === 'retroachievements' && <input aria-label="Usuário RetroAchievements" value={username} onChange={(event) => setUsername(event.target.value)} autoFocus />}<input type="password" aria-label={editing === 'retroachievements' ? 'Chave RetroAchievements' : 'Chave SteamGridDB'} value={key} onChange={(event) => setKey(event.target.value)} autoFocus={editing !== 'retroachievements'} />{error && <p className="settings-notice">{error}</p>}<div><button className="action-button action-button--ghost" onClick={() => setEditing(null)}>Cancelar</button><button className="action-button" disabled={!key.trim() || editing === 'retroachievements' && !username.trim()} onClick={() => void save()}>Salvar e testar</button></div></section>}</section>;
}
