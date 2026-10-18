import { lazy } from "react"
import type { Entry } from "../../types"

/** Journey map: the site's hand-drawn map today, and two other ways to draw the lines to Kyoto */
export const entries: Entry[] = [
  {
    id: "journey-globe",
    deciding: "Griffin and Nadia: Nadia paints the land (ART.globeLand), or the globe keeps painting its own (the globe is the winner and on the site).",
    title: "Globe flying to Kyoto",
    summary: "The lab's line-drawn globe with Nadia's line lifting off from Brisbane and Griffin's from Canada, drawing in as arcs above the paper; then the camera flies to Kyoto and the seal lands. Drag to spin it.",
    refs: [{ label: "Susie & Jay's globe", href: "https://wedding.jongjeonglee.com" }, { label: "Three.js examples", href: "https://threejs.org/examples" }],
    promote: "Heavy for a guest site: Three.js and the borders are about 200 KB gzipped, loaded only when it's on screen, plus a WebGL context on phones. Worth it only as the one big moment (Our story's last stop, or after the reply), with the hand-drawn map kept as the still and no-WebGL version. Risks: battery on older phones, and the arcs are real geography while the rest of the site's map is drawn, so the two need to agree. Canada is drawn from Edmonton, as on the lab globe.",
    Component: lazy(() => import("./journey-globe")),
  },
]
