import { ActionButton } from '../../components/ActionButton';
export function DiscStatus({ inserted, onToggle }: { inserted: boolean; onToggle: () => void }) {
  return <section className={`disc-status ${inserted ? 'disc-status--inserted' : ''}`} aria-label="Estado do BaconDisc"><div className="disc-icon">◉</div><div><p className="eyebrow">BACONDISC</p><h2>{inserted ? 'Lunar Archive · mídia pronta' : 'Nenhuma mídia inserida'}</h2><p>{inserted ? 'Ações compatíveis estão disponíveis para esta mídia simulada.' : 'Use o painel de desenvolvimento para simular a inserção de uma mídia.'}</p></div><ActionButton className="action-button--ghost" onClick={onToggle}>{inserted ? 'Remover disco' : 'Inserir disco'}</ActionButton></section>;
}
