import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmulatorSettingsPage } from './EmulatorSettingsPage';

const retroArch = { id: 'retroarch', name: 'RetroArch', kind: 'retroarch' as const, executable: 'C:/Tools/retroarch.exe', cores: { nes: 'cores/nestopia_libretro.dll' } };

describe('EmulatorSettingsPage', () => {
  it('shows configured RetroArch and disables unavailable profiles', () => {
    render(<EmulatorSettingsPage profiles={[retroArch]} onSave={vi.fn()} onChooseExecutable={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'RetroArch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configurar DuckStation' })).toBeEnabled();
    expect(screen.getAllByText('Aguardando executável')).toHaveLength(2);
  });

  it('saves a selected executable after explicit user interaction', () => {
    const onChooseExecutable = vi.fn().mockResolvedValue('C:/Tools/retroarch.exe');
    render(<EmulatorSettingsPage profiles={[]} onSave={vi.fn()} onChooseExecutable={onChooseExecutable} />);
    fireEvent.click(screen.getByRole('button', { name: 'Configurar RetroArch' }));
    expect(onChooseExecutable).toHaveBeenCalledWith('retroarch');
  });

  it('reflects managed profiles received after the initial render', () => {
    const { rerender } = render(<EmulatorSettingsPage profiles={[]} onSave={vi.fn()} onChooseExecutable={vi.fn()} />);
    rerender(<EmulatorSettingsPage profiles={[retroArch]} onSave={vi.fn()} onChooseExecutable={vi.fn()} />);
    expect(screen.getByLabelText('Executável RetroArch')).toHaveValue('C:/Tools/retroarch.exe');
  });

  it('does not expose a free-text ROM launcher in the console flow', () => {
    render(<EmulatorSettingsPage profiles={[retroArch]} onSave={vi.fn()} onChooseExecutable={vi.fn()} />);
    expect(screen.queryByLabelText('Caminho do conteúdo autorizado')).not.toBeInTheDocument();
  });
});
