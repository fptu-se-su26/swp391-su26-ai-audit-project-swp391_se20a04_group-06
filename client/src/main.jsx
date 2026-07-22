import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './styles/marketplace-refactor.css'
import './styles/pages.css'
import './styles/srs-features.css'
import './styles/motion.css'
import './styles/tour-guide.css'
import './styles/live-preview.css'
import './styles/theme.css'
import './styles/role-backgrounds.css'
import './styles/footer.css'
import './styles/toast.css'
import App from './App.jsx'

// Initialize theme (forced to light mode)
document.documentElement.classList.add("theme-light");
document.documentElement.classList.remove("theme-dark");
localStorage.setItem("haisan_theme", "light");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
      .catch((err) => console.error("PWA Service Worker registration failed:", err));
  });
}
