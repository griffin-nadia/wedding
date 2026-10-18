import { lazy } from "react"
import type { Entry } from "../../types"

/** day: the timeline today, and two takes on it */
export const entries: Entry[] = [
  {
    id: "day-vertical",
    title: "Vertical timeline (the site today)",
    summary: "The real page: the venue details, then the times down a thin moss line that draws in as you scroll.",
    refs: [],
    promote: "This is what ships today, kept here to compare against.",
    current: true,
    Component: lazy(() => import("./day-vertical")),
  },
  {
    id: "day-scrub",
    deciding: "Jehan: keep The day's timeline as it is, or let guests scrub through the day?",
    title: "Scrub through the day",
    summary: "A ruler of the hours under a fixed playhead: drag it and the time ticks past, each part of the day lifting into view as you reach it while the sky warms from late morning to afternoon.",
    refs: [
      { label: "motion.dev, scroll", href: "https://motion.dev/docs/scroll" },
      { label: "Rauno Freiberg, interaction design", href: "https://rauno.me/craft/interaction-design" },
    ],
    promote: "Would replace the vertical timeline on The day (or sit above it as the delight moment), with the list kept for print and screen readers. Light: one spring and a few transforms, no images. Risks: a sideways drag fights the page scroll on phones (touch-action: none on the strip only, and the cards jump too), and it hides the plain order behind an interaction, so the times must stay readable at a glance. On the day itself the head could start at the real Kyoto time.",
    Component: lazy(() => import("./day-scrub")),
  },
  {
    id: "day-map",
    deciding: "Jehan: does The day also want a map of where each part happens?",
    title: "The day as a map",
    summary: "An illustrated plate of the grounds with the three parts of the day: a dotted line walks from the ceremony in The Garden to the reception on The Terrace, landing each pin with its time. Tap a stop for its card.",
    refs: [
      { label: "Codrops", href: "https://tympanus.net/codrops/" },
      { label: "Susie & Jay", href: "https://wedding.jongjeonglee.com" },
    ],
    promote: "Needs Nadia (or the venue's own plan) to place The Garden and The Terrace honestly before it ships; today it is a guess, labelled illustrative. About 4 kB of SVG and one tween, fine on phones. Would sit under the timeline on The day, like Around the venue on Travel, rather than replace it.",
    Component: lazy(() => import("./day-map")),
  },
]
