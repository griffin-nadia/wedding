// The paper (18f): Paper's PaperTexture shader (https://shaders.paper.design/paper-texture), no image, made in the
// browser once per theme at the screen's size and pixel density (src/lib/paper-live.ts), then laid over every paper
// surface, words, fields and buttons included, like Paper's own printed example. Light: white paper with warm grain,
// multiplied in. Lantern: inverted, light fibres on black, screened in. The lab's "Paper" experiment shows the
// presets live; the one picked is PAPER below.

export type PaperParams = {
  roughness: number; roughnessSize: number; fiber: number; fiberSize: number
  folds: number; foldSizeX: number; foldSizeY: number; wrinkles: number; wrinkleSize: number
  crumples: number; drops: number; distortion: number; blending: number; angle: number; seed: number; scale: number
}
export type PaperColours = { colorPaper: string; colorBack: string; colorShadow: string }

/** White paper with a warm shadow, so multiplying it in only ever adds a warm grain and soft shading (by day) */
export const WHITE: PaperColours = { colorPaper: "#ffffff", colorBack: "#ffffff", colorShadow: "#4a3826" }
/** The same inverted (Lantern): black paper with light fibres, so screening it in only ever lifts the dark paper */
export const NIGHT: PaperColours = { colorPaper: "#000000", colorBack: "#000000", colorShadow: "#d8c4a4" }
export const inkFor = (night: boolean) => (night ? NIGHT : WHITE)

const NONE = { roughness: 0, roughnessSize: 0.5, fiber: 0, fiberSize: 0.5, folds: 0, foldSizeX: 1, foldSizeY: 1, wrinkles: 0, wrinkleSize: 0.65, crumples: 0, drops: 0, distortion: 0, blending: 1, angle: 300, seed: 4, scale: 0.9 }

/** Paper's own example, calmer: its grain and fibre as they are, its folds and wrinkles turned well down */
export const CHOSEN: PaperParams = { ...NONE, roughness: 0.4, fiber: 0.4, drops: 0.12, folds: 0.12, wrinkles: 0.2, distortion: 0.75 }

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
