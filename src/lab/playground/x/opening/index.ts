import { lazy } from "react"
import type { Entry } from "../../types"

/** Opening: the first few seconds of a first visit. */
export const entries: Entry[] = [
  {
    id: "opening-letter-out", title: "The letter out of the open envelope (A, B, C)",
    deciding: "Jehan: A (the site's, with better timing), B (the flap turns in 3D) or C (the letter bends as it lifts)? The site ships A unless B is clearly better.",
    summary: "Nadia's open envelope (18 Oct) in two layers with the letter between them, so it comes out of the pocket. Three timings and movements to pick from.",
    refs: [{ label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }],
    promote: "A is what ships (envelope.tsx and polish.css). B needs the flap as its own layer to look right on the site (Nadia's separate layers, docs/art.md). C is a keyframe on the letter. All transforms, no new weight; reduced motion shows the last frame.",
    Component: lazy(() => import("./opening-letter-out")),
  },
  {
    id: "opening-envelope-drag", title: "Envelope you pull open",
    decided: "The site's arrival is Nadia's floating envelope with an Open your invite button (18e); a pull still opens it.",
    summary: "Nadia's drawn envelope on their photo: pull the letter up and out with your finger, past half way it springs free, short of that it slides back in.",
    refs: [{ label: "Emil Kowalski, Building a drawer component", href: "https://emilkowal.ski/ui/building-a-drawer-component" }, { label: "motion.dev examples", href: "https://motion.dev/examples" }],
    promote: "The site's arrival already pulls the flap (envelope.tsx, --pull); this makes the letter itself the handle and adds the spring. Two images and transforms, no new weight. Keep tap to open and Skip, as now, since a drag isn't obvious to everyone.",
    Component: lazy(() => import("./opening-envelope-drag")),
  },
  {
    id: "opening-wax-seal", title: "Wax seal you break",
    decided: "Superseded by the floating envelope and its button (18e).",
    summary: "Press and hold the G&N wax seal: a ring fills, cracks run across the wax, and it breaks into seven tumbling pieces as the flap opens.",
    refs: [{ label: "Codrops", href: "https://tympanus.net/codrops/" }, { label: "Susie & Jay's wedding site", href: "https://wedding.jongjeonglee.com" }],
    promote: "Works on the paper envelope or over Nadia's drawn seal (the pieces would be cut from her scan). Seven clipped copies of one small image on transforms: cheap. A hold is slower than a tap, so the seal should also break on a plain tap after a beat, and Skip stays.",
    Component: lazy(() => import("./opening-wax-seal")),
  },
  {
    id: "opening-cinematic", title: "Cinematic opening",
    decided: "Superseded by the floating envelope and its button (18e).",
    summary: "A short film: their photo pushes in between black bars, the names write on, the date fades up, then the bars go and the letter rises. Under four seconds, Skip always there.",
    refs: [{ label: "Susie & Jay's wedding site", href: "https://wedding.jongjeonglee.com" }, { label: "Codrops", href: "https://tympanus.net/codrops/" }],
    promote: "A replacement for the envelope, not an addition: one intro is enough. CSS transitions only, and the photo is the one already preloaded, so it costs nothing extra on phones. The risk is guests waiting: it has to be skippable at any moment and shown once per device, like the envelope.",
    Component: lazy(() => import("./opening-cinematic")),
  },
]
