import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './styles/marketplace-refactor.css'
import './styles/pages.css'
import './styles/srs-features.css'
import './styles/motion.css'
import './styles/tour-guide.css'
import './styles/floating-contact.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
