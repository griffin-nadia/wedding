import { lazy } from "react"
import type { Entry } from "../../types"

/** Journey map: the site's hand-drawn map today, and two other ways to draw the lines to Kyoto */
export const entries: Entry[] = [
  {
    id: "journey-current",
    title: "Hand-drawn map (the site today)",
    summary: "The site's guest map on a letter: the drawn land, Nadia's and Griffin's dotted lines, and this household's gold line from Brisbane drawing in.",
    refs: [{ label: "Figma D1 / M2 (the hand-drawn map)", href: "https://www.figma.com/" }],
    promote: "This is what ships today, kept here to compare against. It's a single inline SVG, so it costs almost nothing on phones.",
    current: true,
    Component: lazy(() => import("./journey-current")),
  },
  {
    id: "journey-ink-pins",
    deciding: "Jehan: should the guest map's lines draw in as ink pins instead of dotted routes?",
    title: "Ink-reveal pins",
    summary: "The same drawn land, inked in: Brisbane, Canada and Kyoto each arrive as a blot that bleeds open into the paper, then Nadia's and Griffin's lines draw to Kyoto like a pen. Tap a place to blot it again.",
    refs: [{ label: "Codrops", href: "https://tympanus.net/codrops/" }, { label: "Lynn Fisher", href: "https://lynnandtonic.com" }],
    promote: "A drop-in for the map's draw-in on Our story's last stop and the reply's mini map: same SVG and places, new CSS and two small filters. Light on phones, but SVG turbulence filters can be slow on older Android, so the blot filter should be rasterised once (or swapped for a pre-drawn blot from Nadia). It would replace the dotted lines' mask reveal.",
    Component: lazy(() => import("./journey-ink-pins")),
  },
  {
    id: "journey-globe",
    deciding: "Jehan: a globe flying to Kyoto, or keep the flat map (now with the real outlines)?",
    title: "Globe flying to Kyoto",
    summary: "The lab's line-drawn globe with Nadia's line lifting off from Brisbane and Griffin's from Canada, drawing in as arcs above the paper; then the camera flies to Kyoto and the seal lands. Drag to spin it.",
    refs: [{ label: "Susie & Jay's globe", href: "https://wedding.jongjeonglee.com" }, { label: "Three.js examples", href: "https://threejs.org/examples" }],
    promote: "Heavy for a guest site: Three.js and the borders are about 200 KB gzipped, loaded only when it's on screen, plus a WebGL context on phones. Worth it only as the one big moment (Our story's last stop, or after the reply), with the hand-drawn map kept as the still and no-WebGL version. Risks: battery on older phones, and the arcs are real geography while the rest of the site's map is drawn, so the two need to agree. Canada is drawn from Edmonton, as on the lab globe.",
    Component: lazy(() => import("./journey-globe")),
  },
]
