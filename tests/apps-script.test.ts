// The back end's pure parts, run here without Google: Code.gs loaded into a sandbox. Made-up rows only, never real data.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"

const src = fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__x = { planLaunch_, plannerGuestColumns_, backupsToTrash_ }"
const ctx: { __x?: Record<string, (...a: unknown[]) => unknown> } = {}
vm.createContext(ctx)
vm.runInContext(src, ctx)
// Results come back as the sandbox's own objects; compare them as plain data
const plain = (f: (...a: unknown[]) => unknown) => (...a: unknown[]) => JSON.parse(JSON.stringify(f(...a)))
const planLaunch_ = plain(ctx.__x!.planLaunch_), plannerGuestColumns_ = plain(ctx.__x!.plannerGuestColumns_), backupsToTrash_ = plain(ctx.__x!.backupsToTrash_)

const site = [
  { Household: "Test Smith", "First name": "Tess", Token: "t1", Email: "" },
  { Household: "Sam & Alex", "First name": "Sam", Token: "s1", Email: "", Opens: 3, "First opened": "x" },
  { Household: "Sam & Alex", "First name": "Alex", Token: "s1", Email: "" },
]
const tabs = { RSVPs: [{ Token: "t1" }, { Token: "s1" }], Songs: [{ Token: "t1" }], Log: [{ Token: "t1" }, { Token: "t1" }, { Token: "s1" }] }
const planner = [
  ["Wedding guest list"],
  ["Household", "First name", "Last name", "Email address", "Mobile"],
  ["Sam & Alex", "Sam", "Lee", "sam@example.com", ""],
  ["Jo & Kim", "Jo", "", "jo@example.com", ""],
  ["Jo & Kim", "Kim", "", "", ""],
  ["Robin", "", "", "", ""],
  ["Test row", "Tess", "", "", ""],
]

test("the report counts test rows, visits and the queue, and never counts a real household as test", () => {
  const p = planLaunch_(site, tabs, planner, ["q:save:x", "q:mail:y", "flush_trigger"]) as Record<string, unknown>
  assert.deepEqual(p.clear, { Guests: 1, RSVPs: 1, Songs: 1, Log: 2 })
  assert.equal(p.kept, 2)
  assert.equal(p.visits, 2)
  assert.equal(p.queue, 2)
})
test("the planner's guests are mapped by heading, deduplicated against Guests, test rows skipped", () => {
  const p = planLaunch_(site, tabs, planner, []) as { add: { household: string; first: string; email: string }[]; noEmail: string[]; problems: string[]; households: number }
  assert.deepEqual(p.problems, [])
  assert.deepEqual(p.add.map((a) => `${a.household}/${a.first}`), ["Jo & Kim/Jo", "Jo & Kim/Kim"]) // Sam is already there, Robin has no first name, Test is test
  assert.deepEqual(p.noEmail, ["Sam & Alex"]) // the planner's email for Sam isn't copied over an existing row
  assert.equal(p.households, 2)
})
test("a planner without a usable heading row is a problem, not a guess", () => {
  const p = planLaunch_(site, tabs, [["Budget", "Cost"], ["Venue", "1"]], []) as { problems: string[]; add: unknown[] }
  assert.equal(p.problems.length, 1)
  assert.equal(p.add.length, 0)
  assert.equal((plannerGuestColumns_([["Name", "E-mail"]]) as { map: Record<string, number> }).map.email, 1)
})
test("weekly backups: keep the newest 8, trash the rest, never anything that isn't a backup", () => {
  const files = Array.from({ length: 11 }, (_, i) => ({ name: `Site-Data weekly 2027-01-${String(i + 1).padStart(2, "0")}`, created: Date.UTC(2027, 0, i + 1) }))
    .concat([{ name: "Planner backup 2026-10-18 0400", created: 1 }, { name: "Notes", created: 2 }])
  const out = backupsToTrash_(files, "Site-Data weekly ", 8) as { name: string }[]
  assert.deepEqual(out.map((f) => f.name), ["Site-Data weekly 2027-01-03", "Site-Data weekly 2027-01-02", "Site-Data weekly 2027-01-01"])
})
