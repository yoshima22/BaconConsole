const tabs = ['Início', 'Biblioteca', 'Disco', 'Configurações'];
export function TopBar({ tab, onTab }: { tab: number; onTab: (index: number) => void }) {
  return <header className="topbar"><div className="brand"><span className="brand-mark">B</span><span>BaconConsole</span></div><nav aria-label="Navegação principal">{tabs.map((name, index) => <button key={name} className={tab === index ? 'nav-item nav-item--active' : 'nav-item'} onClick={() => onTab(index)}>{name}</button>)}</nav><div className="topbar-meta"><span className="controller-dot" aria-label="Controle conectado" /> <span>Player One</span><button className="icon-button" aria-label="Notificações">◌</button></div></header>;
}
