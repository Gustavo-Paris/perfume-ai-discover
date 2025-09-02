import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx'
import './index.css'
import { generateUUID } from './lib/uuid'

// CRITICAL: Global polyfill for crypto.randomUUID - must be first!
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  console.warn('Browser lacks crypto.randomUUID support, applying polyfill');
  (crypto as any).randomUUID = generateUUID;
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
