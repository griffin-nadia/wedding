import { lazy } from "react"
import type { Entry } from "../../types"

/** Opening: the first few seconds of a first visit. */
export const entries: Entry[] = [
  {
    id: "opening-envelope-drag", title: "Envelope you pull open",
    summary: "Nadia's drawn envelope on their photo: pull the letter up and out with your finger, past half way it springs free, short of that it slides back in.",
    refs: [{ label: "Emil Kowalski, Building a drawer component", href: "https://emilkowal.ski/ui/building-a-drawer-component" }, { label: "motion.dev examples", href: "https://motion.dev/examples" }],
    promote: "The site's arrival already pulls the flap (envelope.tsx, --pull); this makes the letter itself the handle and adds the spring. Two images and transforms, no new weight. Keep tap to open and Skip, as now, since a drag isn't obvious to everyone.",
    Component: lazy(() => import("./opening-envelope-drag")),
  },
  {
    id: "opening-wax-seal", title: "Wax seal you break",
    summary: "Press and hold the G&N wax seal: a ring fills, cracks run across the wax, and it breaks into seven tumbling pieces as the flap opens.",
    refs: [{ label: "Codrops", href: "https://tympanus.net/codrops/" }, { label: "Susie & Jay's wedding site", href: "https://wedding.jongjeonglee.com" }],
    promote: "Works on the paper envelope or over Nadia's drawn seal (the pieces would be cut from her scan). Seven clipped copies of one small image on transforms: cheap. A hold is slower than a tap, so the seal should also break on a plain tap after a beat, and Skip stays.",
    Component: lazy(() => import("./opening-wax-seal")),
  },
  {
    id: "opening-cinematic", title: "Cinematic opening",
    summary: "A short film: their photo pushes in between black bars, the names write on, the date fades up, then the bars go and the letter rises. Under four seconds, Skip always there.",
    refs: [{ label: "Susie & Jay's wedding site", href: "https://wedding.jongjeonglee.com" }, { label: "Codrops", href: "https://tympanus.net/codrops/" }],
    promote: "A replacement for the envelope, not an addition: one intro is enough. CSS transitions only, and the photo is the one already preloaded, so it costs nothing extra on phones. The risk is guests waiting: it has to be skippable at any moment and shown once per device, like the envelope.",
    Component: lazy(() => import("./opening-cinematic")),
  },
]
