import './test-supabase'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Check index.html for <div id="root"></div>.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
