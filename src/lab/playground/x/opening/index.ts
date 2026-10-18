import { lazy } from "react"
import type { Entry } from "../../types"

/** Opening: the first few seconds of a first visit. */
export const entries: Entry[] = [
  {
    id: "opening-letter-out",
    title: "The letter out of the envelope",
    deciding: "Jehan: the hinge (unhurried), pull (you draw it out) or quick (the site's length)? The site keeps its own unless one is clearly better.",
    summary: "Nadia's envelope cut into its real parts: the flap turns on its hinge in perspective and darkens as it faces away, the letter slides out of the pocket with a slight bend, then rests in front with its shadow on the pocket.",
    takes: [{ id: "hinge", label: "Hinge, then slide" }, { id: "pull", label: "Pull it out" }, { id: "quick", label: "Quick" }],
    live: { path: "/", arrival: true },
    refs: [{ label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }, { label: "Codrops, 3D folding", href: "https://tympanus.net/codrops/" }],
    promote: "Replaces the cross-fade in envelope.tsx and polish.css (.envelope-drawn) with five layers: the open back cut at the hinge, the closed flap triangle, the pocket, the letter, a shadow. Web Animations on transform, opacity and filter; no new weight. Risk: the flap is cut from her closed drawing, so its edge is close but not exact; Nadia's separate flap layer (docs/art.md) makes it exact. Test: the arrival e2e (arrival.spec.ts) plus a Safari check of backface-visibility.",
    Component: lazy(() => import("./opening-letter-out")),
  },
  {
    id: "opening-seal-reverse",
    title: "Seal it again, backwards",
    deciding: "Jehan: does Home's \"Seal it again\" play the opening backwards (reverse), with the wax seal pressed at the end (press), or fade (calm)?",
    summary: "The letter lifts off the pocket, goes back in with a slight bend, the flap turns shut on its hinge; in press, Nadia's wax seal is then pressed down, squashing a touch as it meets the paper.",
    takes: [{ id: "press", label: "Reverse and press" }, { id: "reverse", label: "Reverse" }, { id: "fade", label: "Fade" }],
    live: { path: "/" },
    refs: [{ label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }],
    promote: "Adds a closing to the Arrival in envelope.tsx when it's sealed again (layout.tsx's ng-reseal event), before it shows sealed. Same layers as the letter out; the pressed seal is her wax seal export (public/art/seal) over the drawn one. Transforms and opacity, under 2 s. Test: Home → Seal it again → the sealed envelope, then it opens again (a new e2e).",
    Component: lazy(() => import("./opening-seal-reverse")),
  },
  {
    id: "opening-note",
    title: "Open your invite, handwritten",
    deciding: "Jehan, then Nadia: arrow first, words first, or one line? Nadia draws the real arrow.",
    summary: "The note under the sealed envelope writes itself letter by letter, and a hand-drawn arrow draws on toward the envelope.",
    takes: [{ id: "arrow-first", label: "Arrow first" }, { id: "words-first", label: "Words first" }, { id: "one-line", label: "One line" }],
    live: { path: "/", arrival: true },
    refs: [{ label: "Lynn Fisher", href: "https://lynnandtonic.com" }],
    promote: "Replaces .arrival-open's breathing label in envelope.tsx and polish.css with per-letter spans (opacity and translate) and an inline SVG arrow. Under 1 KB. Needs Nadia's arrow as an SVG path (or a transparent PNG revealed by a mask). Risk: per-letter spans need the button's aria-label kept (it is). Test: arrival.spec.ts still finds \"Open your invite\".",
    Component: lazy(() => import("./opening-note")),
  },
]
