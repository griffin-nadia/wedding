import { lazy } from "react"
import type { Entry } from "../../types"

/** Micro: the small things a hand notices. */
export const entries: Entry[] = [
  {
    id: "micro-spring-press", title: "Spring press buttons",
    summary: "The same button pressed three ways: a plain ease, a CSS spring, and a script spring that turns round wherever you let go.",
    refs: [{ label: "Emil Kowalski, What makes a great animation", href: "https://emilkowal.ski/ui/great-animations" }, { label: "Rauno Freiberg, Invisible details of interaction design", href: "https://rauno.me/craft/interaction-design" }],
    promote: "The CSS spring is two rules in the btn-primary and state utilities (index.css), no script and nothing for phones to carry. The script spring is only worth it where a press can be held and released halfway (the envelope, the stamp). Replaces today's 0.97 scale with an ease.",
    Component: lazy(() => import("./micro-spring-press")),
  },
  {
    id: "micro-magnetic-toggle", title: "Magnetic toggle",
    summary: "On a laptop the top bar's switches lean toward the pointer within 80px and let go with a spring. On touch they stay put.",
    refs: [{ label: "Codrops", href: "https://tympanus.net/codrops/" }, { label: "Rauno Freiberg, craft", href: "https://rauno.me/craft" }],
    promote: "A small wrapper round the switches in layout.tsx, fine pointers only, off under reduced motion: no weight on phones. The risk is fuss: keep the pull to a few pixels and only on the switches, never the nav.",
    Component: lazy(() => import("./micro-magnetic-toggle")),
  },
  {
    id: "micro-paper-shader", title: "Paper shader, live vs image",
    summary: "One letter split down the middle: Paper's live shader on the left, the baked images the site uses on the right, with this page's frame rate.",
    refs: [{ label: "Paper Shaders", href: "https://shaders.paper.design" }, { label: "Lynn Fisher", href: "https://lynnandtonic.com" }],
    promote: "Don't ship the live shader to guests: a full-screen WebGL canvas behind every page costs battery and frames on phones, and the baked WebPs already read as paper. If a moving paper is wanted, render one frame per theme offline and bake it like the grain.",
    Component: lazy(() => import("./micro-paper-shader")),
  },
  {
    id: "micro-grain", title: "Grain and fibre",
    summary: "Home's letter with its grain, washi fibres and edge shadow on sliders, live, with the site's values marked.",
    refs: [{ label: "Lynn Fisher", href: "https://lynnandtonic.com" }, { label: "Paper Shaders", href: "https://shaders.paper.design" }],
    promote: "Picking new values is a token change (--theme-texture, and adding the fibre layer to .letter) plus a look at page-turn cost on a phone: the fibre tile is one more layer to draw while a letter moves. The edge shadow is already .paper-feel.",
    Component: lazy(() => import("./micro-grain")),
  },
]
