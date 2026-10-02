import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fonts are bundled and served from our own site (no Google Fonts requests).
// Fontsource splits the Japanese fonts by unicode range, so only glyphs on the page load.
import "@fontsource/shippori-mincho/400.css"
import "@fontsource/zen-kaku-gothic-new/400.css"
import "@fontsource/zen-kaku-gothic-new/700.css"
import "./index.css"
import App from "./App"

// Wait (briefly) for the fonts before the first paint, so text never swaps from a fallback font.
const fontsReady = Promise.all([
  document.fonts.load('400 1em "Zen Kaku Gothic New"'),
  document.fonts.load('700 1em "Zen Kaku Gothic New"'),
  document.fonts.load('400 1em "Shippori Mincho"'),
])
const timeout = new Promise((r) => setTimeout(r, 1500))

Promise.race([fontsReady, timeout])
  .catch(() => {})
  .then(() =>
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
