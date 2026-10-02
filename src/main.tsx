import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fonts are bundled and served from our own site (no Google Fonts requests).
// Fontsource splits the Japanese fonts by unicode range, so only glyphs on the page load.
import "@fontsource/shippori-mincho/400.css"
import "@fontsource/zen-kaku-gothic-new/400.css"
import "@fontsource/zen-kaku-gothic-new/700.css"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
