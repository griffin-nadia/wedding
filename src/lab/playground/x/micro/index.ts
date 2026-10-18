import { lazy } from "react"
import type { Entry } from "../../types"

/** Micro: the small things a hand notices. */
export const entries: Entry[] = [
  {
    id: "micro-spring-press", title: "Spring press buttons",
    deciding: "Jehan: should buttons press with a soft spring instead of today's plain scale?",
    summary: "The same button pressed three ways: a plain ease, a CSS spring, and a script spring that turns round wherever you let go.",
    refs: [{ label: "Emil Kowalski, What makes a great animation", href: "https://emilkowal.ski/ui/great-animations" }, { label: "Rauno Freiberg, Invisible details of interaction design", href: "https://rauno.me/craft/interaction-design" }],
    promote: "The CSS spring is two rules in the btn-primary and state utilities (index.css), no script and nothing for phones to carry. The script spring is only worth it where a press can be held and released halfway (the envelope, the stamp). Replaces today's 0.97 scale with an ease.",
    Component: lazy(() => import("./micro-spring-press")),
  },
  {
    id: "micro-magnetic-toggle", title: "Magnetic toggle",
    deciding: "Jehan: should the bar's switches lean toward the pointer on laptops?",
    summary: "On a laptop the top bar's switches lean toward the pointer within 80px and let go with a spring. On touch they stay put.",
    refs: [{ label: "Codrops", href: "https://tympanus.net/codrops/" }, { label: "Rauno Freiberg, craft", href: "https://rauno.me/craft" }],
    promote: "A small wrapper round the switches in layout.tsx, fine pointers only, off under reduced motion: no weight on phones. The risk is fuss: keep the pull to a few pixels and only on the switches, never the nav.",
    Component: lazy(() => import("./micro-magnetic-toggle")),
  },
  {
    id: "micro-paper", title: "Paper",
    deciding: "Jehan: which paper goes on the site (a preset, your own settings, or none)?",
    summary: "The paper four ways (very subtle, chosen, more fibre, no folds at all), each in Light and Lantern at the size the site draws it, with sliders for folds, wrinkles, drops and fibre, and Copy settings.",
    refs: [{ label: "Paper Shaders, Paper texture", href: "https://shaders.paper.design/paper-texture" }],
    promote: "Send the copied settings: they go into src/lib/paper.ts as PAPER, then node scripts/paper-bake.mjs bakes them to the three tiles the site uses. Guests never run the shader.",
    Component: lazy(() => import("./micro-paper")),
  },
]
