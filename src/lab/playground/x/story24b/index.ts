import { lazy } from "react"
import type { Entry } from "../../types"

/** Run 24 lab, section 5, takes F to I: Our story four more ways. Each is the whole flow (kid opener, a chapter at a
 *  time, the journey stop) with only the look and the motion changed. */
export const entries: Entry[] = [
  {
    id: "story-passport",
    title: "F. Passport pages",
    deciding: "Griffin and Nadia: does the story read as a passport (a page turned per chapter, a stamp of the place and year, 寿 at Kyoto)? Stamps alone, or with Nadia's map pieces stuck on the Japan pages?",
    summary: "Each chapter is a passport page: their print pasted in, a stamp of the place and year inked over its corner, and Kyoto sealed with 寿. Moving on turns the page round the spine, and the stamp's ink shows through the back.",
    takes: [{ id: "stamped", label: "Stamps" }, { id: "stickers", label: "Stamps and Nadia's map pieces" }],
    live: { path: "/our-story" },
    refs: [{ label: "Our story", href: "../our-story" }, { label: "Codrops, 3D page flip", href: "https://tympanus.net/codrops/" }],
    promote: "Ready to ship: a new look for StoryJourney's stops (story-journey.tsx and index.css), not a new flow. The page turn is one rotateY per page, the stamps are small inline SVGs drawn from each chapter's place and year (no images), and the guilloche is one tiny SVG mask, so it adds about 6 KB and nothing heavy on phones. The stickers take uses pieces cut from Nadia's venue map in the browser (LAB ONLY until Nadia says yes); shipping them means exporting the four pieces with scripts/art-export.mjs. Risks: preserve-3d on older Android WebViews (falls back to a fade), and the stamps are English place names over a Japanese site.",
    Component: lazy(() => import("./story-passport")),
  },
  {
    id: "story-emaki",
    title: "G. Emaki hand scroll",
    deciding: "Griffin and Nadia: the story as a painted hand scroll that unrolls and winds on a scene at a time? The ink wash alone, or with Nadia's Kyoto pieces standing in the mist at the end?",
    summary: "Our story painted along one long sheet between two wooden rollers: it unrolls from the left as the page opens, then winds on a scene at a time, each photo let into the paper with soft ink edges and an ink-wash landscape drifting between scenes.",
    takes: [{ id: "sumi", label: "Ink wash" }, { id: "landmarks", label: "With Nadia's map pieces at Kyoto" }],
    live: { path: "/our-story" },
    refs: [{ label: "Emakimono", href: "https://en.wikipedia.org/wiki/Emakimono" }, { label: "Chōjū-giga (the scroll as a story)", href: "https://en.wikipedia.org/wiki/Ch%C5%8Dj%C5%AB-jinbutsu-giga" }],
    promote: "Ready to ship: StoryJourney's stops laid side by side on one sheet (story-journey.tsx paint() and index.css), plus the rollers and the wash as CSS and one small inline SVG of hills (about 5 KB). Light on phones: every frame is one transform per scene and two for the wash layers. The landmarks take cuts Nadia's map pieces in the browser (LAB ONLY until Nadia says yes); shipping them means exporting them with scripts/art-export.mjs. Risks: the soft photo edges crop the corners of their photos (faces must sit in the middle), and the wash is an ink texture over paper, so it needs a check in Lantern on a dim phone.",
    Component: lazy(() => import("./story-emaki")),
  },
  {
    id: "story-lantern-lane", bare: true,
    title: "H. Lantern lane",
    deciding: "Griffin and Nadia: their prints pegged along a string down the night lane, lit one at a time? It takes over the whole page (the lane from the Lantern arrival photo behind, in both modes).",
    summary: "Their prints pegged along a string across the night lane from the Lantern arrival photo, each with a small paper lantern. The one you're on hangs lowest in the middle, its lantern lit and a warm pool behind it, while the rest wait in the dark along the string.",
    live: { path: "/our-story" },
    refs: [{ label: "The arrival photo (night lane)", href: "../?arrival=1" }, { label: "Chōchin lanterns", href: "https://en.wikipedia.org/wiki/Ch%C5%8Dchin" }],
    promote: "Ready to ship: a whole-page Our story (our-story.tsx would render it instead of the card, like the arrival does), using the night-lane scene the site already loads in Lantern, so no new photo weight. Each frame is one transform per print on the string and opacity for the lanterns, so it's light on phones; the lanterns and pegs are CSS. Risks: in Light it's still night in the lane (a different mood from the rest of the day pages), the words move to a card at the foot, and the bottom nav would need to sit over the photo. Uses the honey and pumpkin tokens for the lit lantern, no new colours.",
    Component: lazy(() => import("./story-lantern-lane")),
  },
  {
    id: "story-strip",
    title: "I. Polaroid strip",
    deciding: "Griffin and Nadia: all the prints in one slow drifting strip. Where does it earn its place: under Our story's spread, along Home's foot, or on the keepsake Home after the day (or none)?",
    summary: "Every chapter's print in one slow strip that drifts along by itself, follows a drag and carries on with the flick, and lifts a print on hover. Under Our story it marks the chapter you're on; on Home and the keepsake each print opens Our story at its chapter.",
    takes: [{ id: "story", label: "Under Our story" }, { id: "home", label: "Along Home's foot" }, { id: "keepsake", label: "On the keepsake" }],
    live: { path: "/our-story" },
    refs: [{ label: "Framer, Polaroid Footer (look and behaviour only)", href: "https://www.framer.com/marketplace/components/polaroid-footer/" }, { label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" }],
    promote: "Ready to ship: one Strip component (about 120 lines, transforms only: one translate per frame for the whole row, the hover lift in CSS), reusing the polaroid frame from section 1. Home and the keepsake would need our-story.tsx to accept a chapter to open at (?at=, a small change in StoryJourney). On phones it loads every chapter's small print (about 8 × 25 KB) wherever it sits, so on Home it should load after the page settles. Risks: moving content needs the pause button (WCAG 2.2.2, built in), and a strip on Home competes with the RSVP as the one delight on that screen. The keepsake take sticks Nadia's map pieces along it, cut from her venue map in the browser (LAB ONLY until Nadia says yes).",
    Component: lazy(() => import("./story-strip")),
  },
]
