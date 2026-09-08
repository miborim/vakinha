import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// O HTML ja vem pre-renderizado do build (ver scripts/prerender.mjs),
// entao hidratamos em vez de renderizar do zero: o conteudo aparece
// instantaneamente e o React apenas "assume" o DOM existente.
hydrateRoot(
  document.getElementById('root'),
  <StrictMode>
    <App />
  </StrictMode>,
)
