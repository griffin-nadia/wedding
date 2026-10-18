import { lazy } from "react"
import type { Entry } from "../../types"

/** Micro: the small things a hand notices. */
export const entries: Entry[] = [
  {
    id: "micro-paper-compare",
    deciding: "Jehan: does the site's paper (right) match Paper's own live one (left)?", title: "Paper: Paper's own, and ours",
    summary: "Paper's own live PaperTexture beside the site's, with the same settings, on the same card.",
    refs: [{ label: "Paper Shaders, Paper texture", href: "https://shaders.paper.design/paper-texture" }],
    promote: "Nothing to promote: the right one is what the site does (src/lib/paper-live.ts). If they differ, the settings in src/lib/paper.ts are the knob.",
    Component: lazy(() => import("./micro-paper-compare")),
  },
  {
    id: "micro-paper",
    deciding: "Jehan: which paper goes on the site (a preset, your own settings, or none)?", title: "Paper",
    summary: "The paper four ways (very subtle, chosen, more fibre, no folds at all), each in Light and Lantern at the size the site draws it, with sliders for folds, wrinkles, drops and fibre, and Copy settings.",
    refs: [{ label: "Paper Shaders, Paper texture", href: "https://shaders.paper.design/paper-texture" }],
    promote: "Send the copied settings: they go into src/lib/paper.ts as PAPER, then node scripts/paper-bake.mjs bakes them to the three tiles the site uses. Guests never run the shader.",
    Component: lazy(() => import("./micro-paper")),
  },
]
