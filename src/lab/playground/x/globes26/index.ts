import { lazy } from "react"
import type { Entry } from "../../types"
import { globeKnobs } from "../globes24/kit-data"

/**
 * Globe looks, pushed further (lab run 26): six more looks on the run 24b kit, each more extreme, each with something
 * paper flying the lines (a paper plane, a flock of three, or a paper crane). Every look, old and new, now shows the
 * story stop's view and the full screen's together under one Globe / Map switch, with the tuning panel under the key.
 */
const DECIDING = "Griffin and Nadia: any of these six worth a place beside the eleven from run 24b? Tune it (land, grain, line weight, shadow, the travelling icon) and Copy settings with the look you like."
const KIT = "Ships on the run 24b kit (see the Globe looks area's notes: one bent Three.js plane, the lines and names on a 2D layer). The tuning panel's values become the look's own settings: land opacity needs the land mask (one more small texture, painted on the device), grain is a few lines of shader, the shadow is one CSS drop shadow on the globe's layer (check it on a slow phone while it turns), and the travelling icon is drawn with the lines (no extra cost)."
const REFS = [
  { label: "Stripe, the globe", href: "https://stripe.com/blog/globe" },
  { label: "globe.gl", href: "https://github.com/vasturiano/globe.gl" },
]

export const entries: Entry[] = [
  {
    id: "globe-airmail",
    title: "Airmail",
    deciding: DECIDING,
    summary: "The world as an airmail envelope: thin blue airmail paper for the sea, envelope cream for the land, the red and blue chevron border round both poles, postmarks stamped across the oceans and PAR AVION over the Pacific. Paper planes fly every line.",
    knobs: globeKnobs("stitch", "plane"),
    live: { path: "/our-story" },
    refs: [{ label: "Airmail (Wikipedia)", href: "https://en.wikipedia.org/wiki/Airmail" }, ...REFS],
    promote: `The painter (paint() in globe-airmail.tsx) replaces paint-globe.ts, painted on the device in steps. The postmarks use Georgia and a monospace face on the canvas (no web font), so on a phone they'd want the site's own lettering. ${KIT}`,
    Component: lazy(() => import("./globe-airmail")),
  },
  {
    id: "globe-blueprint",
    title: "Blueprint (cyanotype)",
    deciding: DECIDING,
    summary: "An engineer's sun print: Prussian blue with blotchy exposure, a white graticule, the land hatched at 45° inside a traced coast, and a title block in the Southern Ocean. White drafting lines, white paper planes.",
    knobs: globeKnobs("stitch", "plane"),
    live: { path: "/our-story" },
    refs: [{ label: "Cyanotype", href: "https://en.wikipedia.org/wiki/Cyanotype" }, ...REFS],
    promote: `The painter (paint() in globe-blueprint.tsx) replaces paint-globe.ts, painted on the device in steps. Its blue is its own colour, not a site token. ${KIT}`,
    Component: lazy(() => import("./globe-blueprint")),
  },
  {
    id: "globe-riso",
    title: "Risograph, two inks",
    deciding: DECIDING,
    summary: "Printed on a riso in two inks: fluoro pink and blue on off-white (Lantern: pink and yellow on near-black). The land is a pink halftone printed off its blue coast, overprinting the sea's lines, with heavy speckle. A flock of three paper planes flies each line.",
    knobs: globeKnobs("dots", "flock"),
    live: { path: "/our-story" },
    refs: [{ label: "Risograph", href: "https://en.wikipedia.org/wiki/Risograph" }, ...REFS],
    promote: `The painter (paint() in globe-riso.tsx) replaces paint-globe.ts: two pattern fills and a stroke, the cheapest painter here. The fluoro inks are far louder than the site's palette. ${KIT}`,
    Component: lazy(() => import("./globe-riso")),
  },
  {
    id: "globe-kintsugi",
    title: "Kintsugi lacquer",
    deciding: DECIDING,
    summary: "The globe as a lacquer bowl mended with gold: vermilion urushi seas and black land (Lantern: black seas, deep red land), every coast a gold seam, gold cracks across the world, and one still highlight the world turns under. Gold-leaf paper planes.",
    knobs: globeKnobs("ink", "plane"),
    live: { path: "/our-story" },
    refs: [{ label: "Kintsugi (金継ぎ)", href: "https://en.wikipedia.org/wiki/Kintsugi" }, ...REFS],
    promote: `The painter (paint() in globe-kintsugi.tsx) replaces paint-globe.ts, plus six lines of fragment shader for the highlight (no extra geometry). Risk: the cracks read as breakage, which might be the wrong note for a wedding; the gold lines are the strongest of any look. ${KIT}`,
    Component: lazy(() => import("./globe-kintsugi")),
  },
  {
    id: "globe-chiyogami",
    title: "Chiyogami collage",
    deciding: DECIDING,
    summary: "Every country cut from a different patterned paper (checks, waves, dots, stripes, a hemp-leaf lattice) and pasted on kozo washi with its fibres showing, each piece lifting off the sheet with a soft shadow. Red thread lines, and a paper crane flies each one.",
    knobs: globeKnobs("thread", "crane"),
    live: { path: "/our-story" },
    refs: [{ label: "Chiyogami (千代紙)", href: "https://en.wikipedia.org/wiki/Chiyogami" }, ...REFS],
    promote: `The painter (paint() in globe-chiyogami.tsx) replaces paint-globe.ts: five small pattern tiles, one fill per country. The papers are simplified (the hemp leaf is a plain lattice); Nadia could paint real ones as tiles. ${KIT}`,
    Component: lazy(() => import("./globe-chiyogami")),
  },
  {
    id: "globe-folded",
    title: "Folded road map",
    deciding: DECIDING,
    summary: "A much-used fold-out map: pastel countries with dashed borders, depth bands off the coasts, eight by four concertina folds lit in the shader so the creases turn with the world, the paper rubbed white where folds cross, and a coffee ring. A flock of paper planes, as if folded from the map.",
    knobs: globeKnobs("ink", "flock"),
    live: { path: "/our-story" },
    refs: [{ label: "Map folding", href: "https://en.wikipedia.org/wiki/Map_folding" }, ...REFS],
    promote: `The painter (paint() in globe-folded.tsx) replaces paint-globe.ts, plus four lines of fragment shader for the fold light (the folds show on the flat map too). ${KIT}`,
    Component: lazy(() => import("./globe-folded")),
  },
]
