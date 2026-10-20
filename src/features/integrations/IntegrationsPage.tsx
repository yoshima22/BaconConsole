import { useEffect, useState } from 'react';
import type { IntegrationStatus, MetadataService } from '../../services/contracts';
import { presentationFor } from './integrationState';

export function IntegrationsPage({ service }: { service: MetadataService }) {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([]);
  const [key, setKey] = useState('');
  const [editing, setEditing] = useState(false);
  const refresh = () => void service.integrationStatus().then(setStatuses).catch(() => setStatuses([]));
  useEffect(refresh, [service]);
  const save = async () => { if (!key.trim()) return; const result = await service.configureAndTestSteamGridDb(key); setKey(''); setEditing(false); setStatuses((current) => current.map((item) => item.id === result.id ? result : item)); };
  return <section className="integrations-page" aria-label="Integrações"><p className="eyebrow">CONFIGURAÇÕES / SERVIÇOS</p><h1>Integrações</h1><p className="settings-copy">Conecte somente serviços que você deseja usar. Chaves permanecem protegidas no Windows.</p><div className="integration-grid">{statuses.map((status) => { const view = presentationFor(status); return <article className="integration-card" key={status.id}><div><h2>{status.id === 'steamgriddb' ? 'SteamGridDB' : status.id === 'retroachievements' ? 'RetroAchievements' : status.id === 'screenscraper' ? 'ScreenScraper' : 'Steam'}</h2><span className={`status-badge status-badge--${view.tone}`}>{view.label}</span></div><p>{status.detail}</p>{status.id === 'steamgriddb' && view.action && <button className="action-button" onClick={() => setEditing(true)}>{view.action}</button>}</article>; })}</div>{editing && <section className="integration-key-panel" role="dialog" aria-label="Configurar SteamGridDB"><h2>Conectar SteamGridDB</h2><p>Informe sua chave de API. Ela não será exibida nem salva no catálogo local.</p><input type="password" aria-label="Chave SteamGridDB" value={key} onChange={(event) => setKey(event.target.value)} autoFocus /><div><button className="action-button action-button--ghost" onClick={() => setEditing(false)}>Cancelar</button><button className="action-button" disabled={!key.trim()} onClick={() => void save()}>Salvar e testar</button></div></section>}</section>;
}
