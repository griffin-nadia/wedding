import { lazy } from "react"

/** The lab's experiments. Each lives in one file with its own styles, so a winner is promoted with one PR. */
export const EXPERIMENTS = [
  { id: "spring-press", title: "Spring button press", note: "Press dips to 0.97 and springs back a touch past 1 (CSS linear() spring).", Component: lazy(() => import("./spring-press")) },
  { id: "fold-creases", title: "Fold creases and leaning cards", note: "Lynn Fisher-style CSS-only paper: two creases in the letter, cards that lean back and stand up on hover.", Component: lazy(() => import("./fold-creases")) },
  { id: "ink-blot", title: "Ink-blot reveal on photos", note: "The photo shows through blots with turbulent edges that grow over 900 ms.", Component: lazy(() => import("./ink-blot")) },
  { id: "parallax", title: "Parallax from Nadia's art", note: "Her drawn envelope and the seal on three layers that drift with the pointer or the phone's tilt.", Component: lazy(() => import("./parallax")) },
  { id: "globe", title: "Line-drawn globe", note: "Three.js, Natural Earth 110m borders (vendored), HTML labels by projection, OrbitControls with damping. Lazy; a still image under reduced motion.", Component: lazy(() => import("./globe")) },
  { id: "hanko-sent", title: "Hanko on RSVP sent", note: "The 京 seal stamps onto the Sent card.", Component: lazy(() => import("./hanko-sent")) },
]
