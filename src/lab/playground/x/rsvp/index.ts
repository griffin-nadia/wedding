import { lazy } from "react"
import type { Entry } from "../../types"

/** RSVP: the reply sheet today, and two other ways to ask the same questions (nothing is ever sent from the lab) */
export const entries: Entry[] = [
  {
    id: "rsvp-current",
    decided: "The reply as it is.",
    title: "Reply sheet (the site today)",
    summary: "The reply as it ships: a sheet over the letter with three short steps, then the hanko and the fortune.",
    refs: [{ label: "WAI-ARIA APG radio group", href: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/" }],
    promote: "This is what ships today, kept here to compare against. In the lab it runs on the sample household, so a reply only lands on this device.",
    current: true,
    Component: lazy(() => import("./rsvp-current")),
  },
  {
    id: "rsvp-one-question",
    decided: "Shipped as one question per step (18f).",
    title: "One question per screen",
    summary: "The same reply, one big question at a time, each screen sliding in on a spring while a line along the top springs ahead. Back is always there and Enter moves on.",
    refs: [{ label: "motion.dev examples", href: "https://motion.dev/examples" }, { label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }],
    promote: "A rewrite of the sheet's three steps as up to nine screens, reusing its fields, checks and the song search (left out here). Light on phones: one spring writing transforms, no new code to load. Risks: more taps for big households, and it loses the sheet sitting over the letter; it would replace the sheet's steps but keep its save, retries and draft.",
    Component: lazy(() => import("./rsvp-one-question")),
  },
  {
    id: "rsvp-chat",
    decided: "Kept the steps: a chat made answers hard to check and change.",
    title: "A conversation",
    summary: "The reply as a calm chat with Griffin and Nadia: their questions arrive after a moment's typing, and each answer is a chip that flies up into a sent bubble. Tap any answer to change it.",
    refs: [{ label: "Benji Taylor, Family values", href: "https://benji.org/family-values" }, { label: "Rauno Freiberg, interaction design", href: "https://rauno.me/craft/interaction-design" }],
    promote: "A new front for the same reply: the questions, checks and save would stay the sheet's, only the layout changes. Light on phones (no new code, Web Animations for the flight). Risks: the typing pause feels slow on a second visit (skip it once they've replied), it reads less like a letter, and screen reader users hear a log, which needs testing. It would replace the sheet's three steps.",
    Component: lazy(() => import("./rsvp-chat")),
  },
]
