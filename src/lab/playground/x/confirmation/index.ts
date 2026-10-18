import { lazy } from "react"
import type { Entry } from "../../types"

/** Confirmation: the moment after "Send our reply". */
export const entries: Entry[] = [
  {
    id: "confirm-stamp", title: "The seal: 寿, 京 or G·N",
    deciding: "Griffin and Nadia: 寿 (celebration, on the site), 京 (Kyoto) or their initials G·N?",
    summary: "The confirmation's hand-cut seal (uneven rim, patchy ink, a maple and a gum leaf in the rim) with each of three marks, and what each says.",
    refs: [{ label: "Kotobuki (寿)", href: "https://en.wikipedia.org/wiki/Kotobuki" }],
    promote: "寿 is on the site (components/hanko.tsx), in the confirmation head and on the fortune slip. Another mark is one prop.",
    Component: lazy(() => import("./confirm-stamp")),
  },
  {
    id: "confirm-fortune-unfold", title: "Fortune that unfolds",
    deciding: "Griffin and Nadia: the 12 fortunes' words (the fortune unfolding is the winner and on the site).",
    summary: "The omikuji slip arrives folded in three; a tap opens the top third toward you, then the bottom, each turning on its crease with the light moving across it.",
    refs: [{ label: "Lynn Fisher", href: "https://lynnandtonic.com" }, { label: "Codrops", href: "https://tympanus.net/codrops/" }],
    promote: "Replaces the slip's scaleY unfold in fortune-card.tsx with three 3D panels: CSS transforms and one spring, cheap on phones. Needs care that each third clips the same slip exactly (it renders the slip three times), and a check in Safari, which is fussier with preserve-3d.",
    Component: lazy(() => import("./confirm-fortune-unfold")),
  },
]
