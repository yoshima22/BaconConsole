import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('BaconConsole could not find its application root.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
