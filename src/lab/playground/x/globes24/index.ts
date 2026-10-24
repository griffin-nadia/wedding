import { lazy } from "react"
import { lookPage } from "./page"
import type { Entry } from "../../types"
import { globeKnobs } from "./kit-data"

/**
 * Globe looks (lab run 24b; run 26 added six more in ../globes26 and, on every look, both views under one switch and a
 * tuning panel): one take per look, all on the same kit (kit.tsx: the journey data, the crowd switch, the
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
    Component: lookPage(() => import("./globe-watercolour")),
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
    Component: lookPage(() => import("./globe-sashiko")),
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
    Component: lookPage(() => import("./globe-woodblock")),
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
    Component: lookPage(() => import("./globe-antique")),
  },
  {
    id: "globe-dotted",
    title: "Dotted (halftone)",
    deciding: DECIDING,
    summary: "The land printed as ink dots on paper, Stripe and COBE style: dots evenly spaced over the ball and shrinking towards the coasts like a halftone screen, with a fainter, finer screen over the sea.",
    knobs: globeKnobs("dots"),
    live: { path: "/our-story" },
    refs: [{ label: "Halftone", href: "https://en.wikipedia.org/wiki/Halftone" }, ...REFS],
    promote: `The painter (paint() in globe-dotted.tsx) replaces paint-globe.ts, painted on the device in steps from a quarter-size land mask, no image to download. ${KIT}`,
    Component: lookPage(() => import("./globe-dotted")),
  },
  {
    id: "globe-lantern",
    title: "Lantern night",
    deciding: DECIDING,
    summary: "Made for the Lantern theme: a deep indigo night sea, moonlit coasts, a still warm lantern glow at Kyoto, Brisbane, Victoria and every guest's city, and the lines as strings of tiny glowing lanterns. In the light theme it's dusk (run 27: so it reads apart from the pale looks): a blue evening sea, the lanterns just lit.",
    knobs: globeKnobs("dots"),
    live: { path: "/our-story" },
    refs: [{ label: "Tōrō nagashi (floating lanterns)", href: "https://en.wikipedia.org/wiki/T%C5%8Dr%C5%8D_nagashi" }, ...REFS],
    promote: `The painter (paint() in globe-lantern.tsx) replaces paint-globe.ts, painted on the device in steps. The glows are the kit's new optional glow: one small soft sprite per place and a wide faint pass under each line, drawn on the 2D layer with an additive mix at night (still, no flicker). That doubles the line drawing per frame while the globe turns, so check it on a slow phone at 40 households. ${KIT}`,
    Component: lookPage(() => import("./globe-lantern")),
  },
  {
    id: "globe-papercut",
    title: "Paper cut-out",
    deciding: DECIDING,
    summary: "Lab 19's paper cut-out pushed further: the world cut from gouache-painted sheets and stacked (deep sea, paler shallows, the land in three papers, an inland sheet), each with a soft shadow on the one below and a pale core where it was cut. A paper plane flies each line once.",
    knobs: globeKnobs("plane"),
    live: { path: "/our-story" },
    refs: [{ label: "Kirie (切り絵) paper cutting", href: "https://en.wikipedia.org/wiki/Kirie" }, ...REFS],
    promote: `The painter (paint() in globe-papercut.tsx) replaces paint-globe.ts, painted on the device in steps; the shadows are blurred by scaling a small copy, so no filter or shadowBlur. The shadows fall down and to the right on the paper, so on the turning globe they turn with it rather than staying lit from one side. ${KIT}`,
    Component: lookPage(() => import("./globe-papercut")),
  },
  {
    id: "globe-inkline",
    title: "Ink line",
    deciding: DECIDING,
    summary: "In the spirit of Nadia's venue map: outlines only, drawn twice in soft brown pen as a hand would, her river blue as a water line off the coasts, borders in her road green, a few pen waves at sea, on cream paper with her crayon scumble.",
    knobs: globeKnobs("ink"),
    live: { path: "/our-story" },
    refs: [{ label: "Pictorial maps", href: "https://en.wikipedia.org/wiki/Pictorial_maps" }, ...REFS],
    promote: `The painter (paint() in globe-inkline.tsx) replaces paint-globe.ts, painted on the device in steps. Her art isn't used, only its palette and feel; if Nadia draws the coasts herself, that's ART.globeLand (look 11). ${KIT}`,
    Component: lookPage(() => import("./globe-inkline")),
  },
  {
    id: "globe-origami",
    title: "Origami: folded washi",
    deciding: DECIDING,
    summary: "A ball folded from washi: the world in facets 15° square, each lit flat from the top left, the crease pattern printed on the sheet. Flat, it's the unfolded sheet with its creases; Globe folds it up, and the facets turn with the land.",
    knobs: globeKnobs("plane"),
    live: { path: "/our-story" },
    refs: [{ label: "Origami crease patterns", href: "https://en.wikipedia.org/wiki/Crease_pattern" }, ...REFS],
    promote: `The painter (paint() in globe-origami.tsx) replaces paint-globe.ts, painted on the device in steps, plus a few lines of fragment shader for the facets' light (no extra geometry: the facets are worked out per pixel, so they turn with the land). The kit's fragment shader needs the view's uLon and uTilt for it (added here). ${KIT}`,
    Component: lookPage(() => import("./globe-origami")),
  },
  {
    id: "globe-snow",
    title: "Snow globe (for fun)",
    deciding: DECIDING,
    summary: "A snowy little world inside a glass dome on a lacquer base, Kyoto riding near the top, maple leaves drifting down inside the glass instead of snow. One soft reflection that stays still. Flat, the glass and the leaves go.",
    knobs: globeKnobs("leaf"),
    live: { path: "/our-story" },
    refs: REFS,
    promote: `The painter (paint() in globe-snow.tsx) replaces paint-globe.ts; the dome, base and leaves are one SVG and six CSS-animated leaves over the map (transform and opacity only, still under reduced motion). The look starts the globe facing 10°S so Kyoto rides near the top (a new tilt option in the kit). ${KIT} Maple leaves: a plain silhouette, because Nadia's maple leaf art isn't available yet; hers would drop into the same six leaves. Risk: it's a novelty, and the base covers the far south of the ball.`,
    Component: lookPage(() => import("./globe-snow")),
  },
  {
    id: "globe-nadia",
    title: "Nadia's own painting",
    deciding: "Nadia: would you paint the globe's land? This is how one 2:1 painting of yours would sit on the ball (shown with your venue map's colours as a stand-in), and the template you'd paint on.",
    summary: "The globe wearing one 2:1 painting of Nadia's. Until hers exists, a stand-in painted in her venue map's colours (sage paper, river blue, little tree clumps, maple patches); the Painting knob shows the blank template, or hers once it's in private/nadia-art-globe/.",
    knobs: [...globeKnobs("ink"), { id: "painting", label: "Painting", kind: "select", options: [["standin", "Stand-in (her venue map's colours)"], ["template", "The blank template"], ["hers", "Hers (private/nadia-art-globe/globe-land.png)"]], def: "standin" }],
    live: { path: "/our-story" },
    refs: REFS,
    promote: `Ready to ship once she paints it. In src/lib/art.ts, ART.globeLand becomes { src: "art/map/globe-land", sea: false } (today it's a bare string, "sea included"): sea false means her land on a clear background, and the site paints the sea in each theme's colour so one painting serves light and Lantern (Lantern multiplies a dusk over it). journey-globe.tsx (or the kit's paint) reads ART.globeLand.src and, when sea is false, fills the sea first; scripts/art-export.mjs exports private/nadia-art-globe/globe-land.png to public/art/map/globe-land-1024.webp (phones) and -2048.webp, alpha kept. Weight: one WebP, about 200 to 400 kB at 2048 (less on phones) (more than painting on the device, which is free). ${KIT}`,
    Component: lazy(() => import("./globe-nadia-lab")),
  },
]
