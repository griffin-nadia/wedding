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
