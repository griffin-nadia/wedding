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
  {
    id: "journey-chapter-pins",
    title: "Chapter pins on the journey map",
    deciding: "Jehan: how each chapter's place shows on the map and the globe. Picked for feat/r25-journey: the stamp (its number ties the pin to \"Chapter 2 of 7\" and it reads at 20px without covering the lines). Tag or flag instead?",
    summary: "Where each chapter happened (Hirakata, Canada, Australia, Brisbane; Taiwan once their words are in), as a stamp, a year tag or a little flag, over the site's own flat map. Tap one to see which stop it goes to. The crowd knob adds made-up households to judge them against many lines.",
    takes: [{ id: "stamp", label: "Numbered stamp" }, { id: "tag", label: "Year tag" }, { id: "flag", label: "Flag" }],
    knobs: [{ id: "crowd", label: "Crowd (demo households, never guests)", kind: "select", options: [["sample", "The sample's"], ["0", "None"], ["15", "15 demo"], ["40", "40 demo"]], def: "sample" }],
    live: { path: "/our-story" },
    refs: [{ label: "Open UI", href: "https://open-ui.org/" }],
    promote: "Shipped as the stamp in src/components/chapter-pins.tsx (both views). Another look is a CSS change to .chapter-pin (the tag also needs the year passed in). No new weight.",
    Component: lazy(() => import("./journey-chapter-pins")),
  },
]
