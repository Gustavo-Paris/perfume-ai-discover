import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx'
import './index.css'
import { generateUUID } from './lib/uuid'
import { applyObjectHasOwnPolyfill } from './lib/objectHasOwn'
import { initSentry } from './utils/sentry'

// CRITICAL: Global polyfills - must be first!
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  console.warn('Browser lacks crypto.randomUUID support, applying polyfill');
  (crypto as any).randomUUID = generateUUID;
}

// Apply Object.hasOwn polyfill for older browsers
applyObjectHasOwnPolyfill();

// Initialize Sentry for error monitoring in production
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && import.meta.env.PROD) {
  initSentry(sentryDsn);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
