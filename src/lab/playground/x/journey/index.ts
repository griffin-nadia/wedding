import { lazy } from "react"
import type { Entry } from "../../types"

/** Journey: the globe at the end of Our story, in three hands, and its painted flat fallback */
const HANDS = [{ id: "watercolour", label: "Watercolour washes" }, { id: "ink", label: "Ink line" }, { id: "gouache", label: "Gouache cut-out" }]
export const entries: Entry[] = [
  {
    id: "journey-globe-styles",
    title: "The globe in three hands",
    deciding: "Griffin and Nadia: see-through watercolour, an ink drawing, or gouache cut from paper? (Or Nadia paints it: ART.globeLand.)",
    summary: "The site's globe with every line (Nadia's, Griffin's, one per guest city, yours in gold) and the land painted three ways. Turn it: it follows your finger and coasts to a stop when you flick it. Kyoto is labelled on the city.",
    takes: HANDS,
    knobs: [{ id: "label", label: "Kyoto label", kind: "select", options: [["on", "On"], ["off", "Off"]], def: "on" }],
    live: { path: "/our-story" },
    refs: [{ label: "Susie & Jay's globe", href: "https://wedding.jongjeonglee.com" }, { label: "Three.js examples", href: "https://threejs.org/examples" }],
    promote: "Swap paintGlobe in src/lib/paint-globe.ts for the chosen hand (paint.ts here), and take the turn (coalesced pointer events, flick velocity over the last 80 ms, about half a second to rest, a soft pitch spring, arrow keys) and the Kyoto label into journey-globe.tsx. No new weight: three and world-atlas are already loaded there. Risk: the see-through take draws the sphere twice (back then front); check older phones. Test: globe.spec.ts plus a drag in the perf trace.",
    Component: lazy(() => import("./journey-globe-styles")),
  },
  {
    id: "journey-flat-painted",
    title: "Painted flat map",
    deciding: "Jehan: the fallback (no WebGL, low memory, reduced motion) in the same hand as the globe?",
    summary: "The journey on a flat painted map, Pacific in the middle, the lines bowing north like flight paths and drawing in. The same three hands as the globe, so they agree.",
    takes: HANDS,
    live: { path: "/our-story" },
    refs: [{ label: "Natural Earth", href: "https://www.naturalearthdata.com" }],
    promote: "Replaces the flat mode's drawn SVG land (journey-mini.tsx) with the painted canvas and keeps its lines. No Three.js, so it's also the right still for reduced motion. About 2 MB of canvas memory at 1536 wide on phones; paints in steps (no long task). Test: story.spec.ts flat mode screenshot.",
    Component: lazy(() => import("./journey-flat-painted")),
  },
]
