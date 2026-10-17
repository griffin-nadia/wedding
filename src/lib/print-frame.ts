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
  return { ratio: (h >>> 13) & 1 ? "4 / 3" : "3 / 4", tilt: `${tilt}deg` }
}
