import { useEffect, useMemo, useState } from 'react';
import type { EmulatorProfile, LaunchRequest, LocalImportRequest, LocalImportResult } from '../../services/contracts';

type Platform = Exclude<LaunchRequest['contentPlatform'], 'windows'>;
const platforms: Array<{ id: Platform; label: string }> = [
  { id: 'nes', label: 'NES' }, { id: 'snes', label: 'SNES' }, { id: 'megadrive', label: 'Mega Drive' },
  { id: 'gba', label: 'Game Boy Advance' }, { id: 'ps1', label: 'PS1' }, { id: 'ps2', label: 'PS2' },
];

function supports(profile: EmulatorProfile, platform: Platform) {
  if (profile.kind === 'retroarch') return Boolean(profile.cores[platform as keyof typeof profile.cores]);
  if (profile.kind === 'duckstation') return platform === 'ps1';
  return profile.kind === 'pcsx2' && platform === 'ps2';
}

export function LocalImportPanel({ profiles, onChooseFolder, onImport, onClose, onImported }: {
  profiles: EmulatorProfile[];
  onChooseFolder: () => Promise<string | null>;
  onImport: (request: LocalImportRequest) => Promise<LocalImportResult>;
  onClose: () => void;
  onImported?: () => void;
}) {
  const [root, setRoot] = useState('');
  const [platform, setPlatform] = useState<Platform>('gba');
  const compatible = useMemo(() => profiles.filter((profile) => supports(profile, platform)), [profiles, platform]);
  const [profileId, setProfileId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setProfileId((current) => compatible.some((profile) => profile.id === current) ? current : compatible[0]?.id ?? ''); }, [compatible]);
  const chooseFolder = async () => { const selected = await onChooseFolder(); if (selected) { setRoot(selected); setNotice(null); } };
  const submit = async () => {
    if (!root || !profileId) return;
    setBusy(true); setNotice(null);
    try { const result = await onImport({ root, platform, profileId }); setNotice(String(result.imported) + ' jogos adicionados à biblioteca.'); onImported?.(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Não foi possível importar esta pasta.'); }
    finally { setBusy(false); }
  };
  const label = platforms.find((item) => item.id === platform)?.label ?? platform.toUpperCase();
  return <section className="local-import-panel" aria-label="Adicionar jogos locais">
    <div><p className="eyebrow">BIBLIOTECA LOCAL</p><h2>Adicionar jogos locais</h2><p>Escolha uma pasta autorizada. O BaconConsole registra somente formatos compatíveis e não executa arquivos durante a importação.</p></div>
    <div className="local-import-panel__fields">
      <label>Pasta de jogos<div className="local-import-panel__picker"><input aria-label="Pasta de jogos" value={root} readOnly placeholder="Nenhuma pasta selecionada" /><button className="action-button action-button--ghost" onClick={() => void chooseFolder()}>Escolher pasta</button></div></label>
      <label>Plataforma<select aria-label="Plataforma" value={platform} onChange={(event) => setPlatform(event.target.value as Platform)}>{platforms.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <label>Emulador<select aria-label="Emulador" value={profileId} disabled={!compatible.length} onChange={(event) => setProfileId(event.target.value)}>{compatible.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
    </div>
    {!compatible.length && <p className="settings-notice" role="status">Nenhum emulador compatível está disponível para {label}.</p>}
    {notice && <p className="settings-notice" role="status">{notice}</p>}
    <div className="local-import-panel__actions"><button className="action-button action-button--ghost" onClick={onClose}>Voltar</button><button className="action-button" disabled={!root || !profileId || busy} onClick={() => void submit()}>{busy ? 'Importando…' : 'Importar jogos'}</button></div>
  </section>;
}
