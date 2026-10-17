// Travel puts On the day first from 14 days out, or in "week of" mode; otherwise the planning order.
import { test } from "node:test"
import assert from "node:assert/strict"
import { travelOrder } from "../src/lib/travel-order.ts"

const start = "2027-10-15T13:00:00+09:00"
test("planning order until 14 days out", () => {
  assert.equal(travelOrder(new Date("2027-09-30T12:00:00+09:00"), start, "invite")[0], "to-kyoto")
})
test("On the day first from 14 days out", () => {
  assert.deepEqual(travelOrder(new Date("2027-10-01T13:00:00+09:00"), start, "invite"), ["on-the-day", "to-kyoto", "stay", "before"])
  assert.equal(travelOrder(new Date("2027-10-16T09:00:00+09:00"), start, "keepsake")[0], "on-the-day")
})
test("week-of mode puts On the day first whatever the date", () => {
  assert.equal(travelOrder(new Date("2026-10-18T09:00:00+09:00"), start, "week-of")[0], "on-the-day")
})
