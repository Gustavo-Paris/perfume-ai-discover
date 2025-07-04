import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './utils/sentry';
import { initGA4 } from './utils/analytics';

// Initialize Sentry and GA4
// Note: These values will be fetched from Supabase secrets in the App component
initSentry(''); // Will be properly configured
initGA4(''); // Will be properly configured

createRoot(document.getElementById("root")!).render(<App />);
