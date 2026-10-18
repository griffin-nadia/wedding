import { lazy } from "react"
import type { Entry } from "../../types"

/** Arrival framing: their photo behind the sealed envelope on phones */
export const entries: Entry[] = [
  {
    id: "arrival-framing", bare: true,
    title: "Faces clear of the envelope",
    deciding: "Jehan: keep today's centred crop, zoom from the bottom just enough, or lift the photo and fade its bottom into paper?",
    summary: "Their photo behind the sealed envelope at four phone sizes, with the faces boxed, and how far the envelope is from them (or over them) for each way of framing it.",
    takes: [{ id: "today", label: "Today (centred)" }, { id: "zoom", label: "Zoom from the bottom" }, { id: "lift", label: "Lift and fade" }],
    knobs: [{ id: "faces", label: "Face box", kind: "select", options: [["on", "Shown"], ["off", "Hidden"]], def: "on" }],
    live: { path: "/", arrival: true },
    refs: [{ label: "src/content/scenes.json (face boxes)", href: "https://github.com/griffin-nadia/wedding/blob/main/src/content/scenes.json" }],
    promote: "In index.css, phones only (max-width 767px) and only while sealed: the scene photo gets object-position x and a transform (scale from the bottom, or translateY plus a mask fade) per size band, the values under each phone. Pure CSS, no weight. Risk: zoom softens the photo a little (it's already 1200 or 1600 wide for these sizes, so under 1.1 it holds). Test: arrival.spec.ts gets a check that the envelope's box and the face box don't meet at 360, 390, 412 and 430 wide.",
    Component: lazy(() => import("./arrival-framing")),
  },
]
