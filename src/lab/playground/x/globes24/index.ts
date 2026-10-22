import { lazy } from "react"
import type { Entry } from "../../types"
import { globeKnobs } from "./kit-data"

/**
 * Globe looks (lab run 24b): one take per look, all on the same kit (kit.tsx: the journey data, the crowd switch, the
 * Globe/Flat toggle that curls the paper, the key, the place names and the line styles). Looks 5 to 11 go here too.
 */
const REFS = [
  { label: "Stripe, the globe", href: "https://stripe.com/blog/globe" },
  { label: "GitHub, how we built the globe", href: "https://github.blog/engineering/how-we-built-the-github-globe" },
  { label: "COBE", href: "https://cdn.jsdelivr.net/gh/shuding/cobe@main/README.md" },
  { label: "globe.gl", href: "https://github.com/vasturiano/globe.gl" },
]
const DECIDING = "Griffin and Nadia: which look for the journey globe (and which line style with it)? Each look on the Shortlist with the same lines and key."
const KIT = "Ships as the kit's three parts in place of journey-globe.tsx and journey-flat.tsx: one Three.js plane bent by a vertex shader between the flat map and the globe (so the toggle curls instead of swapping, and the flat map stops being a second painting), lines and labels on a 2D layer over it, the toggle fixed above and one key under both. Same Three.js chunk as today (no Line2 any more); the flat map then needs WebGL too, so a phone without it keeps today's SVG flat map. Risks: the labels and guest dots are moved every frame (transform only); the 2D layer redraws while it turns. Notes: Griffin's line starts at Victoria (BC), as run 24's decision names it; the site draws it from Edmonton today. The maple leaf line style is a plain leaf silhouette in the ink colour, because Nadia's maple leaf art isn't available yet. Crowded-line bundling and the zoom aren't in these takes."

export const entries: Entry[] = [
  {
    id: "globe-watercolour",
    title: "Watercolour (the site today)",
    deciding: DECIDING,
    summary: "The site's own painted watercolour, see-through, as the baseline: every other look is judged against it. Globe and Flat curl the same painted paper.",
    knobs: globeKnobs("ink"),
    live: { path: "/our-story" },
    refs: REFS,
    promote: `No new painting: src/lib/paint-globe.ts as it is. ${KIT}`,
    Component: lazy(() => import("./globe-watercolour")),
  },
  {
    id: "globe-sashiko",
    title: "Sashiko: indigo cloth",
    deciding: DECIDING,
    summary: "An indigo cloth globe with the land stitched in white running stitches, coasts sewn round, and their lines in red thread with a tiny knot where each starts. Pairs with the red thread story take.",
    knobs: globeKnobs("thread"),
    live: { path: "/our-story" },
    refs: [{ label: "Hitomezashi sashiko patterns", href: "https://en.wikipedia.org/wiki/Sashiko" }, ...REFS],
    promote: `The painter (paint() in globe-sashiko.tsx) replaces paint-globe.ts: painted on the device in steps, no image to download. ${KIT} The indigo is its own colour, not a site token: one more for the token file if it ships.`,
    Component: lazy(() => import("./globe-sashiko")),
  },
  {
    id: "globe-woodblock",
    title: "Woodblock print",
    deciding: DECIDING,
    summary: "Ukiyo-e: the sea in seigaiha waves deepening to Prussian blue at the poles, the land in flat colour printed a hair off its ink outline, with the wood and paper grain over it.",
    knobs: globeKnobs("dots"),
    live: { path: "/our-story" },
    refs: [{ label: "Seigaiha (青海波)", href: "https://en.wikipedia.org/wiki/Seigaiha" }, { label: "Hokusai, Thirty-six Views of Mount Fuji", href: "https://en.wikipedia.org/wiki/Thirty-six_Views_of_Mount_Fuji" }, ...REFS],
    promote: `The painter (paint() in globe-woodblock.tsx) replaces paint-globe.ts, painted on the device in steps. ${KIT}`,
    Component: lazy(() => import("./globe-woodblock")),
  },
  {
    id: "globe-antique",
    title: "Antique paper globe",
    deciding: DECIDING,
    summary: "Twelve printed paper gores with their seams showing, sepia land with water-lining round the coasts, hand-lettered oceans, foxing and a little compass rose. Flat, it's the printed sheet; the toggle pastes it round the ball.",
    knobs: globeKnobs("ink"),
    live: { path: "/our-story" },
    refs: [{ label: "Globe gores (Library of Congress)", href: "https://www.loc.gov/maps/?q=globe+gores" }, ...REFS],
    promote: `The painter (paint() in globe-antique.tsx) replaces paint-globe.ts, painted on the device in steps; the ocean names use the site's display face (Latin only, so Japanese would need its own lettering). ${KIT}`,
    Component: lazy(() => import("./globe-antique")),
  },
]
