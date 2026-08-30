import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress known React DevTools cross-origin errors in the iframe sandbox
window.addEventListener('error', (event) => {
  if (event.message?.includes('$$typeof') || event.message?.includes('cross-origin') || event.message?.includes('SecurityError')) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
