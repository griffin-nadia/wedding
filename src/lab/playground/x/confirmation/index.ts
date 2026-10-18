import { lazy } from "react"
import type { Entry } from "../../types"

/** Confirmation: the moment after "Send our reply". */
export const entries: Entry[] = [
  {
    id: "confirm-hanko-press", title: "Hanko you press",
    decided: "Shipped: the hanko stamps when a reply lands.",
    summary: "Press and hold the paper: the stamp lowers out of the air, ink gathers while you hold, and letting go lands it with a squash and, on Android, a tiny tick.",
    refs: [{ label: "Rauno Freiberg, Invisible details of interaction design", href: "https://rauno.me/craft/interaction-design" }, { label: "Benji Taylor, Family values", href: "https://benji.org/family-values" }],
    promote: "Swap the sent letter's automatic stamp for this hold, in rsvp-sheet.tsx's Done. Light: one element on transforms and a drop shadow. The risk is a step people miss: keep the reply already sent (it is), so the stamp is a delight, never a gate, and stamp on its own after a few seconds untouched.",
    Component: lazy(() => import("./confirm-hanko-press")),
  },
  {
    id: "confirm-fortune-unfold", title: "Fortune that unfolds",
    decided: "Shipped as the fortune slip.",
    summary: "The omikuji slip arrives folded in three; a tap opens the top third toward you, then the bottom, each turning on its crease with the light moving across it.",
    refs: [{ label: "Lynn Fisher", href: "https://lynnandtonic.com" }, { label: "Codrops", href: "https://tympanus.net/codrops/" }],
    promote: "Replaces the slip's scaleY unfold in fortune-card.tsx with three 3D panels: CSS transforms and one spring, cheap on phones. Needs care that each third clips the same slip exactly (it renders the slip three times), and a check in Safari, which is fussier with preserve-3d.",
    Component: lazy(() => import("./confirm-fortune-unfold")),
  },
  {
    id: "confirm-petals", title: "Paper petals",
    decided: "Left out: one delight per screen, the hanko is it.",
    summary: "A light fall of washi petals and maple leaves in the site's colours, each turning over as it falls; tap for another handful from your finger.",
    refs: [{ label: "motion.dev examples", href: "https://motion.dev/examples" }, { label: "Codrops", href: "https://tympanus.net/codrops/" }],
    promote: "Would run once over the sent letter, 40 pieces on transforms in the shared frame loop, stopping when the last lands: fine on a mid-range phone. Too much on top of the stamp and the fortune though: one delight per screen is the rule, so it would replace one of those, not join them.",
    Component: lazy(() => import("./confirm-petals")),
  },
]
