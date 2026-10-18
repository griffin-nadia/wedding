import { lazy } from "react"
import type { Entry } from "../../types"

/** Our story: two parked ways to hold the prints (the spread is on the site: Compare with live) */
export const entries: Entry[] = [
  {
    id: "story-stack",
    parked: "A stack you flick: kept for later. The spread won (one stop at a time).",
    title: "A stack you flick",
    summary: "The story's prints in a hand-laid pile. Drag the top one and it follows your finger, turning as it goes; flick it away and the next settles up, with Undo to bring it back.",
    refs: [{ label: "motion.dev drag examples", href: "https://motion.dev/examples" }, { label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }],
    promote: "Could replace the spread carousel's track on phones: same chapters, same words, a different gesture. Light (springs writing transforms, only the top four prints drawn). Risks: a pile hides what's coming, so it needs the chapter count and the list view kept; flicking is less obvious with a mouse, so the buttons stay.",
    Component: lazy(() => import("./story-stack")),
  },
  {
    id: "story-canvas",
    parked: "Prints on a table: kept for later. The spread won (one stop at a time).",
    title: "Prints on a table",
    summary: "The prints scattered on an endless paper table you pan by dragging, gliding on when you let go. Tap a print and it lifts to the middle with its chapter words.",
    refs: [{ label: "Codrops", href: "https://tympanus.net/codrops/" }, { label: "Rauno Freiberg, craft", href: "https://rauno.me/craft" }],
    promote: "A different Our story page rather than a new carousel: the chapter order gets looser, so it suits a keepsake view after the day more than the story before it. Light on phones (transforms only, prints off screen hidden, about 80 small images that load lazily). Risks: no clear order or end, and a pannable surface fights page scroll, so it needs a list view beside it. Zoom was left out.",
    Component: lazy(() => import("./story-canvas")),
  },
]
