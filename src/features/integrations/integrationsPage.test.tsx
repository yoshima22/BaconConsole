import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { IntegrationsPage } from './IntegrationsPage';

const service = { status: vi.fn(), integrationStatus: vi.fn().mockResolvedValue([{ id: 'steamgriddb', state: 'notConfigured', detail: 'Adicione uma chave para pesquisar artes.' }, { id: 'retroachievements', state: 'notConfigured', detail: 'Conecte suas credenciais.' }]), configureAndTestSteamGridDb: vi.fn(), configureAndTestRetroAchievements: vi.fn(), configureSteamGridDb: vi.fn(), searchSteamGridDb: vi.fn(), artworkOptions: vi.fn(), cacheSteamGridDbArtwork: vi.fn(), selectedArtwork: vi.fn() };

it('opens a protected key field only for SteamGridDB', async () => {
  render(<IntegrationsPage service={service} />);
  expect(await screen.findByText('RetroAchievements')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Configurar SteamGridDB' }));
  expect(screen.getByLabelText('Chave SteamGridDB')).toHaveAttribute('type', 'password');
});
