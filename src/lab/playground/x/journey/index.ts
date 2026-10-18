import { lazy } from "react"
import type { Entry } from "../../types"

/** Journey: the globe at the end of Our story, in three hands, and its painted flat fallback */
const HANDS = [{ id: "watercolour", label: "Watercolour washes" }, { id: "ink", label: "Ink line" }, { id: "gouache", label: "Gouache cut-out" }]
export const entries: Entry[] = [
  {
    id: "journey-globe-styles",
    title: "The globe in three hands",
    deciding: "Griffin and Nadia: the site has see-through washes since #176. Keep those, or an ink drawing, or gouache cut from paper? (Or Nadia paints it: ART.globeLand.)",
    summary: "The site's globe with every line (Nadia's, Griffin's, one per guest city, yours in gold) and the land painted three ways. Turn it: it follows your finger and coasts to a stop when you flick it. Kyoto is labelled on the city.",
    takes: HANDS,
    knobs: [{ id: "label", label: "Kyoto label", kind: "select", options: [["on", "On"], ["off", "Off"]], def: "on" }],
    live: { path: "/our-story" },
    refs: [{ label: "Susie & Jay's globe", href: "https://wedding.jongjeonglee.com" }, { label: "Three.js examples", href: "https://threejs.org/examples" }],
    promote: "The site's globe (journey-globe.tsx) has the turn, the inertia and the Kyoto label since #176, and see-through washes. A different hand is a different painter: paint.ts here in place of src/lib/paint-globe.ts. No new weight. Measured with software WebGL (headless), ink 39 and gouache 41 fps against the site's 44; see-through watercolour 34. Test: globe.spec.ts plus a drag.",
    Component: lazy(() => import("./journey-globe-styles")),
  },
  {
    id: "journey-flat-painted",
    title: "Painted flat map",
    deciding: "Jehan: the site's flat map uses the globe's painting since #176. Is this crop (Pacific in the middle) and the lines bowing north better?",
    summary: "The journey on a flat painted map, Pacific in the middle, the lines bowing north like flight paths and drawing in. The same three hands as the globe, so they agree.",
    takes: HANDS,
    live: { path: "/our-story" },
    refs: [{ label: "Natural Earth", href: "https://www.naturalearthdata.com" }],
    promote: "The site's flat map (#176, #184) already uses the globe's painting. This crop and the bowing lines would go into journey-mini.tsx. No Three.js; paints in steps. Test: story.spec.ts flat-mode screenshot.",
    Component: lazy(() => import("./journey-flat-painted")),
  },
]
