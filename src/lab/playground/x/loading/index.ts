import { lazy } from "react"
import type { Entry } from "../../types"

/** Loading: a loading screen that preloads, so the site lags less later (Jehan's extra, lab run 19) */
export const entries: Entry[] = [
  {
    id: "loading-preload", bare: true,
    title: "A loading screen that preloads",
    deciding: "Jehan: is it worth it, and if so the seal filling with red, the envelope drawing in, or the gum leaf drifting?",
    summary: "Only on a slow first visit (after 350 ms): it loads the arrival's art in order while Nadia's seal, envelope or gum leaf shows the progress, then warms the globe, the paper and (on fast connections) the song in the background.",
    takes: [{ id: "seal", label: "The seal fills" }, { id: "envelope", label: "The envelope draws in" }, { id: "leaf", label: "A drifting leaf" }],
    knobs: [{ id: "hold", label: "Pretend it's slow", kind: "range", min: 0, max: 5, step: 0.5, def: 2.5, unit: " s" }],
    live: { path: "/", arrival: true },
    refs: [{ label: "web.dev, preload critical assets", href: "https://web.dev/articles/preload-critical-assets" }],
    promote: "Two parts, worth shipping separately. 1. The background warm (no screen): after the envelope is up and the phone is idle, import the globe's chunk and world-atlas, and the paper; the song only on 4G or wifi without Save-Data. A few lines in layout.tsx. 2. The screen itself, in index.html's first-paint script and the Arrival, shown only after 350 ms. See docs/lab.md for the measured gain. Risk: warming on a metered phone; the connection check covers the song (the biggest file).",
    Component: lazy(() => import("./loading-preload")),
  },
]
