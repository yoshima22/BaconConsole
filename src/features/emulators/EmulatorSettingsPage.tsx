import { useState } from 'react';
import type { EmulatorKind, EmulatorProfile } from '../../services/contracts';

const profiles: Array<{ id: string; name: string; kind: EmulatorKind; detail: string }> = [
  { id: 'retroarch', name: 'RetroArch', kind: 'retroarch', detail: 'NES, SNES, Mega Drive e Game Boy Advance' },
  { id: 'duckstation', name: 'DuckStation', kind: 'duckstation', detail: 'PlayStation (PS1)' },
  { id: 'pcsx2', name: 'PCSX2', kind: 'pcsx2', detail: 'PlayStation 2' },
  { id: 'windows-portable', name: 'Windows portátil', kind: 'windows-portable', detail: 'Executa o .exe declarado por uma mídia BaconDisc validada' },
];

export function EmulatorSettingsPage({ profiles: saved, onSave, onChooseExecutable }: {
  profiles: EmulatorProfile[];
  onSave: (profile: EmulatorProfile) => Promise<void> | void;
  onChooseExecutable: (kind: EmulatorKind) => Promise<string | null> | string | null;
}) {
  const [paths, setPaths] = useState<Record<string, string>>(() => Object.fromEntries(saved.map((profile) => [profile.kind, profile.executable])));
  const [notice, setNotice] = useState<string | null>(null);
  const configure = async (definition: typeof profiles[number]) => {
    const selected = await onChooseExecutable(definition.kind);
    if (selected) setPaths((current) => ({ ...current, [definition.kind]: selected }));
  };
  const save = async (definition: typeof profiles[number]) => {
    const executable = paths[definition.kind]?.trim() ?? '';
    if (!executable && definition.kind !== 'windows-portable') return setNotice(`Informe o executável do ${definition.name}.`);
    const previous = saved.find((profile) => profile.kind === definition.kind);
    await onSave({ id: previous?.id ?? definition.id, name: definition.name, kind: definition.kind, executable, cores: previous?.cores ?? {} });
    setNotice(`${definition.name} salvo.`);
  };
  return <section className="emulator-settings" aria-label="Configurações de emuladores">
    <p className="eyebrow">Configurações / Jogos</p><h1>Emuladores</h1>
    <p className="settings-copy">Configure somente executáveis locais confiáveis. As ROMs, BIOS, saves e estados permanecem no seu computador.</p>
    <div className="emulator-grid">{profiles.map((definition) => {
      const configured = definition.kind === 'windows-portable' || Boolean(paths[definition.kind]);
      return <article className="emulator-card" key={definition.id}>
        <div><h2>{definition.name}</h2><p>{definition.detail}</p><span className={configured ? 'status-badge status-badge--success' : 'status-badge status-badge--warning'}>{configured ? 'Configurado' : 'Aguardando executável'}</span></div>
        {definition.kind === 'windows-portable' ? <p>Sem executável global: o launcher usa somente a entrada validada do jogo.</p> : <label>Executável local<input aria-label={`Executável ${definition.name}`} value={paths[definition.kind] ?? ''} placeholder="C:\\Caminho\\emulador.exe" onChange={(event) => setPaths((current) => ({ ...current, [definition.kind]: event.target.value }))} /></label>}
        <div className="emulator-card__actions">{definition.kind !== 'windows-portable' && <button className="action-button action-button--ghost" onClick={() => void configure(definition)}>Configurar {definition.name}</button>}<button className="action-button" disabled={!configured} onClick={() => void save(definition)}>Salvar</button></div>
      </article>;
    })}</div>{notice && <p className="settings-notice" role="status">{notice}</p>}
  </section>;
}
