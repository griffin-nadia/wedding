import { lazy } from "react"
import type { Entry } from "../../types"

/**
 * Run 24, section 5: Our story five more ways (A to E). Each take is the whole story (the kid opener, a chapter at a
 * time with the arrows, dots, swipe, the arrow keys and See as a list, then the journey stop) in its own world; only how
 * it looks and moves changes. Their shared pieces (chapters, polaroid, controls, list, journey stop) are in kit.tsx.
 * Nadia's maple leaf isn't in any of them yet: its file isn't available.
 */
export const entries: Entry[] = [
  {
    id: "story-kamishibai", bare: true,
    title: "A. Kamishibai: the paper theatre",
    deciding: "Griffin and Nadia: does a storyteller's little wooden theatre feel like them? And one smooth draw, or the half pull with its held beat?",
    summary: "Our story told from a little wooden paper theatre with Nadia's wax seal on its roof. The doors swing open, then each chapter is a card in the frame, drawn out sideways through the slot to show the next one already waiting beneath.",
    takes: [{ id: "pull", label: "One smooth draw" }, { id: "half", label: "Half pull, a held beat" }],
    live: { path: "/our-story" },
    refs: [{ label: "Kamishibai (紙芝居)", href: "https://en.wikipedia.org/wiki/Kamishibai" }],
    promote: "Ready to ship: a new body for StoryJourney's slides (story-journey.tsx) that keeps its controls, dots, list, Keep reading and journey stop as they are. The wood, doors and cards are CSS only (gradients and two 3D-turned doors; the only images are the prints and the wax seal), about 4 KB on phones. The half pull uses CSS linear() easing (Safari 17.2 and up; older browsers get a plain ease). Risks: the window is landscape, so prints are smaller than today's on a phone (about 150px wide at 390), and the words sit under the theatre, not beside the print. The doors close on the last card and the theatre gives way to the globe. Reduced motion shows the doors already open and cross-fades the cards.",
    Component: lazy(() => import("./story-kamishibai")),
  },
  {
    id: "story-scrapbook", bare: true,
    title: "B. Scrapbook album",
    deciding: "Griffin and Nadia: kraft pages or the old black album pages? Are her gum leaves and wax seal right as stickers, and her names on the title page?",
    summary: "Our story pasted into an album: polaroids taped in, Nadia's gum leaves and wax seal stuck on some pages, captions in a written hand. Each page is a real leaf on a hinge that follows your finger all the way over. One page on a phone, a spread from 1024.",
    takes: [{ id: "kraft", label: "Kraft pages" }, { id: "black", label: "Black album pages" }],
    live: { path: "/our-story" },
    refs: [{ label: "Scrapbooking", href: "https://en.wikipedia.org/wiki/Scrapbooking" }, { label: "Our story today", href: "../our-story" }],
    promote: "Ready to ship: a new StoryJourney body. The turn reuses lib/page-turn.ts's rules (start past 24px, carry on past a quarter or a flick, a soft give at the ends, reduced motion cuts) on a 3D hinge instead of a track, written with the site's spring. The kraft is one still SVG noise tile plus gradients (no image); the leaves and seal are her art from public/art (about 30 KB more on phones); her names come from NamesArt. Risks: two faces per leaf means about twice the DOM of today's spread (still light, nine stops); a phone shows one page, so the print and the words share it (the print is about 230px wide at 390). Her maple leaf joins the stickers once its file is available. The captions want her handwriting (or a hand font) to be truly written; for now it's the display face in italic.",
    Component: lazy(() => import("./story-scrapbook")),
  },
  {
    id: "story-red-thread", bare: true,
    title: "C. The red thread (赤い糸)",
    deciding: "Griffin and Nadia: should the globe be the whole story, a thread from each of you running through every chapter and knotted at Kyoto? Jehan: the thread in story rust (the map lines' colour) or 朱 vermilion (kept for the hanko today)? See the Thread colour option.",
    summary: "The story is the globe. It opens over the Pacific with Griffin's childhood prints pinned in Canada and Nadia's in Australia, a red thread tied to each. Every chapter flies the camera to its place and pins its polaroid there; the two threads wind round each other through every chapter and tie in a knot at Kyoto.",
    knobs: [{ id: "thread", label: "Thread colour", kind: "select", options: [["story", "Story rust (the map lines)"], ["shu", "Vermilion 朱 (the hanko's)"]], def: "story" }],
    live: { path: "/our-story" },
    refs: [{ label: "The red thread of fate", href: "https://en.wikipedia.org/wiki/Red_thread_of_fate" }, { label: "three.js fat lines (Line2)", href: "https://threejs.org/examples/#webgl_lines_fat" }],
    promote: "Ready to ship: a different Our story page rather than a new slide body; it reuses lib/paint-globe.ts and the globe's set-up from journey-globe.tsx (read only here; a shared createGlobe() would stop the two drifting). Three.js loads only when the page opens, the same chunk the journey stop already loads, and it draws only while the camera flies, so it's idle between chapters. Risks: the painting is a long task on low-end phones on first open (the same as today's globe); chapter places are country-level points (Canada at Edmonton, as the site's globe draws Griffin's line) until they give cities; the guests' lines from today's journey stop aren't on it yet (they'd join at the end as faint dotted lines). No WebGL: the print and words show on the paper without the globe.",
    Component: lazy(() => import("./story-red-thread")),
  },
  {
    id: "story-lantern-table", bare: true,
    title: "D. The lantern table",
    deciding: "Griffin and Nadia: prints on a walnut table under lantern light, picked up one at a time and turned over to read your words on the back. Does it feel like an evening looking through photos together?",
    summary: "Every print of the story scattered on a walnut table under a warm pool of lantern light. The chapter you're on is picked up into the light; turn it over to read their words on the back. Push the others around the table, or tap one to pick it up.",
    live: { path: "/our-story" },
    refs: [{ label: "Paper lanterns (chōchin)", href: "https://en.wikipedia.org/wiki/Paper_lantern" }, { label: "Prints on a table (parked, run 19)", href: "lab-play.html?x=story-canvas" }],
    promote: "Ready to ship: a new StoryJourney body; the light is gradients from the honey and nectar tokens (no new hues, nothing flickers), the walnut is gradients too, so about 5 KB of CSS and script. The back of each print shows their first paragraph in the display face's italic (Keep reading still opens the whole chapter); it wants her handwriting or a hand font to read as truly written. Risks: all nine prints load at once (a table can't lazy-load what's on it), about 250 KB on a phone; pushing prints around is a toy, not navigation, so it's mouse and touch only (keyboard users have the arrows and Turn it over). Escape turns the print back.",
    Component: lazy(() => import("./story-lantern-table")),
  },
  {
    id: "story-instant-camera", bare: true,
    title: "E. The instant camera",
    deciding: "Griffin and Nadia: each chapter taken like an instant photo, the print coming out of the camera and developing as you watch. Charming, or too slow to read through?",
    summary: "A little instant camera in the site's colours takes each chapter: the flash blinks, the print comes out of the slot under the lens milky grey, then the picture comes up through it, grey shapes first and then its colour. Prints already taken drop onto a pile beside the camera.",
    live: { path: "/our-story" },
    refs: [{ label: "Instant film", href: "https://en.wikipedia.org/wiki/Instant_film" }],
    promote: "Ready to ship: a new StoryJourney body. The camera is CSS in the tokens (cream and moss by day, walnut in Lantern), no image. Developing is opacity only: a milky layer and a grey copy of the photo (a still filter, never animated) fade off the colour one, about 4 s the first time, and a developed print stays developed when you come back. About 4 KB; each print decodes twice (colour and grey) on its first visit. Risks: the wait before the colour arrives is the point, but it slows people reading straight through (the words show at once beside it); the camera takes room above the print, so on a phone the print is about 196px wide. Reduced motion: each print fades in already developed.",
    Component: lazy(() => import("./story-instant-camera")),
  },
]
