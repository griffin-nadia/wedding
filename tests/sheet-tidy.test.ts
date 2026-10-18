// The sheet tidy's pure parts (run 19): what the report would move, the To look at list and the Changed check.
// Code.gs loaded into a sandbox, made-up rows only, never real data.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"

const names = "runs_, tabOrder_, testEraRows_, staleColumns_, gapPlan_, changedSinceSeen_, toLookAt_, lookAtValues_, colLetter_"
const ctx: { __x?: Record<string, (...a: unknown[]) => unknown> } = {}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + `\n;globalThis.__x = { ${names} }`, ctx)
const plain = (f: (...a: unknown[]) => unknown) => (...a: unknown[]) => JSON.parse(JSON.stringify(f(...a)))
const x = Object.fromEntries(Object.entries(ctx.__x!).map(([k, f]) => [k, plain(f)]))
const changed = ctx.__x!.changedSinceSeen_ as (r: Record<string, unknown>) => boolean

test("tab order: the main tabs first, others kept where they were, Crew, Log and Archive last", () => {
  assert.deepEqual(x.tabOrder_(["Log", "Guests", "Emails", "Summary", "Crew", "Songs", "How to update", "RSVPs", "Questions", "Content", "Planner notes"]),
    ["Summary", "Guests", "RSVPs", "Questions", "Songs", "Content", "How to update", "Emails", "Planner notes", "Crew", "Log"])
  assert.deepEqual(x.tabOrder_(["Guests", "Archive", "Summary"]), ["Summary", "Guests", "Archive"])
  assert.deepEqual(x.runs_([7, 2, 3, 4, 9, 10]), [{ from: 2, to: 4 }, { from: 7, to: 7 }, { from: 9, to: 10 }]) // one sheet call per run
})

test("the report moves only Log rows from before the first real invite, and nothing before an invite has gone", () => {
  const log = [
    { Time: "2026-10-03T01:00:00Z", Kind: "Test send", Household: "Test family (test)", "What changed": "Test invite sent" },
    { Time: "2026-10-05T01:00:00Z", Kind: "", Household: "Test family (test)", "What changed": "First reply: Sam coming" },
    { Time: "2026-10-14T22:00:00Z", Kind: "Invite sent", Household: "Sam & Alex", "What changed": "Invite sent to 1" },
    { Time: "2026-10-16T01:00:00Z", Kind: "First reply", Household: "Sam & Alex", "What changed": "First reply: Sam coming" },
  ]
  const p = x.testEraRows_(log) as { cutoff: number; rows: { row: number; kind: string; household: string }[] }
  assert.equal(p.cutoff, Date.parse("2026-10-14T22:00:00Z"))
  assert.deepEqual(p.rows.map((r) => r.row), [2, 3]) // sheet rows, under the header
  assert.equal(p.rows[1].kind, "Note") // an old row without a Kind gets one from its wording
  // the older wording counts as an invite too
  assert.deepEqual((x.testEraRows_([log[0], { Time: "2026-10-04T00:00:00Z", "What changed": "Invite sent to 2" }]) as { rows: unknown[] }).rows.length, 1)
  assert.deepEqual(x.testEraRows_(log.slice(0, 2)), { cutoff: null, rows: [] })
})

test("helper columns: an empty unknown one or an unnamed one with data moves; a named one with data stays; ours never move", () => {
  const header = ["Token", "Household", "Song", "Added at", "old calc", "", "Nadia's notes", "spare"]
  const filled = [true, true, true, true, false, true, true, false]
  const p = x.staleColumns_("Songs", header, filled) as { move: { col: number; header: string }[]; left: { header: string }[] }
  assert.deepEqual(p.move.map((c) => c.col), [5, 6, 8])
  assert.deepEqual(p.left.map((c) => c.header), ["Nadia's notes"])
  // an unknown empty column sitting between ours stays (moving it would shift Questions' columns)
  const q = x.staleColumns_("Questions", ["Time", "spare", "Household", "Token", "Email", "Question", "Status", "Answer", "Answer (ja)", "Publish", "Sent", "Seen"], Array(12).fill(false)) as { move: unknown[] }
  assert.equal(q.move.length, 0)
  assert.deepEqual(x.staleColumns_("Summary", ["a"], [true]), { move: [], left: [] }) // only data tabs
})

test("empty rows full of unticked boxes: cleared, and the rows under them move up into the gap in order", () => {
  const row = (q: string) => ["2026-10-16", "Sam", "t", "", q, "new", "", "", false, ""]
  const blank = ["", "", "", "", "", "", "", "", false, ""]
  const rows = [row("a"), blank, blank, row("b"), row("c"), blank]
  assert.deepEqual(x.gapPlan_(rows, [8]), { clear: [3, 4, 7], moves: [{ from: 5, to: 3 }, { from: 6, to: 4 }] })
  assert.deepEqual(x.gapPlan_([row("a"), row("b")], [8]), { clear: [], moves: [] })
  // FALSE outside a tickbox column is something, not empty
  assert.deepEqual(x.gapPlan_([["", false], ["x", ""]], []), { clear: [], moves: [] })
})

