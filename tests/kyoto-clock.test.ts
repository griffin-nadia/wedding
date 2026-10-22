// Run 21: The day's "It's X in Kyoto right now" is always Japan's clock, whatever the guest's device is set to, and on
// the nights the guest's own clocks change for daylight saving. Japan has no daylight saving, so the Kyoto line moves
// one minute per minute straight through a change; the guest's own line for the ceremony moves with their zone.
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { kyotoNow, localTimeParts } from "../src/lib/time.ts"

test("the Kyoto line is Japan time, straight through Sydney's and Vancouver's clock changes", () => {
  // Sydney leaves daylight saving at 3:00 am AEDT on Sun 4 Apr 2027 (16:00 UTC the day before)
  assert.equal(kyotoNow(new Date("2027-04-03T15:59:00Z")), "12:59 am")
  assert.equal(kyotoNow(new Date("2027-04-03T16:01:00Z")), "1:01 am")
  // Sydney starts it at 2:00 am AEST on Sun 3 Oct 2027 (16:00 UTC the day before)
  assert.equal(kyotoNow(new Date("2027-10-02T15:59:00Z")), "12:59 am")
  assert.equal(kyotoNow(new Date("2027-10-02T16:01:00Z")), "1:01 am")
  // Vancouver ends it at 2:00 am PDT on Sun 7 Nov 2027 (09:00 UTC)
  assert.equal(kyotoNow(new Date("2027-11-07T08:59:00Z")), "5:59 pm")
  assert.equal(kyotoNow(new Date("2027-11-07T09:01:00Z")), "6:01 pm")
})

test("the device's own zone never changes the Kyoto line", () => {
  const at = "2027-10-15T02:00:00Z" // 11:00 am in Kyoto, the ceremony
  for (const tz of ["Australia/Sydney", "America/Vancouver", "Europe/London", "Asia/Tokyo", "UTC"]) {
    const out = execFileSync(process.execPath, ["--input-type=module", "-e", `import { kyotoNow } from "./src/lib/time.ts"; console.log(kyotoNow(new Date("${at}")))`], { env: { ...process.env, TZ: tz } }).toString().trim()
    assert.equal(out, "11:00 am", tz)
  }
})

test("the guest's own time for the ceremony follows their zone's daylight saving", () => {
  // 11:00 am Fri 15 Oct 2027 in Kyoto: Sydney is on daylight time by then (+11), Brisbane never is (+10)
  assert.deepEqual(localTimeParts("11:00", "en", "Australia/Sydney"), { time: "1:00 pm", day: "Fri", city: "Sydney" })
  assert.deepEqual(localTimeParts("11:00", "en", "Australia/Brisbane"), { time: "12:00 pm", day: "Fri", city: "Brisbane" })
  // Vancouver is still on daylight time (-7) in mid October: Thursday evening
  assert.deepEqual(localTimeParts("11:00", "en", "America/Vancouver"), { time: "7:00 pm", day: "Thu", city: "Vancouver" })
  assert.equal(localTimeParts("11:00", "en", "Asia/Tokyo"), null)
})
