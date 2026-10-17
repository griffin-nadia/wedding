import { lazy } from "react"
import type { Entry } from "../../types"

/** home: Home's letter today, and two takes on it */
export const entries: Entry[] = [
  {
    id: "home-current",
    title: "Home (the site today)",
    summary: "The real Home page: the names, the date, the greeting, the RSVP button and the countdown in paper boxes.",
    refs: [],
    promote: "This is what ships today, kept here to compare against.",
    current: true,
    Component: lazy(() => import("./home-current")),
  },
  {
    id: "home-flipboard",
    title: "Departure-board countdown",
    summary: "The countdown as a split-flap station board: each digit's top half falls on its hinge and the new number lands with a little bounce. It shuffles once on load, then the seconds keep clacking over.",
    refs: [
      { label: "Codrops", href: "https://tympanus.net/codrops/" },
      { label: "motion.dev examples", href: "https://motion.dev/examples" },
    ],
    promote: "Swap HomeCountdown's paper boxes for this Flap (CSS only, about 2 kB, no script motion beyond the one-second tick it already has). Three layers per digit are cheap even on older phones, but nine flaps animating every minute roll is worth a check in a slow-CPU trace. The risk is tone: a station board is a stronger travel cue than the quiet boxes, so it may want the seconds dropped. Reduced motion already swaps digits plainly.",
    Component: lazy(() => import("./home-flipboard")),
  },
  {
    id: "home-parallax",
    title: "Letter over the photo, in depth",
    summary: "Their photo fills the screen and the Home letter floats over it. Scrolling moves the photo slower than the letter, and the pointer (or the phone's tilt) shifts the layers a few pixels apart.",
    refs: [
      { label: "Susie & Jay", href: "https://wedding.jongjeonglee.com" },
      { label: "Codrops", href: "https://tympanus.net/codrops/" },
    ],
    promote: "Fold the scroll and tilt into Scene (it already drifts with the mouse on laptops), driven by the site's one frame loop. Light on phones: two transforms a frame, no new images. Risks: the iPhone tilt prompt is one more ask on first visit (keep it behind a button), and parallax can make some people queasy, so reduced motion must stay fully still. Replaces the fixed photo behind the letter.",
    Component: lazy(() => import("./home-parallax")),
  },
]
