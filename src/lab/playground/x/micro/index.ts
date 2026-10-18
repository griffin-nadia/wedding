import { lazy } from "react"
import type { Entry } from "../../types"

/** Micro-interactions: the small things a hand notices, current against proposed. */
export const entries: Entry[] = [
  {
    id: "micro-motion",
    title: "Seven small motions, one family",
    deciding: "Jehan: one curve (the site's --ease-paper at 120 / 240 / 480 ms) or one spring (200 / 360 / 640 ms) for every small motion?",
    summary: "The button's press, the tab pill, an accordion, a tag ticked off, the fortune unfolding in three, the countdown's digits and the music toggle, today's timing beside one easing family at three durations.",
    takes: [{ id: "paper", label: "One curve" }, { id: "spring", label: "One spring" }],
    live: { path: "/" },
    refs: [{ label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }, { label: "Rauno Freiberg, craft", href: "https://rauno.me/craft" }],
    promote: "In tokens.css: --duration-fast/base/slow become the three durations and --ease-out and --ease-spring point at the one family (one change, every component follows). The accordion's height keyframes (index.css .accordion-content) become a FLIP on the row below; the fortune's scaleY unfold (fortune-card.tsx, .omikuji-slip) becomes the three panels; the countdown's out-going digit gets its own exit. Risk: linear() needs Safari 17.2 (fallback: --ease-paper). Test: the screenshot suite with reduced motion is unchanged; check the RSVP and FAQ flows by hand.",
    Component: lazy(() => import("./micro-motion")),
  },
]
