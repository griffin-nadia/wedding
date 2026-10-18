import { lazy } from "react"
import type { Entry } from "../../types"

/** Confirmation: the moment after "Send our reply". */
export const entries: Entry[] = [
  {
    id: "confirm-fortune-unfold",
    deciding: "Griffin and Nadia: the 12 fortunes' words (the fortune unfolding is the winner and on the site).", title: "Fortune that unfolds",
    summary: "The omikuji slip arrives folded in three; a tap opens the top third toward you, then the bottom, each turning on its crease with the light moving across it.",
    refs: [{ label: "Lynn Fisher", href: "https://lynnandtonic.com" }, { label: "Codrops", href: "https://tympanus.net/codrops/" }],
    promote: "Replaces the slip's scaleY unfold in fortune-card.tsx with three 3D panels: CSS transforms and one spring, cheap on phones. Needs care that each third clips the same slip exactly (it renders the slip three times), and a check in Safari, which is fussier with preserve-3d.",
    Component: lazy(() => import("./confirm-fortune-unfold")),
  },
]
