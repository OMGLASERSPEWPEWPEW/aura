import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupConsoleCapture } from './lib/utils/errorExport'

// Initialize console capture BEFORE React renders
setupConsoleCapture();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
