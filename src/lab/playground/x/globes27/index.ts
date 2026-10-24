import type { Entry } from "../../types"
import { globeKnobs } from "../globes24/kit-data"
import { lookPage } from "../globes24/page"

/**
 * Globe looks, run 27: four more on the same kit (video game, see-through, hanbok red, black and white). Every look
 * now has the site's marks only (the Kyoto seal, G, N, the guests' dots and "You"), and the picker page
 * (/looks/qx26de88/) shows all of them, grouped, for Griffin and Nadia to choose from.
 */
const DECIDING = "Picked: Griffin and Nadia chose Antique (run 27), now on the site. The picker page is gone."
const KIT = "Ships on the run 24b kit (one bent Three.js plane, the lines and names on a 2D layer), as every look does."
const REFS = [{ label: "Stripe, the globe", href: "https://stripe.com/blog/globe" }]

export const entries: Entry[] = [
  {
    id: "globe-arcade",
    title: "Video game",
    deciding: DECIDING,
    summary: "A world from an old console: a sea of big square pixels with pixel wave crests, flat green low-poly land, a low-poly ball, chunky square-ended lines and a pixel plane on each.",
    knobs: globeKnobs("pixel", "pixel"),
    live: { path: "/our-story" },
    refs: [{ label: "Pixel art", href: "https://en.wikipedia.org/wiki/Pixel_art" }, ...REFS],
    promote: `The painter paints the sea at 160 by 80 and blows it up unsmoothed (the kit's new nearest option), the land facets are a few lines of shader on the land mask, and the ball is a 36 by 18 mesh. ${KIT}`,
    Component: lookPage(() => import("./globe-arcade")),
  },
  {
    id: "globe-glass",
    title: "See-through glass",
    deciding: DECIDING,
    summary: "A glass globe: clear sea with a breath of tint, frosted land with a bright etched outline, the far side of the world showing through, one still highlight and glowing lines.",
    knobs: globeKnobs("plane", "plane"),
    live: { path: "/our-story" },
    refs: REFS,
    promote: `The painter paints a mostly clear picture (alpha), the kit draws the far side through it, and the glow is the kit's existing one. Risk: the most see-through look, so busy crowds read as a tangle. ${KIT}`,
    Component: lookPage(() => import("./globe-glass")),
  },
  {
    id: "globe-hanbok",
    title: "Hanbok red",
    deciding: DECIDING,
    summary: "The world as a hanbok's silk: deep red with a gold-leaf flower print, ink black land edged in gold, and the saekdong rainbow stripes round both poles. Gold lines.",
    knobs: globeKnobs("ink", "plane"),
    live: { path: "/our-story" },
    refs: [{ label: "Hanbok", href: "https://en.wikipedia.org/wiki/Hanbok" }, { label: "Saekdong", href: "https://en.wikipedia.org/wiki/Saekdong" }, ...REFS],
    promote: `The painter paints the silk, the gold-leaf print and the stripes on the device. ${KIT}`,
    Component: lookPage(() => import("./globe-hanbok")),
  },
  {
    id: "globe-ink",
    title: "Black and white",
    deciding: DECIDING,
    summary: "Ink on paper and nothing else: an engraved sea, the land bare paper with a bold coast, every line in black ink, only the household's own line in the site's gold. Lantern prints it in reverse.",
    knobs: globeKnobs("ink", "plane"),
    live: { path: "/our-story" },
    refs: [{ label: "Engraving", href: "https://en.wikipedia.org/wiki/Engraving" }, ...REFS],
    promote: `The cheapest painter after riso: one hatch, two strokes, one fill. The G and N badges keep their colours (the site's marks). ${KIT}`,
    Component: lookPage(() => import("./globe-ink")),
  },
]
