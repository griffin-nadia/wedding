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

/** The lab's "Paper" style (lab/frame.tsx) as the start, folds down to 0.1 and no crumples (the diagonal creases),
 *  so nothing strong crosses behind the names (18f) */
export const CHOSEN: PaperParams = {
  roughness: 0.35, roughnessSize: 0.5, fiber: 0.35, fiberSize: 0.5, folds: 0.1, foldSizeX: 1, foldSizeY: 1,
  wrinkles: 0.35, wrinkleSize: 0.65, crumples: 0, drops: 0.1, distortion: 0.3, blending: 1, angle: 300, seed: 4, scale: 0.9,
}

/** The paper colours: cream, a cream a step darker and a warm beige by day; walnut, a step darker and a deep brown
 *  in Lantern; the fortune slip's bright paper in both. */
export const COLOURS: Record<PaperTone, PaperColours> = {
  light: { colorPaper: "#f3e7d3", colorBack: "#eadcc3", colorShadow: "#c4ab85" },
  lantern: { colorPaper: "#2e1b12", colorBack: "#24150d", colorShadow: "#120905" },
  bright: { colorPaper: "#fffdf8", colorBack: "#f6efe2", colorShadow: "#cdbb9b" },
}

/** Lantern keeps drops and wrinkles lower, so dark paper never reads as scratched */
export const forTone = (p: PaperParams, tone: PaperTone): PaperParams =>
  tone === "lantern" ? { ...p, drops: p.drops * 0.4, wrinkles: p.wrinkles * 0.5 } : p

/** The four for the lab, side by side */
export const PRESETS: { id: string; label: string; params: PaperParams }[] = [
  { id: "subtle", label: "Very subtle", params: { ...CHOSEN, roughness: 0.22, fiber: 0.25, folds: 0.03, wrinkles: 0.18, drops: 0.05 } },
  { id: "chosen", label: "Chosen", params: CHOSEN },
  { id: "fibre", label: "More fibre", params: { ...CHOSEN, fiber: 0.7, fiberSize: 0.6 } },
  { id: "nofolds", label: "No folds at all", params: { ...CHOSEN, folds: 0 } },
]

/** The one the site uses */
export const PAPER = CHOSEN

/** The tile's size on screen in CSS px (baked at 2x) */
export const TILE = 480
