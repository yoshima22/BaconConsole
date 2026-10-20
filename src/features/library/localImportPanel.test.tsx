import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocalImportPanel } from './LocalImportPanel';

const profiles = [
  { id: 'retroarch', name: 'RetroArch', kind: 'retroarch' as const, executable: 'C:/Tools/retroarch.exe', cores: { gba: 'C:/Tools/mgba.dll' } },
  { id: 'duckstation', name: 'DuckStation', kind: 'duckstation' as const, executable: 'C:/Tools/duckstation.exe', cores: {} },
];

describe('LocalImportPanel', () => {
  it('imports a selected folder with a compatible managed profile', async () => {
    const onChooseFolder = vi.fn().mockResolvedValue('D:/Authorized/PS1');
    const onImport = vi.fn().mockResolvedValue({ imported: 2, titles: ['chrono', 'echo'] });
    render(<LocalImportPanel profiles={profiles} onChooseFolder={onChooseFolder} onImport={onImport} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Escolher pasta' }));
    await waitFor(() => expect(screen.getByDisplayValue('D:/Authorized/PS1')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Plataforma'), { target: { value: 'ps1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar jogos' }));

    await waitFor(() => expect(onImport).toHaveBeenCalledWith({ root: 'D:/Authorized/PS1', platform: 'ps1', profileId: 'duckstation' }));
    expect(screen.getByText('2 jogos adicionados à biblioteca.')).toBeInTheDocument();
  });

  it('explains when no compatible emulator is detected', () => {
    render(<LocalImportPanel profiles={profiles.slice(0, 1)} onChooseFolder={vi.fn()} onImport={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Plataforma'), { target: { value: 'ps1' } });
    expect(screen.getByText('Nenhum emulador compatível está disponível para PS1.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar jogos' })).toBeDisabled();
  });
});
