import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fonts are self-hosted (no Google Fonts). Latin faces are in styles/fonts.css; Japanese loads on demand.
import "./styles/fonts.css"
import "./index.css"
import App from "./App"
import { applySeason } from "./lib/seasons"

applySeason()

// The static envelope shell (index.html) has done its job once the app has painted
requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById("arrival-shell")?.remove()))

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
