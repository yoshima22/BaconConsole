import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmulatorSettingsPage } from './EmulatorSettingsPage';

const retroArch = { id: 'retroarch', name: 'RetroArch', kind: 'retroarch' as const, executable: 'C:/Tools/retroarch.exe', cores: { nes: 'cores/nestopia_libretro.dll' } };

describe('EmulatorSettingsPage', () => {
  it('shows configured RetroArch and disables unavailable profiles', () => {
    render(<EmulatorSettingsPage profiles={[retroArch]} onSave={vi.fn()} onChooseExecutable={vi.fn()} />);
    expect(screen.getByText('RetroArch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configurar DuckStation' })).toBeEnabled();
    expect(screen.getAllByText('Aguardando executável')).toHaveLength(2);
  });

  it('saves a selected executable after explicit user interaction', () => {
    const onChooseExecutable = vi.fn().mockResolvedValue('C:/Tools/retroarch.exe');
    render(<EmulatorSettingsPage profiles={[]} onSave={vi.fn()} onChooseExecutable={onChooseExecutable} />);
    fireEvent.click(screen.getByRole('button', { name: 'Configurar RetroArch' }));
    expect(onChooseExecutable).toHaveBeenCalledWith('retroarch');
  });
});
