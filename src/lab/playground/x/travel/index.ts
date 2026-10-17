import { lazy } from "react"
import type { Entry } from "../../types"

/** travel: the accordion today, and two takes on it */
export const entries: Entry[] = [
  {
    id: "travel-current",
    title: "Accordion (the site today)",
    summary: "The real Travel page: four sections down one page, jump links at the top, one accordion row open at a time.",
    refs: [],
    promote: "This is what ships today, kept here to compare against.",
    current: true,
    Component: lazy(() => import("./travel-current")),
  },
  {
    id: "travel-cards",
    title: "Cards that open sheets",
    summary: "The four sections as paper cards with a folded corner, two columns on laptops. A card leans toward the pointer, rises off the letter when tapped, and the site's sheet comes up with that section.",
    refs: [
      { label: "Emil Kowalski, Building a drawer component", href: "https://emilkowal.ski/ui/building-a-drawer-component" },
      { label: "Benji Taylor, Family values", href: "https://benji.org/family-values" },
    ],
    promote: "Replaces the accordion with the Sheet already used for the reply and the picks, so no new parts; CSS for the cards, one 200 ms delay. Light on phones. Risks: deep links (/travel#flights) need to open the right sheet, the checklist ticks and jump links have to move inside the sheets, and the page loses its scan-everything-at-once quality, so it suits returning guests more than first visits.",
    Component: lazy(() => import("./travel-cards")),
  },
  {
    id: "travel-steps",
    title: "Step by step: Fly, Train, Stay, Day",
    summary: "A four-step stepper with a marker that springs between steps, and one card per step that you swipe, tap through or move with the arrow keys. Steps you have seen get a tick, and it remembers where you were for the visit.",
    refs: [
      { label: "Benji Taylor, Family values", href: "https://benji.org/family-values" },
      { label: "motion.dev examples", href: "https://motion.dev/examples" },
    ],
    promote: "A guided alternative to the long page, good for first-timers to Japan. One spring, a pointer handler and sessionStorage; fine on phones. Risks: the step labels (Fly, Train, Stay, Day) need adding to en.ts and ja.ts, the checklist and picks need a home (a fifth step or links out), and swipe must not fight the page's vertical scroll (it only takes over once the gesture is clearly sideways). Would replace the accordion, keeping hash links mapped to steps.",
    Component: lazy(() => import("./travel-steps")),
  },
]