test("Changed: only a reply ticked Seen that the household saved again after it was ticked", () => {
  assert.equal(changed({ Seen: true, "Seen at": new Date("2026-10-17T00:00:00Z"), "Responded at": new Date("2026-10-18T00:00:00Z") }), true)
  assert.equal(changed({ Seen: true, "Seen at": new Date("2026-10-18T00:00:00Z"), "Responded at": new Date("2026-10-17T00:00:00Z") }), false)
  assert.equal(changed({ Seen: false, "Seen at": "", "Responded at": new Date() }), false) // that's new, not changed
  assert.equal(changed({ Seen: true, "Seen at": "", "Responded at": new Date() }), false) // ticked before Seen at existed
})

test("To look at: new questions, new and changed replies, households not replied, dietary needs, each a link to its row", () => {
  const t = {
    questions: [
      { _row: 2, Household: "Sam & Alex", Question: "Is there\nparking?", Status: "new", Seen: false },
      { _row: 3, Household: "Jo", Question: "Kids?", Status: "answered", Seen: false },
      { _row: 4, Household: "Robin", Question: "Shoes?", Status: "new", Seen: true },
      { _row: 5, Household: "Kim", Question: "Dress code?", Status: "", Seen: "" },
    ],
    rsvps: [
      { _row: 2, Token: "s1", Household: "Sam & Alex", Seen: "" },
      { _row: 3, Token: "j1", Household: "Jo", Seen: true, "Seen at": "2026-10-17T00:00:00Z", "Responded at": "2026-10-18T00:00:00Z" },
      { _row: 4, Token: "r1", Household: "Robin", Seen: true, "Seen at": "2026-10-18T00:00:00Z", "Responded at": "2026-10-17T00:00:00Z" },
    ],
    guests: [
      { _row: 2, Token: "s1", Household: "Sam & Alex", "First name": "Sam", Attending: "yes", Dietary: "Coeliac; Nut allergy" },
      { _row: 3, Token: "s1", Household: "Sam & Alex", "First name": "Alex", Attending: "yes", Dietary: "None" },
      { _row: 4, Token: "k1", Household: "Kim & Lee", "First name": "Kim", Attending: "", Dietary: "Vegan" },
      { _row: 5, Token: "k1", Household: "Kim & Lee", "First name": "Lee", Attending: "", Dietary: "" },
      { _row: 6, Token: "", Household: "No link yet", "First name": "Ari", Attending: "", Dietary: "" },
    ],
  }
  const s = x.toLookAt_(t) as { title: string; items: { row: number; text: string; tab: string }[] }[]
  assert.deepEqual(s.map((x) => x.title), ["New questions", "New or changed replies", "Not replied yet", "Dietary needs"])
  assert.deepEqual(s[0].items.map((i) => [i.row, i.text]), [[2, "Sam & Alex: Is there parking?"], [5, "Kim: Dress code?"]])
  assert.deepEqual(s[1].items.map((i) => [i.row, i.text]), [[2, "New: Sam & Alex"], [3, "Changed: Jo"]])
  assert.deepEqual(s[2].items.map((i) => [i.tab, i.row, i.text]), [["Guests", 4, "Kim & Lee"]]) // once per household, first row
  assert.deepEqual(s[3].items.map((i) => i.text), ["Sam (Sam & Alex): Coeliac; Nut allergy"]) // only people coming

  const grid = x.lookAtValues_(s, { Questions: 11, RSVPs: 22, Guests: 33 }, "19 Oct, 9:00 AM") as string[][]
  assert.equal(grid.length, 13)
  assert.match(grid[0][0], /^To look at/)
  assert.equal(grid[1][0], "New questions (2)")
  assert.equal(grid[2][1], '=HYPERLINK("#gid=22&range=A2","New: Sam & Alex")')
  assert.equal(grid[2][2], '=HYPERLINK("#gid=33&range=A4","Kim & Lee")')
  // a quote in a name can't break out of the formula; a long list ends "and N more"
  const many = [{ title: "Not replied yet", tab: "Guests", items: Array.from({ length: 14 }, (_, i) => ({ tab: "Guests", row: i + 2, text: i ? "H" + i : 'The "Big" family' })) }]
  const g2 = x.lookAtValues_(many, { Guests: 1 }, "") as string[][]
  assert.equal(g2[2][0], '=HYPERLINK("#gid=1&range=A2","The ""Big"" family")')
  assert.equal(g2[11][0], "and 5 more in Guests")
  assert.equal(g2[12][0], "")
  assert.equal(x.colLetter_(28), "AB")
})
