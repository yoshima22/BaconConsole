import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the BaconConsole product name', () => {
    render(<App />);
    expect(screen.getByText('BaconConsole')).toBeInTheDocument();
  });

  it('updates the hero when a recent game is selected', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /select orbit of ember/i }));
    expect(screen.getByRole('heading', { name: 'Orbit of Ember' })).toBeInTheDocument();
  });
});
