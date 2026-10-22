// Run 21: review links. Code.gs in a sandbox over a made-up sheet (no real data): a Preview tab token opens the made-up
// household, a reply from it answers as saved but writes nothing and sends nothing, its feedback lands in the Feedback
// tab, and an unknown token gets the same answer as before.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"

function backEnd() {
  const tabs: Record<string, unknown[][]> = {
    Guests: [["Household", "First name", "Token", "Email", "Guest ID", "Attending", "Dietary"], ["Test family", "Tess", "tttttttttt", "", "1", "", ""]],
    RSVPs: [["Token", "Responded at"]], Songs: [["Token", "Song"]], Log: [["Time", "Token"]],
    Preview: [["Token", "Name", "Language", "Notes"], ["pjapanese2", "Japanese review", "ja", ""], ["pdesign234", "Design review", "en", ""]],
  }
  const sent: unknown[] = [], cache: Record<string, string> = {}, props: Record<string, string> = {}
  const sheet = (name: string) => tabs[name] && {
    getDataRange: () => ({ getValues: () => tabs[name] }),
    appendRow: (r: unknown[]) => tabs[name].push(r), setFrozenRows() {}, getLastRow: () => tabs[name].length,
    getLastColumn: () => tabs[name][0].length, getRange: () => ({ getValues: () => [tabs[name][0]], setValue() {} }),
  }
  const g = {
    console: { error() {}, log() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null, getProperties: () => props, setProperty: (k: string, v: string) => { props[k] = v }, deleteProperty: (k: string) => { delete props[k] } }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache[k] ?? null, put: (k: string, v: string) => { cache[k] = v }, remove: (k: string) => { delete cache[k] } }) },
    MailApp: { getRemainingDailyQuota: () => 97, sendEmail: (m: unknown) => sent.push(m) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }), getUserLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => "griffinandnadia@gmail.com" }) },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: sheet, insertSheet: (n: string) => { tabs[n] = []; return sheet(n) } }), flush() {} },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (t: string) => ({ setMimeType: () => ({ getContent: () => t }) }) },
    ScriptApp: { getProjectTriggers: () => [] },
    Utilities: { formatDate: () => "" },
  }
  vm.createContext(g)
  vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__f = { doGet, doPost }", g)
  const f = (g as unknown as { __f: { doGet: (e: object) => { getContent: () => string }; doPost: (e: object) => { getContent: () => string } } }).__f
  return {
    tabs, sent,
    get: (q: Record<string, string>) => JSON.parse(f.doGet({ parameter: q }).getContent()),
    post: (body: object) => JSON.parse(f.doPost({ postData: { contents: JSON.stringify(body) } }).getContent()),
  }
}

test("a review link opens the made-up household in its language; an unknown one is still just not there", () => {
  const b = backEnd()
  const ja = b.get({ action: "household", token: "pjapanese2" })
  assert.equal(ja.household.preview, "ja")
  assert.deepEqual(ja.household.guests.map((x: { firstName: string }) => x.firstName), ["Sam", "Alex", "Guest"])
  assert.equal(b.get({ action: "household", token: "pdesign234" }).household.preview, "en")
  assert.deepEqual(b.get({ action: "household", token: "zzzzzzzzzz" }), { ok: true, household: null })
})

test("a reply from a review link answers as sent, and nothing is written or emailed", () => {
  const b = backEnd(), before = JSON.stringify(b.tabs)
  const out = b.post({ action: "rsvp", token: "pdesign234", id: "x1", guests: [{ id: "p1", attending: "yes", dietary: "None", firstName: "Sam" }, { id: "p2", attending: "no", dietary: "None", firstName: "Alex" }, { id: "p3", attending: "no", dietary: "None", firstName: "Guest" }], songs: [], arrival: "", departure: "", message: "", photos: false })
  assert.equal(out.ok, true, JSON.stringify(out))
  assert.ok(out.household.respondedAt)
  assert.deepEqual(b.post({ action: "flying", token: "pdesign234", city: "Brisbane" }), { ok: true })
  assert.equal(JSON.stringify(b.tabs), before)
  assert.equal(b.sent.length, 0)
})

test("feedback from a review link goes to the Feedback tab with where it was left; anyone else's is turned away", () => {
  const b = backEnd()
  assert.equal(b.post({ action: "feedback", token: "pjapanese2", note: "この行が少し不自然です", page: "/travel", theme: "lantern", viewport: "390x844", lang: "ja" }).ok, true)
  const row = b.tabs.Feedback.at(-1)!
  assert.deepEqual(JSON.parse(JSON.stringify(row.slice(1))), ["'Japanese review", "'/travel", "'lantern", "'390x844", "'ja", "'この行が少し不自然です"])
  assert.equal(b.post({ action: "feedback", token: "tttttttttt", note: "hi" }).code, "not_found")
  assert.equal(b.post({ action: "feedback", token: "pjapanese2", note: "" }).code, "bad_request")
})

test("run 23: the story and the fortunes only for a real link (a household's, a review link); anything else is not found", () => {
  const b = backEnd()
  for (const action of ["content", "fortunes"]) {
    assert.equal(b.get({ action }).code, "not_found")
    assert.equal(b.get({ action, token: "zzzzzzzzzz" }).code, "not_found")
    assert.equal(b.get({ action, token: "<x>" }).code, "not_found")
    assert.equal(b.get({ action, token: "tttttttttt" }).ok, true)
    assert.equal(b.get({ action, token: "pjapanese2" }).ok, true)
  }
})
