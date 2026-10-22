import { lazy } from "react"
import type { Entry } from "../../types"

/** The venue map: Nadia's painting, switched off on the site until the invites have gone out (run 22) */
export const entries: Entry[] = [
  {
    id: "venue-map", title: "Around the venue, on Nadia's map",
    deciding: "Griffin and Nadia: ready to switch on after the invites? (config.venueMap = true in src/lib/config.ts)",
    summary: "Her painted map of Higashiyama with a button on each of her dots, the taxi or the train route from Kyoto Station traced faintly over her roads, the place's card underneath, and pinch to zoom on phones.",
    live: { path: "/travel?preview#around" },
    refs: [{ label: "WAI-ARIA APG, button (toggle)", href: "https://www.w3.org/WAI/ARIA/apg/patterns/button/" }],
    promote: "Built and on the site behind config.venueMap (off). Switching it on shows it in Travel → On the day → Around the venue and under How to get there on The day.",
    Component: lazy(() => import("./venue-map-lab")),
  },
]
