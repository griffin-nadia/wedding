/**
 * A print's frame, decided by the photo's name so it's the same on every visit and device. Run 24: every print is a
 * 4:5 instant print, tilted by a fixed, uneven, hand-placed pattern between -6° and 6° (story-1 is -5°, story-2 4°, and
 * so on; any other name picks from the same pattern by its hash), so each print keeps its tilt wherever it appears.
 * Kept free of imports so tests run it under plain Node.
 */
const TILTS = [-5, 4, -3, 6, -4, 3, -6, 5]
export function printFrame(name: string) {
  // FNV-1a, then a final mix so names that differ by one character (story-1, story-2) still land far apart
  let h = 2166136261
  for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h >>>= 0
  const n = Number(/-(\d+)$/.exec(name)?.[1] ?? NaN)
  const tilt = TILTS[Number.isFinite(n) ? (n - 1) % TILTS.length : (h >>> 8) % TILTS.length]
  // A second hash for the rest, so the tape and edge don't follow the tilt
  let g = Math.imul(h ^ 0x9e3779b9, 0x85ebca6b); g ^= g >>> 15; g = Math.imul(g, 0xc2b2ae35); g ^= g >>> 13; g >>>= 0
  const lean = tilt > 0 ? 1 : -1
  // Final run: one of three washi tapes (sage, honey, rust), or none on about one print in four. Each strip is its own
  // length, place and angle, and each print's white edge is its own width, so no two look stamped out
  const tape = g % 4 === 3 ? null : (h >>> 3) % 3
  return {
    ratio: "4 / 5", tilt: `${tilt}deg`, tape, lean,
    tapeWidth: `${[28, 32, 36, 40, 46][(g >>> 4) % 5]}%`,
    tapeAt: `${[34, 42, 50, 58, 66][(g >>> 8) % 5]}%`,
    tapeTurn: `${lean * [1.5, 2.5, 3.5, 5][(g >>> 12) % 4]}deg`,
    edge: `${[4, 5, 6, 7, 8][(g >>> 16) % 5]}px`,
  }
}
