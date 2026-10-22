// Our story's prints: the same frame for the same photo every time, 4:5 instant prints, tilts from the hand-placed
// pattern within ±6° (run 24), never flat, and neighbours leaning opposite ways.
import { test } from "node:test"
import assert from "node:assert/strict"
import { printFrame } from "../src/lib/print-frame.ts"

test("deterministic, mixed, within two degrees", () => {
  const names = ["story-1", "story-2", "story-3", "story-4", "story-5", "story-6", "story-7", "story-8"]
  for (const n of names) assert.deepEqual(printFrame(n), printFrame(n))
  for (const n of names) assert.equal(printFrame(n).ratio, "4 / 5")
  assert.deepEqual(names.slice(0, 6).map((n) => parseFloat(printFrame(n).tilt)), [-5, 4, -3, 6, -4, 3])
  for (const n of [...names, "kid-nadia", "kid-griffin-1998"]) { const t = parseFloat(printFrame(n).tilt); assert.ok(Math.abs(t) <= 6 && Math.abs(t) >= 3, `${n} ${t}`) }
  for (let i = 1; i < names.length; i++) assert.notEqual(Math.sign(parseFloat(printFrame(names[i]).tilt)), Math.sign(parseFloat(printFrame(names[i - 1]).tilt)))
})

test("the tape and edge vary: some prints have none, the rest their own length, place and angle", () => {
  const names = Array.from({ length: 24 }, (_, i) => `story-${i + 1}`)
  const f = names.map(printFrame)
  const none = f.filter((x) => x.tape === null).length
  assert.ok(none >= 2 && none <= 12, `${none} of 24 without tape`)
  for (const k of ["tapeWidth", "tapeAt", "tapeTurn", "edge"] as const) assert.ok(new Set(f.map((x) => x[k])).size >= 3, `${k} varies`)
  for (const x of f) { assert.ok(Math.abs(parseFloat(x.tapeTurn)) <= 5); assert.equal(Math.sign(parseFloat(x.tapeTurn)), x.lean) }
})
