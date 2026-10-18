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

// The paper (18g): made after the page has painted, at idle or on the first input, whichever comes first, in its own
// chunk; it fades in once made. Under reduced motion or Save-Data the paper stays plain (and without WebGL).
{
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  if (!calm) {
    const kinds = ["pointerdown", "keydown", "wheel", "touchstart"] as const
    let started = false
    const go = () => {
      if (started) return
      started = true
      kinds.forEach((k) => removeEventListener(k, go, true))
      void import("./lib/paper-live").then((m) => m.startPaper())
    }
    kinds.forEach((k) => addEventListener(k, go, { capture: true, passive: true }))
    // Idle once the page has settled (3 s after load), so making it never competes with the first paints
    addEventListener("load", () => setTimeout(() => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 4000 }) : go()), 3000), { once: true })
  }
}
