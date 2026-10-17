// The paper (18f): Paper's PaperTexture shader, no image, baked once per theme to a seamless WebP tile by
// scripts/paper-bake.mjs (nothing runs WebGL for guests). The lab's "Paper" experiment shows the presets live; the
// one picked is PAPER below, and re-running the bake makes it the site's paper.

export type PaperParams = {
  roughness: number; roughnessSize: number; fiber: number; fiberSize: number
  folds: number; foldSizeX: number; foldSizeY: number; wrinkles: number; wrinkleSize: number
  crumples: number; drops: number; distortion: number; blending: number; angle: number; seed: number; scale: number
}
export type PaperColours = { colorPaper: string; colorBack: string; colorShadow: string }
export type PaperTone = "light" | "lantern" | "bright"

/** The paper (18f, second pass): fine grain and fibre only. The wrinkles and folds of the first pass read as stains
 *  and streaks once tiled across a card, so they're gone; nothing big repeats, so the tile never shows. */
export const CHOSEN: PaperParams = {
  roughness: 0.4, roughnessSize: 0.5, fiber: 0.45, fiberSize: 0.5, folds: 0, foldSizeX: 1, foldSizeY: 1,
  wrinkles: 0, wrinkleSize: 0.65, crumples: 0, drops: 0.05, distortion: 0.3, blending: 1, angle: 300, seed: 4, scale: 0.9,
}

/** The paper colours: by day a cream a touch lighter than the letter's (the grain darkens it back to the cream),
 *  a step darker and a soft beige; in Lantern a warm walnut, a step darker, and a lighter brown for the grain, so it
 *  shows as texture on dark paper instead of disappearing or reading as scratches; the slip's bright paper in both. */
export const COLOURS: Record<PaperTone, PaperColours> = {
  light: { colorPaper: "#f7eddc", colorBack: "#f1e5cf", colorShadow: "#d2bd9b" },
  lantern: { colorPaper: "#32201a", colorBack: "#2a1a12", colorShadow: "#5a4232" },
  bright: { colorPaper: "#fffdf8", colorBack: "#f6efe2", colorShadow: "#cdbb9b" },
}

/** Lantern keeps drops and wrinkles lower, so dark paper never reads as scratched */
export const forTone = (p: PaperParams, tone: PaperTone): PaperParams =>
  tone === "lantern" ? { ...p, drops: p.drops * 0.4, wrinkles: p.wrinkles * 0.5 } : p

/** The four for the lab, side by side */
export const PRESETS: { id: string; label: string; params: PaperParams }[] = [
  { id: "subtle", label: "Very subtle", params: { ...CHOSEN, roughness: 0.25, fiber: 0.28, drops: 0 } },
  { id: "chosen", label: "Chosen", params: CHOSEN },
  { id: "fibre", label: "More fibre", params: { ...CHOSEN, roughness: 0.3, roughnessSize: 0.35, fiber: 0.6, fiberSize: 0.4, drops: 0 } },
  { id: "folds", label: "A few soft folds", params: { ...CHOSEN, folds: 0.08, wrinkles: 0.12, wrinkleSize: 0.3 } },
]

/** The one the site uses */
export const PAPER = CHOSEN

/** The tile's size on screen in CSS px (baked at 2x) */
export const TILE = 480
