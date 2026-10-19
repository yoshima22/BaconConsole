import { fireEvent, render, screen } from '@testing-library/react';
import { DiscPage } from './DiscPage';
import { createDiscSession } from './discSession';

it('shows an empty-media state', () => {
  render(<DiscPage session={createDiscSession()} onAction={() => {}} />);
  expect(screen.getByRole('heading', { name: /nenhum bacondisc inserido/i })).toBeInTheDocument();
});

it('does not focus or enable unavailable actions', () => {
  const session = { ...createDiscSession(), media: { state: 'inserted' as const, root: 'C:/Disc', disc: { id: 'demo', title: 'Demo', platform: 'windows', packageType: 'portable', entryPoint: 'Game/demo.exe', modes: ['play-direct'], fileCount: 1, totalBytes: 1 } } };
  render(<DiscPage session={session} onAction={() => {}} />);
  expect(screen.getByRole('button', { name: /usar cache/i })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('button', { name: /jogar do disco/i }), { key: 'Tab' });
});
