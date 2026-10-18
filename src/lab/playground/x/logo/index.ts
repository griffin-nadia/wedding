import { lazy } from "react"
import type { Entry } from "../../types"

/** Logo: the mark in the top bar */
export const entries: Entry[] = [
  {
    id: "logo-mark",
    title: "G&N from Nadia's lettering",
    deciding: "Griffin and Nadia: today's type mark, or a G and N cut from Nadia's lettering (her \"&\" in sage, or all in ink)?",
    summary: "A G and an N cut from Nadia's own lettering of the names, her \"&\" between, against today's mark, in the top bar at its real size in Light and Lantern.",
    takes: [{ id: "lettering", label: "Her lettering" }, { id: "one-ink", label: "Her lettering, one ink" }, { id: "type", label: "Today's mark" }],
    knobs: [{ id: "size", label: "Height in the bar", kind: "range", min: 22, max: 40, step: 1, def: 30, unit: " px" }],
    live: { path: "/" },
    refs: [{ label: "docs/art.md, the names lettering", href: "https://github.com/griffin-nadia/wedding/blob/main/docs/art.md" }],
    promote: "In layout.tsx the .site-mark link's text becomes three mask spans (this file's Lettered) with the link's name kept as \"G&N\". Uses the names masks already loaded on Home (no new files; about 10 KB on other pages if Home wasn't first). Risk: at 20 to 24 px the G's thin hairlines can break up on low-density screens; the size knob shows where. Test: top-bar.spec.ts and the 390 and 1440 screenshots.",
    Component: lazy(() => import("./logo-mark")),
  },
]
