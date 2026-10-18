import { lazy } from "react"
import type { Entry } from "../../types"

/** Our story: the spread carousel today, and three other ways to hold the prints */
export const entries: Entry[] = [
  {
    id: "story-styling", title: "The prints: tape, corners or plain",
    deciding: "Jehan: washi tape (what ships), photo corners, or plain?",
    summary: "Our story's soft prints (a thin white border, a layered shadow, a seeded tilt, a faint grain) three ways: washi tape, photo corners, or nothing on them.",
    refs: [{ label: "Our story", href: "../our-story" }],
    promote: "Tape is on the site (index.css, .story-print). Corners would be four small CSS triangles per print; plain is the tape rule off.",
    Component: lazy(() => import("./story-styling")),
  },
  {
    id: "story-current",
    deciding: "Griffin and Nadia: the words and photos for each chapter (the spread is the winner; this is it with placeholders).",
    title: "Spread (the site today)",
    summary: "The story as it ships: one spread per chapter, the next print sliding in turned and settling straight on a spring.",
    refs: [{ label: "WAI-ARIA APG carousel", href: "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/" }],
    promote: "This is what ships today, kept here to compare against.",
    Component: lazy(() => import("./story-current")),
  },
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
  {
    id: "story-prints",
    deciding: "Jehan, then Griffin and Nadia: how the prints sit (tape, corners or plain).", title: "Print shadows and backdrops",
    summary: "One print at a time with four shadows (the site's, soft, lifted, taped to the table) and a backdrop that changes with the chapter: none, the chapter's photo blurred into a wash, or that wash slowly drifting.",
    refs: [{ label: "Josh W. Comeau, designing shadows", href: "https://www.joshwcomeau.com/css/designing-shadows/" }],
    promote: "A shadow is one box-shadow token on .photo-print, free on phones. The wash is one more image per chapter (a small blurred one, 40vw) under the spread, cross-fading as the chapter changes: about 30 to 60 kB each and a blur filter, so bake the blur into tiny images rather than blurring live. The drift is a CSS animation, off under reduced motion; skip it on phones if the page turn stutters.",
    Component: lazy(() => import("./story-prints")),
  },
]
