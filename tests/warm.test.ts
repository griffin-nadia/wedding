// The idle warm: pages always, the globe only without Save-Data.
import { test } from "node:test"
import assert from "node:assert/strict"
const { warm } = await import("../src/lib/warm.ts")

test("Save-Data skips the globe but still warms the pages", () => {
  const ran: string[] = []
  const light = [() => ran.push("page")], heavy = [() => ran.push("globe")]
  warm({ connection: { saveData: true } }, light, heavy)
  assert.deepEqual(ran, ["page"])
  warm({ connection: { saveData: false } }, light, heavy)
  warm({}, light, heavy)
  assert.deepEqual(ran, ["page", "page", "globe", "page", "globe"])
})
