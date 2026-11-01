import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.tsx';

function mount() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Load JetBrains Mono before first paint so deck.gl map labels build their font
// atlas from the real font (not a system fallback) — keeps all text uniform.
if (document.fonts && document.fonts.load) {
  Promise.race([
    Promise.all([
      document.fonts.load('400 11px "JetBrains Mono"'),
      document.fonts.load('700 11px "JetBrains Mono"'),
    ]),
    new Promise((r) => setTimeout(r, 1500)),
  ]).then(mount);
} else {
  mount();
}
