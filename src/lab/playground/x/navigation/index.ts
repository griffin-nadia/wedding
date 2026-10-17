import { lazy } from "react"
import type { Entry } from "../../types"

/** Navigation: how guests move between the five letters. */
export const entries: Entry[] = [
  {
    id: "nav-current", title: "Tabs (the site today)", current: true,
    summary: "Five items: a dock on phones, a thin top bar from 768, with a sage marker that slides to the page you're on.",
    refs: [{ label: "Rauno Freiberg, Invisible details of interaction design", href: "https://rauno.me/craft/interaction-design" }],
    promote: "This is what's live, for comparing the others against at the same size and speed.",
    Component: lazy(() => import("./nav-current")),
  },
  {
    id: "nav-ink", title: "Sliding ink indicator",
    summary: "The current page is an ink stroke under its label; tap another and the stroke's front edge runs ahead while its back edge catches up, like a brush dragged across.",
    refs: [{ label: "motion.dev, layout animations", href: "https://motion.dev/docs/react-layout-animations" }, { label: "Rauno Freiberg, Invisible details of interaction design", href: "https://rauno.me/craft/interaction-design" }],
    promote: "A swap for the nav-mark in layout.tsx: the same measuring, two springs instead of one CSS transition, and a brush mask. Light (one element). The stroke has to keep 3:1 against the bar in both modes; it does in the action colour.",
    Component: lazy(() => import("./nav-ink")),
  },
  {
    id: "nav-sheet", title: "Bottom sheet nav",
    summary: "A small paper handle with the page you're on; drag it up or tap it and a sheet rises with every page as a big row, snapping to half or full by how far and how fast you let go.",
    refs: [{ label: "Emil Kowalski, Building a drawer component", href: "https://emilkowal.ski/ui/building-a-drawer-component" }, { label: "Vaul", href: "https://vaul.emilkowal.ski" }, { label: "Benji Taylor, Family values", href: "https://benji.org/family-values" }],
    promote: "Frees the bottom of the screen for the letter, but hides the pages behind a gesture: fine for return visits, worse for a first look. If shipped, keep a tap to open, and keep the page-turn swipe between letters. The sheet would reuse the RSVP sheet's focus handling.",
    Component: lazy(() => import("./nav-sheet")),
  },
  {
    id: "nav-chapters", title: "One letter, in chapters",
    summary: "The whole site as one letter you scroll, in five chapters, with a bar along the top whose segments fill as you read and that takes you to a chapter on a tap.",
    refs: [{ label: "Susie & Jay's wedding site (the chapter bar)", href: "https://wedding.jongjeonglee.com" }, { label: "Scroll-driven animations", href: "https://scroll-driven-animations.style" }],
    promote: "The biggest change: no routes, one long page (layout B in the lab's Layouts tab is the same idea). Simple to build, but the letter gets long on a phone and the RSVP and Travel links would become anchors. The bar is cheap: it reads the scroll at most once a frame.",
    Component: lazy(() => import("./nav-chapters")),
  },
]
