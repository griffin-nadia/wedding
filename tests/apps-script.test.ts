// The back end's pure parts, run here without Google: Code.gs loaded into a sandbox. Made-up rows only, never real data.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"

const src = fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__x = { planLaunch_, plannerGuestColumns_, backupsToTrash_, quotaLine_ }"
const ctx: { __x?: Record<string, (...a: unknown[]) => unknown> } = {}
vm.createContext(ctx)
vm.runInContext(src, ctx)
// Results come back as the sandbox's own objects; compare them as plain data
const plain = (f: (...a: unknown[]) => unknown) => (...a: unknown[]) => JSON.parse(JSON.stringify(f(...a)))
const quotaLine_ = ctx.__x!.quotaLine_ as (e: number, q: number | null) => string
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

test("the launch report's quota guard: invite emails counted per address, and whether today's limit fits them", () => {
  const p = planLaunch_(site, tabs, planner, []) as { inviteEmails: number }
  assert.equal(p.inviteEmails, 1) // Jo from the planner; Sam's planner email isn't copied, Kim has none
  assert.match(quotaLine_(60, 100), /so they fit/)
  assert.match(quotaLine_(150, 100), /won't all fit.*about 2 days/)
  assert.match(quotaLine_(5, null), /Couldn't read/)
})

// Google's services stubbed: what health_ and alert_ do with them
function backEnd(props: Record<string, string>, opts: { sheet?: boolean; me?: string } = {}) {
  const sent: unknown[] = [], posted: string[] = [], cache: Record<string, string> = {}
  const g = {
    __sent: sent, __posted: posted, console: { error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null, getProperties: () => props, setProperty: (k: string, v: string) => { props[k] = v }, deleteProperty: (k: string) => { delete props[k] } }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache[k] ?? null, put: (k: string, v: string) => { cache[k] = v } }) },
    MailApp: { getRemainingDailyQuota: () => 97, sendEmail: (m: unknown) => sent.push(m) },
    UrlFetchApp: { fetch: (_u: string, o: { payload: string }) => posted.push(o.payload) },
    Session: { getEffectiveUser: () => ({ getEmail: () => opts.me ?? "griffinandnadia@gmail.com" }) },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: () => (opts.sheet === false ? null : { getLastRow: () => 40 }) }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (t: string) => ({ setMimeType: () => ({ getContent: () => t }) }) },
    ScriptApp: { getProjectTriggers: () => [] },
  }
  vm.createContext(g)
  vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__f = { health_, alert_, queueOut_, flushOut_, watchHealth, flushQueue, doGet, foldSmall_ }", g)
  return g as typeof g & { __f: { health_: () => Record<string, unknown>; alert_: (c: string, e: unknown) => void; queueOut_: (m: object, t?: string) => void; flushOut_: () => void; watchHealth: () => void; flushQueue: () => void; doGet: (e: object) => { getContent: () => string }; foldSmall_: (c: object[], min: number) => { name: string; n: number }[] } }
}
test("?action=health: ok only when the sheet opens and the queue is moving; counts, no guest data", () => {
  assert.deepEqual(Object.keys(backEnd({}).__f.health_()).sort(), ["at", "emailQuota", "ok", "pending", "queueMoving", "service", "sheet"])
  assert.equal(backEnd({}).__f.health_().ok, true)
  assert.equal(backEnd({}, { sheet: false }).__f.health_().ok, false)
  assert.equal(backEnd({ "q:mail:x": "{}", last_flush_at: String(Date.now() - 20 * 60 * 1000) }).__f.health_().ok, false) // stuck
  assert.equal(backEnd({ "q:mail:x": "{}", last_flush_at: String(Date.now() - 60 * 1000) }).__f.health_().ok, true)
})
test("errors alert by email and Discord only when set up, once an hour per kind, with tokens taken out", () => {
  const off = backEnd({}); off.__f.alert_("save_failed", new Error("boom"))
  assert.equal(off.__sent.length + off.__posted.length, 0) // nothing set: nothing sent
  const on = backEnd({ ALERT_EMAIL: "alerts@example.com", DISCORD_WEBHOOK_URL: "https://discord.example/hook" })
  on.__f.alert_("save_failed", new Error("bad token abcdefghijklmnopqrstuvwxyz123"))
  on.__f.alert_("save_failed", new Error("again"))
  assert.equal(on.__sent.length, 1); assert.equal(on.__posted.length, 1)
  assert.doesNotMatch(JSON.stringify(on.__sent) + on.__posted.join(""), /abcdefghijklmnop/)
  const wrong = backEnd({ ALERT_EMAIL: "alerts@example.com" }, { me: "someone@example.com" }); wrong.__f.alert_("x", "y")
  assert.equal(wrong.__sent.length, 0) // email only from the wedding account
})
test("outbox emails carry their household's token (so test ones can be cleared) and never send it", () => {
  const props: Record<string, string> = {}
  const b = backEnd(props)
  b.__f.queueOut_({ to: "test@example.com", subject: "Your link", body: "x" }, "tok1")
  b.__f.queueOut_({ to: "us@example.com", subject: "A question", body: "y" })
  const kept = Object.keys(props).filter((k) => k.startsWith("q:out:")).map((k) => JSON.parse(props[k]).token)
  assert.deepEqual(kept.sort(), ["tok1", undefined].sort())
  b.__f.flushOut_()
  assert.equal(b.__sent.length, 2)
  assert.ok(b.__sent.every((m) => !("token" in (m as object))))
})

