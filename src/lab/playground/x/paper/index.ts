import { lazy } from "react"
import type { Entry } from "../../types"

/** Paper and light: the card's paper, and the light on it */
export const entries: Entry[] = [
  {
    id: "paper-light",
    title: "Paper and light",
    deciding: "Jehan: does the site's paper match Paper's own (side by side)? And the light sweep on a theme change: yes, or not at all?",
    summary: "Paper's own live PaperTexture beside the site's, same settings; and a very soft band of light that crosses the card once when the theme changes.",
    takes: [{ id: "side-by-side", label: "Side by side" }, { id: "sweep", label: "Light sweep" }],
    knobs: [{ id: "sweep", label: "Sweep strength", kind: "range", min: 0, max: 0.6, step: 0.05, def: 0.35 }],
    live: { path: "/" },
    refs: [{ label: "Paper Shaders, Paper texture", href: "https://shaders.paper.design/paper-texture" }],
    promote: "Side by side: nothing to ship (the right one is the site); if they differ, src/lib/paper.ts is the knob. Sweep: one fixed element over #letter, appended by lantern-toggle.tsx after its circle reveal, a transform and opacity on its own layer, removed when done. About 20 lines, no weight. Test: the theme e2e still passes and the perf trace of a mode change shows no new long task.",
    Component: lazy(() => import("./paper-light")),
  },
  {
    id: "micro-paper",
    deciding: "Jehan: which paper goes on the site (a preset, your own settings, or none)?", title: "Paper presets",
    summary: "The paper four ways (very subtle, chosen, more fibre, no folds at all), each in Light and Lantern at the size the site draws it, with sliders for folds, wrinkles, drops and fibre, and Copy settings.",
    refs: [{ label: "Paper Shaders, Paper texture", href: "https://shaders.paper.design/paper-texture" }],
    live: { path: "/" },
    promote: "Send the copied settings: they go into src/lib/paper.ts as PAPER, then node scripts/paper-bake.mjs bakes them to the three tiles the site uses. Guests never run the shader.",
    Component: lazy(() => import("../micro/micro-paper")),
  },
]
