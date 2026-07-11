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
import './styles/live-preview.css'
import './styles/theme.css'
import App from './App.jsx'

// Initialize theme
const savedTheme = localStorage.getItem("haisan_theme") || "dark";
if (savedTheme === "light") {
  document.documentElement.classList.add("theme-light");
  document.documentElement.classList.remove("theme-dark");
} else {
  document.documentElement.classList.add("theme-dark");
  document.documentElement.classList.remove("theme-light");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
