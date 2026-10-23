// First: saved data is checked before anything reads it (run 19)
import "./lib/storage"
import { nextFrame } from "./lib/frame"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fonts are self-hosted (no Google Fonts). Latin faces are in styles/fonts.css; Japanese loads on demand.
import "./styles/fonts.css"
import "./index.css"
import "./styles/polish.css"
import App from "./App"
import { applySeason } from "./lib/seasons"
import { startPaperSheet } from "./lib/paper-sheet"

applySeason()

// The static envelope shell (index.html) has done its job once the app has painted
nextFrame(() => nextFrame(() => document.getElementById("arrival-shell")?.remove()))

// Started: from here a file that fails to load shows up as an error in the app, not as a script error (index.html)
window.__ngBooted = true
// The safety net (run 19): a page or piece that couldn't load reloads the page once, past the cache; anything else
// that breaks the app shows the plain "Something went wrong" card (index.html) instead of a blank page
const unloaded = /dynamically imported module|module script failed|Unable to preload CSS/i
createRoot(document.getElementById("root")!, {
  onUncaughtError: (error) => {
    console.error(error)
    if (!(unloaded.test(String(error)) && window.__ngReload?.())) window.__ngCrash?.()
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The paper (run 26): an exported sheet the first-paint script has already asked for (src/lib/paper-sheet.ts)
startPaperSheet()
