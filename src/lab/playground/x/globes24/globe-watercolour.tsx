import { paintGlobe } from "@/lib/paint-globe"
import type { Look } from "./kit-view"

/**
 * Look 1, the baseline: the site's own painting (src/lib/paint-globe.ts; since run 27 the antique globe, so this look
 * now shows what ships rather than the old watercolour).
 */
export const look: Look = {
  line: "ink",
  paint: ({ night, width }) => paintGlobe(night, width),
  seeThrough: 0.5,
  farLines: 0.3,
}
