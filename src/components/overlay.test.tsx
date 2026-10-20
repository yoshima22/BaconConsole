import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OverlayHost, useOverlay } from './OverlayHost';

function Harness() {
  const overlay = useOverlay();
  return <><button onClick={() => void overlay.confirm({ title: 'Confirmar', message: 'Deseja continuar?', confirmLabel: 'Continuar' })}>Abrir confirmação</button><button onClick={() => overlay.notify({ kind: 'success', message: 'Biblioteca atualizada.' })}>Notificar</button></>;
}

describe('console overlays', () => {
  it('restores focus to the opener after Escape closes confirmation', async () => {
    render(<OverlayHost><Harness /></OverlayHost>);
    const opener = screen.getByRole('button', { name: 'Abrir confirmação' });
    opener.focus();
    fireEvent.click(opener);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('renders notification status without moving focus', () => {
    render(<OverlayHost><Harness /></OverlayHost>);
    const trigger = screen.getByRole('button', { name: 'Notificar' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('status')).toHaveTextContent('Biblioteca atualizada.');
    expect(trigger).toHaveFocus();
  });
});
