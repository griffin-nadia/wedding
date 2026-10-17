import { nextFrame } from "./lib/frame"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fonts are self-hosted (no Google Fonts). Latin faces are in styles/fonts.css; Japanese loads on demand.
import "./styles/fonts.css"
import "./index.css"
import "./styles/polish.css"
import App from "./App"
import { applySeason } from "./lib/seasons"

applySeason()

// The static envelope shell (index.html) has done its job once the app has painted
nextFrame(() => nextFrame(() => document.getElementById("arrival-shell")?.remove()))

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The paper (18f): made in the browser, in its own small chunk, on the first tap, key, scroll or wheel. Not before:
// a large paint then would count as the page's largest paint and push it late (the first input ends that count).
// A new guest's first tap is the envelope, so the letter rises on it.
{
  const kinds = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
  const go = () => { kinds.forEach((k) => removeEventListener(k, go, true)); void import("./lib/paper-live").then((m) => m.startPaper()) }
  kinds.forEach((k) => addEventListener(k, go, { capture: true, passive: true }))
}
