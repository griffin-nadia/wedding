/**
 * A print's frame, decided by the photo's name so it's the same on every visit and device: portrait or landscape,
 * and a tilt between -2° and 2° (never flat). Our story uses it so the prints feel laid down by hand.
 * Kept free of imports so tests run it under plain Node.
 */
export function printFrame(name: string) {
  // FNV-1a, then a final mix so names that differ by one character (story-1, story-2) still land far apart
  let h = 2166136261
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h >>>= 0
  const tilt = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2][(h >>> 8) % 8]
  // A second hash for the rest, so the tape and edge don't follow the tilt
  let g = Math.imul(h ^ 0x9e3779b9, 0x85ebca6b); g ^= g >>> 15; g = Math.imul(g, 0xc2b2ae35); g ^= g >>> 13; g >>>= 0
  const lean = (h >>> 20) & 1 ? 1 : -1
  // Final run: one of three washi tapes (sage, honey, rust), or none on about one print in four. Each strip is its own
  // length, place and angle, and each print's white edge is its own width, so no two look stamped out
  const tape = g % 4 === 3 ? null : (h >>> 3) % 3
  return {
    ratio: (h >>> 13) & 1 ? "4 / 3" : "3 / 4", tilt: `${tilt}deg`, tape, lean,
    tapeWidth: `${[28, 32, 36, 40, 46][(g >>> 4) % 5]}%`,
    tapeAt: `${[34, 42, 50, 58, 66][(g >>> 8) % 5]}%`,
    tapeTurn: `${lean * [1.5, 2.5, 3.5, 5][(g >>> 12) % 4]}deg`,
    edge: `${[4, 5, 6, 7, 8][(g >>> 16) % 5]}px`,
  }
}
