import { lazy } from "react"
import type { Entry } from "../../types"

/** Arrival framing: their photo behind the sealed envelope on phones */
export const entries: Entry[] = [
  {
    id: "arrival-framing", bare: true,
    title: "Faces clear of the envelope",
    deciding: "Jehan: confirm the site's framing (since #178 it keeps both faces clear at every size, measured here); the full-screen zoom puts the note over Nadia's face.",
    summary: "The live site's sealed envelope at four phone sizes, measured in place: where their faces are, where the envelope is, and how far apart, for the site's framing and for a full-screen zoom.",
    takes: [{ id: "site", label: "The site (#178)" }, { id: "zoom", label: "Full screen, zoomed" }],
    knobs: [{ id: "faces", label: "Face box", kind: "select", options: [["on", "Shown"], ["off", "Hidden"]], def: "on" }],
    live: { path: "/", arrival: true },
    refs: [{ label: "src/content/scenes.json (face boxes)", href: "https://github.com/griffin-nadia/wedding/blob/main/src/content/scenes.json" }],
    promote: "The site already keeps the faces clear (#178, polish.css: the sealed photo box): 170 to 261 px at all four sizes, day and night, measured here. The zoom keeps the photo full screen but puts the handwritten note over Nadia's face, so it loses. Ready to ship: this measurement as a check in arrival.spec.ts.",
    Component: lazy(() => import("./arrival-framing")),
  },
]
