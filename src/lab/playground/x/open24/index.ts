import { lazy } from "react"
import type { Entry } from "../../types"

/** Opening a photo (run 24): eleven ways to open a print, usable with any story take, in two groups to compare */
export const entries: Entry[] = [
  {
    id: "open24-come",
    title: "Opening a print: how it comes to you",
    deciding: "Jehan: which way should an opened print come to you? Pick one or two to carry into the story take that wins.",
    summary: "The seven story prints, opened seven ways: picked up and flipped to their words on the back, tilted to the light, under a loupe, developing from milky grey, on a table with the others moved aside, held and dragged on a phone, or with a soft paper rustle when the music is on.",
    takes: [
      { id: "flip", label: "Pick up and flip" },
      { id: "tilt", label: "Tilt to the light" },
      { id: "loupe", label: "Loupe" },
      { id: "develop", label: "Develop on open" },
      { id: "table", label: "The table" },
      { id: "hold", label: "Hold it (phones)" },
      { id: "sound", label: "Paper sounds" },
    ],
    live: { path: "/our-story" },
    refs: [
      { label: "Run 24 brief, section 6", href: "../our-story" },
      { label: "Rauno Freiberg, craft", href: "https://rauno.me/craft" },
      { label: "Emil Kowalski, great animations", href: "https://emilkowal.ski/ui/great-animations" },
      { label: "WAI-ARIA APG, modal dialog", href: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
    ],
    promote: "Ready to ship: a new opened-print dialog in components/story-journey.tsx (today a print doesn't open). Each take is the same dialog (FLIP out of the print, Done, Escape, focus back) plus one small idea: flip adds a back face with the chapter's words (CSS 3D, needs their written bodies to be worth it); tilt is a pointer handler on desktop only; loupe adds a magnifier and wheel zoom (the opened photo should load the 1600 size, about 150 KB more per open); develop is two opacity layers; the table needs the spread's other prints to move, and its soft focus is a backdrop blur that costs on older phones (fade it, never animate the blur); hold fights page scroll on phones, so it suits the table view more than the carousel; sound is a 0.4 s Web Audio rustle, no file, only while the music plays. All transform and opacity, a few KB of code, loaded with the story. Risks: flip hides the words behind a button, so screen readers get them through the Turn over button and the dialog label; check with VoiceOver before shipping.",
    Component: lazy(() => import("./open24-come")),
  },
  {
    id: "open24-held",
    title: "Opening a print: how it's held",
    deciding: "Jehan: how should a print be held before it opens: washi tape, Nadia's envelope, a fanned pile (the kid opener) or pegged on a string?",
    summary: "Four ways a print waits to be opened: taped down (the tape peels), tucked in Nadia's open envelope (it slides out), the kid photos in a pile that fans apart, or pegged on a string that swings as you pass.",
    takes: [
      { id: "tape", label: "Peel the tape" },
      { id: "sleeve", label: "Slide out of a sleeve" },
      { id: "fan", label: "Fan the stack" },
      { id: "string", label: "Pegged on a string" },
    ],
    live: { path: "/our-story" },
    refs: [
      { label: "Run 24 brief, section 6", href: "../our-story" },
      { label: "Nadia's envelope (the invite)", href: "../" },
      { label: "WAI-ARIA APG, modal dialog", href: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
    ],
    promote: "Ready to ship: tape builds on the tape the polaroid frame already has (index.css .story-print, add the hover lift and the peel before the dialog). Sleeve reuses Nadia's open envelope layers (ART.drawnEnvelope, 10 KB each at 410, cached once) around each print, which makes the spread busier, so it suits one print per stop. Fan is for the kid opener (story-journey.tsx Opener): three prints in a pile, the 1998 portrait needs exporting into public/photos first (PHOTO-PLAN rules, EXIF stripped), it shows a paper print here when the lab build can't reach it. String needs a row of prints, so it fits the list view or a keepsake page more than the one-stop spread. All transform and opacity. Nadia's maple leaf isn't in yet, so no leaf on the pegs or tape; add it when the file arrives.",
    Component: lazy(() => import("./open24-held")),
  },
]
