// The shared frame loop: one requestAnimationFrame at a time, jobs leave when they return false or are cancelled.
import { test } from "node:test"
import assert from "node:assert/strict"
const queue: ((t: number) => void)[] = []
globalThis.requestAnimationFrame = ((f: (t: number) => void) => { queue.push(f); return queue.length }) as typeof requestAnimationFrame
const { loop, nextFrame } = await import("../src/lib/frame.ts")
const flush = (t: number) => { const fs = queue.splice(0); fs.forEach((f) => f(t)) }

test("one frame request however many jobs join, and a nested job waits a frame", () => {
  const seen: string[] = []
  let n = 0
  const stop = loop(() => { seen.push(`loop${n}`); return ++n < 3 })
  nextFrame(() => { seen.push("once"); nextFrame(() => seen.push("nested")) })
  assert.equal(queue.length, 1)
  flush(1); assert.deepEqual(seen, ["loop0", "once"]); assert.equal(queue.length, 1)
  flush(2); assert.deepEqual(seen, ["loop0", "once", "loop1", "nested"])
  flush(3); flush(4)
  assert.deepEqual(seen, ["loop0", "once", "loop1", "nested", "loop2"])
  assert.equal(queue.length, 0)
  stop()
})

test("a cancelled job never runs", () => {
  let ran = false
  const cancel = loop(() => { ran = true })
  cancel(); flush(5)
  assert.equal(ran, false)
})
