import { GLOBE_LOOK, paintGlobe } from "@/lib/paint-globe"
import type { Look } from "./kit-view"

/**
 * Look 1, the baseline: the site's own painted watercolour (src/lib/paint-globe.ts, unchanged), see-through as on the
 * site since run 19, so every other look is judged against what ships today.
 */
export const look: Look = {
  line: "ink",
  paint: ({ night, width, countries }) => paintGlobe(night ? GLOBE_LOOK.night : GLOBE_LOOK.day, width, countries),
  seeThrough: 0.5,
  farLines: 0.3,
}