test("two songs at most (run 19): the back end keeps the first two, like the form", () => {
  assert.equal(vm.runInContext("MAX.songs", ctx), 2)
})

// Run 20 (the 19 Oct 2026 outage): the sheet not opening, or the queue failing 3 runs in a row, alerts at once
test("the health watch alerts when the sheet won't open, and says nothing when it's fine", () => {
  const props = () => ({ ALERT_EMAIL: "alerts@example.com", REPLY_TO: "wedding@example.com" })
  const down = backEnd(props(), { sheet: false, me: "wedding@example.com" })
  down.__f.watchHealth()
  assert.equal(down.__sent.length, 1)
  assert.match(String((down.__sent[0] as { subject: string }).subject), /sheet_unreadable/)
  const up = backEnd(props(), { me: "wedding@example.com" })
  up.__f.watchHealth()
  assert.equal(up.__sent.length, 0)
  assert.doesNotMatch(JSON.stringify(down.__f.health_()), /sheetError/) // the reason is for the alert, never the public answer
})
test("the queue failing 3 runs in a row alerts once; a run that works resets the count", () => {
  const props: Record<string, string> = { ALERT_EMAIL: "alerts@example.com", REPLY_TO: "wedding@example.com" }
  const b = backEnd(props, { me: "wedding@example.com" }) // no LockService here, so every run fails
  for (let i = 0; i < 4; i++) assert.throws(() => b.__f.flushQueue())
  assert.equal(b.__sent.length, 1)
  assert.equal(props.flush_fails, "4")
})

// Run 20: anyone gets only { ok } from ping and health; the detail needs HEALTH_KEY
test("ping and health: only ok without the key, the detail with it", () => {
  const get = (b: ReturnType<typeof backEnd>, q: Record<string, string>) => JSON.parse(b.__f.doGet({ parameter: q }).getContent())
  const b = backEnd({ HEALTH_KEY: "k-123", "q:mail:x": "{}", last_flush_at: String(Date.now()) })
  assert.deepEqual(get(b, { action: "ping" }), { ok: true })
  assert.deepEqual(get(b, { action: "health" }), { ok: true })
  assert.deepEqual(get(b, { action: "health", key: "wrong" }), { ok: true })
  assert.equal(get(b, { action: "health", key: "k-123" }).pending, 1)
  assert.deepEqual(get(backEnd({}, { sheet: false }), { action: "health" }), { ok: false })
  assert.deepEqual(get(backEnd({}), { action: "health", key: "" }), { ok: true }) // no HEALTH_KEY set: nobody gets the detail
})
test("journeys: a city with one household folds into its country, and a country with one is left off", () => {
  const out = backEnd({}).__f.foldSmall_([
    { name: "Melbourne", country: "AU", lat: -37.81, lon: 144.96, n: 3 },
    { name: "Ballarat", country: "AU", lat: -37.56, lon: 143.85, n: 1 },
    { name: "Bendigo", country: "AU", lat: -36.76, lon: 144.28, n: 1 },
    { name: "Suva", country: "FJ", lat: -18.14, lon: 178.44, n: 1 },
  ], 2)
  assert.deepEqual(JSON.parse(JSON.stringify(out)), [
    { name: "Melbourne", country: "AU", lat: -37.81, lon: 144.96, n: 3 },
    { name: "AU", country: "AU", lat: -37, lon: 144, n: 2 },
  ])
})
