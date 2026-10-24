import { privateArt } from "../../private"
import type { Look } from "./kit-view"
import { paintHers, paintStandIn, paintTemplate, seaOf } from "./globe-nadia-paint"

/**
 * Look 11, Nadia's own: the globe wears one 2:1 painting of hers (the ART.globeLand slot). Until it exists, a stand-in
 * painted in her venue map's colours shows how it would sit on the ball, and the Painting knob shows the blank
 * template she paints on (graticule, coasts, the flat map's band and the three places the lines meet).
 *
 * The slot's shape, as src/lib/art.ts would have it when it ships (art.ts is a site file, so it's defined here):
 * src is the exported painting, sea says whether she painted the sea too (false: her land on a clear background, and
 * the site paints the sea in each theme's colour, so one painting serves light and Lantern).
 * In the lab, "Hers" reads private/nadia-art-globe/globe-land.png from the dev server once she drops it there.
 */
export type GlobeLandSlot = { src: string; sea: boolean }
const SLOT: GlobeLandSlot = { src: privateArt("nadia-art-globe/globe-land.png"), sea: false }

const base: Omit<Look, "paint"> = {
  line: "ink",
  shade: 0.3,
  rim: 1,
  back: (night) => seaOf(night),
  inks: (night) => (night ? {} : { guest: "#5e4636", ink: "#3b3328" }),
}
const standIn: Look = { ...base, paint: ({ night, width }) => paintStandIn({ night, W: width }) }
const template: Look = { ...base, shade: 0, paint: ({ night, width }) => paintTemplate({ night, W: width }) }
const hers: Look = {
  ...base,
  // Not there yet (or a build, where private files never are): the stand-in instead
  paint: ({ night, width }) => (SLOT.src ? paintHers(SLOT.src, { night, W: width, sea: SLOT.sea }) : Promise.reject(new Error("none"))).catch(() => paintStandIn({ night, W: width })),
}
export const LOOKS: Record<string, Look> = { standin: standIn, template, hers }
/** Run 27, the picker's Nadia's paint: hers once it's in, the stand-in until then (and always in a build) */
export const look = hers
