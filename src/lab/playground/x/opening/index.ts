import { lazy } from "react"
import type { Entry } from "../../types"

/** Opening: the first few seconds of a first visit. */
export const entries: Entry[] = [
  {
    id: "opening-letter-out",
    deciding: "Jehan: A (the site today, with better timing), B (the flap turns in 3D) or C (the letter bends as it lifts)? The site keeps A unless B is clearly better.", title: "The letter out of the open envelope (A, B, C)",
    summary: "Nadia's open envelope (18 Oct) in two layers with the letter between them, so it comes out of the pocket. Three timings and movements to pick from.",
    refs: [{ label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }],
    promote: "A is what ships (envelope.tsx and polish.css). B needs the flap as its own layer to look right on the site (Nadia's separate layers, docs/art.md). C is a keyframe on the letter. All transforms, no new weight; reduced motion shows the last frame.",
    Component: lazy(() => import("./opening-letter-out")),
  },
]
