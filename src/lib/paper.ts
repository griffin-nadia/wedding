// The paper (18f, in the lab for now: Jehan, 18 Oct, "keep in lab"): Paper's PaperTexture shader
// (https://shaders.paper.design/paper-texture), no image, made in the browser once per theme at the screen's size and
// pixel density (src/lib/paper-live.ts), then laid over every paper surface, words, fields and buttons included, like
// Paper's own printed example. The guest site doesn't start it (main.tsx), so its paper is plain until one is picked. Light: white paper with warm grain,
// multiplied in. Lantern: inverted, light fibres on black, screened in. The lab's "Paper" experiment shows the
// presets live; the one picked is PAPER below.

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

/** Organic and quiet: Paper's fibre a touch larger and stronger than its grain, a few drops, the faintest folds */
export const CHOSEN: PaperParams = { ...NONE, roughness: 0.3, roughnessSize: 0.4, fiber: 0.5, fiberSize: 0.6, drops: 0.06, folds: 0.06, wrinkles: 0.1, distortion: 0.75 }

/** The four for the lab, side by side */
export const PRESETS: { id: string; label: string; params: PaperParams }[] = [
  { id: "subtle", label: "Very subtle", params: { ...CHOSEN, roughness: 0.28, fiber: 0.28, drops: 0.05, folds: 0.06, wrinkles: 0.1 } },
  { id: "chosen", label: "Chosen", params: CHOSEN },
  { id: "fibre", label: "More fibre", params: { ...CHOSEN, fiber: 0.65, fiberSize: 0.4 } },
  { id: "nofolds", label: "No folds at all", params: { ...CHOSEN, folds: 0, wrinkles: 0 } },
]

/** The one the site uses */
export const PAPER = CHOSEN
/** The live sheet's size in CSS px for the lab's swatches */
export const TILE = 360
