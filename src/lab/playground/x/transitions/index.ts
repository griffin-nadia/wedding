import { lazy } from "react"
import type { Entry } from "../../types"

/** Page transitions: what happens between one letter and the next. */
export const entries: Entry[] = [
  {
    id: "transition-paper-slide", title: "Paper slide",
    decided: "The site turns pages on phones and cross-fades on laptops.",
    summary: "Three letters on one strip with paper between them: drag and it follows your finger flat, let go and it springs on or back, the arriving letter leading by a hair.",
    refs: [{ label: "Emil Kowalski, What makes a great animation", href: "https://emilkowal.ski/ui/great-animations" }, { label: "motion.dev examples", href: "https://motion.dev/examples" }],
    promote: "The closest to today's phone page turn (page-turn.ts): it adds the spring on release and the slight lead. Worth folding in: page-turn already clones the leaving letter, so the spring replaces its CSS transition. Same weight as now.",
    Component: lazy(() => import("./transition-paper-slide")),
  },
  {
    id: "transition-photo-zoom", title: "Photo zoom between pages",
    decided: "Kept the page turn and cross-fade.",
    summary: "Tap a print in the story grid and that very print grows into its chapter's page with View Transitions; Back shrinks it home.",
    refs: [{ label: "Chrome view transitions demos", href: "https://view-transitions.chrome.dev" }, { label: "Chrome docs, View Transitions", href: "https://developer.chrome.com/docs/web-platform/view-transitions" }],
    promote: "Fits Our story's list view, or a gallery page. View Transitions are in Chrome and Safari 18; Firefox gets the cross-fade. Cheap: the browser animates one snapshot. The care is in naming exactly one element at a time and moving focus to the page and back.",
    Component: lazy(() => import("./transition-photo-zoom")),
  },
  {
    id: "transition-curl", title: "Page-turn curl",
    decided: "Kept the page turn and cross-fade.",
    summary: "Pull the letter's right edge and it turns on its left edge toward you like a page, its paper catching the light and its shadow sliding over the page beneath.",
    refs: [{ label: "Codrops", href: "https://tympanus.net/codrops/" }, { label: "Lynn Fisher", href: "https://lynnandtonic.com" }],
    promote: "Charming, but it renders two full letters in 3D while turning, which is the heaviest thing here on a phone, and a sideways hinge fights the page's own scroll. Better as a one-off (turning from the envelope to the letter) than for every page change.",
    Component: lazy(() => import("./transition-curl")),
  },
  {
    id: "transition-depth", title: "Cross-fade with depth",
    decided: "Shipped as the laptop cross-fade.",
    summary: "The letter you were reading sinks back as the new one settles onto it from just above and fades in: paper laid on paper.",
    refs: [{ label: "Emil Kowalski, What makes a great animation", href: "https://emilkowal.ski/ui/great-animations" }, { label: "Chrome view transitions demos", href: "https://view-transitions.chrome.dev" }],
    promote: "A drop-in for the laptop page change (polish.css already names the letter body for a view transition): swap its keyframes for these two. No script, no extra weight. On phones it would replace the page turn, losing the swipe, so laptops only.",
    Component: lazy(() => import("./transition-depth")),
  },
]
