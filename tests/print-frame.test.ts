// Our story's prints: the same frame for the same photo every time, a mix of portrait and landscape, tilts within ±2°.
import { test } from "node:test"
import assert from "node:assert/strict"
import { printFrame } from "../src/lib/print-frame.ts"

test("deterministic, mixed, within two degrees", () => {
  const names = ["story-1", "story-2", "story-3", "story-4", "story-5", "story-6", "story-7", "story-8"]
  for (const n of names) assert.deepEqual(printFrame(n), printFrame(n))
  const ratios = new Set(names.map((n) => printFrame(n).ratio))
  assert.equal(ratios.size, 2)
  assert.ok(new Set(names.map((n) => printFrame(n).tilt)).size >= 4, "tilts vary")
  for (const n of names) { const t = parseFloat(printFrame(n).tilt); assert.ok(Math.abs(t) <= 2 && t !== 0, `${n} ${t}`) }
})

test("the tape and edge vary: some prints have none, the rest their own length, place and angle", () => {
  const names = Array.from({ length: 24 }, (_, i) => `story-${i + 1}`)
  const f = names.map(printFrame)
  const none = f.filter((x) => x.tape === null).length
  assert.ok(none >= 2 && none <= 12, `${none} of 24 without tape`)
  for (const k of ["tapeWidth", "tapeAt", "tapeTurn", "edge"] as const) assert.ok(new Set(f.map((x) => x[k])).size >= 3, `${k} varies`)
  for (const x of f) { assert.ok(Math.abs(parseFloat(x.tapeTurn)) <= 5); assert.equal(Math.sign(parseFloat(x.tapeTurn)), x.lean) }
})
