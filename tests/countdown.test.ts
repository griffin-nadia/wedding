// The countdown's screen reader line (run 19: it read "11 months and -340 day to go" from 19 Oct 2026).
import { test } from "node:test"
import assert from "node:assert/strict"
import { partsAt, sentence } from "../src/lib/countdown-parts.ts"

const end = new Date("2027-10-15T11:00:00+09:00")
const at = (iso: string) => partsAt(new Date(`${iso}+09:00`), end)
const say = (iso: string) => sentence(at(iso))
const pad = (n: number) => String(n).padStart(2, "0")

test("the date it went wrong on", () => {
  assert.equal(say("2026-10-19T09:00:00"), "11 months and 26 days to go")
  assert.deepEqual(at("2026-10-19T09:00:00"), { months: 11, days: 26, hours: 2, mins: 0, secs: 0 })
})

test("every month boundary, a year out to the day", () => {
  for (let n = 12; n >= 1; n--) {
    const y = n > 9 ? 2026 : 2027, m = ((9 - n + 12) % 12) + 1 // n months before October 2027
    const day = `${y}-${pad(m)}-15`
    const whole = n === 12 ? "1 year" : `${n} month${n > 1 ? "s" : ""}`
    assert.equal(say(`${day}T11:00:00`), `${whole} to go`, day)
    assert.deepEqual(at(`${day}T10:59:59`), { months: n, days: 0, hours: 0, mins: 0, secs: 1 }, `${day} a second before`)
    // A day later it's one month fewer, which lands on 16 September: 29 days from there
    const next = new Date(Date.UTC(y, m - 1, 16)).toISOString().slice(0, 10)
    assert.deepEqual(at(`${next}T11:00:00`), { months: n - 1, days: 29, hours: 0, mins: 0, secs: 0 }, next)
  }
  assert.equal(say("2027-10-14T11:00:00"), "1 day to go")
  assert.equal(say("2027-10-15T00:00:00"), "Today's the day")
  assert.equal(say("2027-10-15T11:00:00"), "Today's the day")
})

test("the 31st and the end of February", () => {
  assert.equal(say("2027-01-31T11:00:00"), "8 months and 15 days to go") // 31 Jan + 8 months = 30 Sep
  assert.equal(say("2027-08-31T11:00:00"), "1 month and 15 days to go")
  assert.equal(say("2027-02-28T11:00:00"), "7 months and 17 days to go")
  assert.equal(say("2026-10-31T23:59:59"), "11 months and 14 days to go")
})

test("every day of the last year: never negative, never a month of days", () => {
  for (let t = Date.parse("2026-10-15T00:00:00+09:00"); t < end.getTime(); t += 86_400_000 / 2) {
    const p = partsAt(new Date(t), end)
    for (const v of Object.values(p)) assert.ok(v >= 0, `${new Date(t).toISOString()} ${JSON.stringify(p)}`)
    assert.ok(p.days <= 30 && p.months <= 12, `${new Date(t).toISOString()} ${JSON.stringify(p)}`)
    assert.doesNotMatch(sentence(p), /-/)
  }
})
