// The paper (18f, on the site from 18g): Paper's PaperTexture shader (https://shaders.paper.design/paper-texture), no
// image, made in the browser once per theme at the screen's size and pixel density (src/lib/paper-live.ts), then laid
// over every paper surface, words, fields and buttons included, like Paper's own printed example. Light: white paper
// with neutral grey grain, multiplied in. Lantern: inverted, grey fibres on black, screened in. The lab's "Paper"
// experiment shows the presets live; the one picked is PAPER below.

export type PaperParams = {
  roughness: number; roughnessSize: number; fiber: number; fiberSize: number
  folds: number; foldSizeX: number; foldSizeY: number; wrinkles: number; wrinkleSize: number
  crumples: number; drops: number; distortion: number; blending: number; angle: number; seed: number; scale: number
}
export type PaperColours = { colorPaper: string; colorBack: string; colorShadow: string }

/** White paper with a neutral grey shadow: no colour of its own, so multiplying it in keeps the page's own colours (by day) */
export const WHITE: PaperColours = { colorPaper: "#ffffff", colorBack: "#ffffff", colorShadow: "#6e6e6e" }
/** The same inverted (Lantern): black paper with grey fibres, so screening it in only ever lifts the dark paper */
export const NIGHT: PaperColours = { colorPaper: "#000000", colorBack: "#000000", colorShadow: "#9a9a9a" }
export const inkFor = (night: boolean) => (night ? NIGHT : WHITE)

const NONE = { roughness: 0, roughnessSize: 0.5, fiber: 0, fiberSize: 0.5, folds: 0, foldSizeX: 1, foldSizeY: 1, wrinkles: 0, wrinkleSize: 0.65, crumples: 0, drops: 0, distortion: 0, blending: 1, angle: 300, seed: 4, scale: 0.9 }

/** Jehan's pick (18g), from Paper's playground: no folds or crumples, full wrinkles, Paper's grain, fibre and drops */
export const CHOSEN: PaperParams = {
  ...NONE, blending: 0.4, distortion: -0.15, angle: 300, seed: 4, roughness: 0.4, roughnessSize: 0.5, fiber: 0.4, fiberSize: 0.5,
  folds: 0, crumples: 0, wrinkles: 1, wrinkleSize: 0.65, drops: 0.4, scale: 0.9,
}
/** Lantern keeps fewer drops and softer wrinkles (18g: drops 0.2, wrinkles 0.6 at most), so the dark paper never looks
 *  speckled */
export const nightOf = (p: PaperParams): PaperParams => ({ ...p, drops: Math.min(p.drops, 0.2), wrinkles: Math.min(p.wrinkles, 0.6) })
/** The 18f pick, for comparison: organic and quiet */
const ORGANIC: PaperParams = { ...NONE, roughness: 0.3, roughnessSize: 0.4, fiber: 0.5, fiberSize: 0.6, drops: 0.06, folds: 0.06, wrinkles: 0.1, distortion: 0.75 }

/** The four for the lab, side by side */
export const PRESETS: { id: string; label: string; params: PaperParams }[] = [
  { id: "chosen", label: "Chosen (Jehan's)", params: CHOSEN },
  { id: "organic", label: "Organic (18f)", params: ORGANIC },
  { id: "subtle", label: "Very subtle", params: { ...ORGANIC, roughness: 0.28, fiber: 0.28, drops: 0.05, folds: 0.06, wrinkles: 0.1 } },
  { id: "nofolds", label: "No folds or wrinkles", params: { ...CHOSEN, folds: 0, wrinkles: 0 } },
]

/** The one the site uses */
export const PAPER = CHOSEN
/** The live sheet's size in CSS px for the lab's swatches */
export const TILE = 360
