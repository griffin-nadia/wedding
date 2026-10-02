import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fonts are self-hosted (no Google Fonts). Latin faces are in styles/fonts.css; Japanese loads on demand.
import "./styles/fonts.css"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
