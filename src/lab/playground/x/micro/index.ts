import { lazy } from "react"
import type { Entry } from "../../types"

/** Micro-interactions: the small things a hand notices, current against proposed. */
export const entries: Entry[] = [
  {
    id: "micro-motion",
    title: "Seven small motions, one family",
    deciding: "Jehan: the site has one curve family since #182 (150 / 250 / 450 ms). Keep it, a touch quicker (120 / 240 / 480, with the accordion's row gliding), or one spring?",
    summary: "The button's press, the tab pill, an accordion, a tag ticked off, the fortune unfolding in three, the countdown's digits and the music toggle, today's timing beside one easing family at three durations.",
    takes: [{ id: "paper", label: "A touch quicker" }, { id: "spring", label: "One spring" }],
    live: { path: "/" },
    refs: [{ label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }, { label: "Rauno Freiberg, craft", href: "https://rauno.me/craft" }],
    promote: "In tokens.css: the three --duration-* values (or one spring as --ease-* linear()). The accordion's row gliding is a FLIP in components/ui/accordion.tsx; the countdown's outgoing digit gets its own exit in home-countdown.tsx. Risk: linear() needs Safari 17.2 (fallback: --ease-paper). Test: the reduced-motion screenshots don't change; the RSVP and FAQ flows by hand.",
    Component: lazy(() => import("./micro-motion")),
  },
]
