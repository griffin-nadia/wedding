// Run 23: Nadia's 25 omikuji. The back end reads the Fortunes tab in number order (falling back to the drafts), and the
// slip's numbers read as on a real omikuji up to 二十五.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import { kanjiNumber } from "../src/lib/kanji.ts"

function fortunesFrom(tab: unknown[][] | null) {
  const cache: Record<string, string> = {}
  const sheet = (name: string) => (name === "Fortunes" && tab ? { getDataRange: () => ({ getValues: () => tab }) } : null)
  const g = {
    console, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache[k] ?? null, put: (k: string, v: string) => { cache[k] = v } }) },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: sheet }) },
  }
  vm.createContext(g)
  vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__f = fortunes_", g)
  return JSON.parse(JSON.stringify((g as unknown as { __f: () => unknown[] }).__f()))
}

test("the Fortunes tab, in number order, each with its tier, Japanese tier and category", () => {
  const head = ["No", "Tier", "Tier (ja)", "Category", "Text"]
  const out = fortunesFrom([head, [2, "Great Blessing", "大吉", "Travel", "Second"], [1, "Great Blessing", "大吉", "Food", "First"], ["", "", "", "", ""]])
  assert.deepEqual(out, [
    { no: 1, tier: "Great Blessing", tierJa: "大吉", category: "Food", text: "First" },
    { no: 2, tier: "Great Blessing", tierJa: "大吉", category: "Travel", text: "Second" },
  ])
})

test("no Fortunes tab, or an empty one: the drafts, all 大吉", () => {
  for (const tab of [null, [["No", "Tier", "Tier (ja)", "Category", "Text"]]]) {
    const out = fortunesFrom(tab) as { tierJa: string }[]
    assert.equal(out.length, 12)
    assert.ok(out.every((f) => f.tierJa === "大吉"))
  }
})

test("the slip's number in kanji, 1 to 25", () => {
  assert.deepEqual([1, 7, 10, 11, 12, 19, 20, 21, 25].map(kanjiNumber), ["一", "七", "十", "十一", "十二", "十九", "二十", "二十一", "二十五"])
})

// Run 26: the Draft column, and draws kept per household, append only
test("a Fortunes row marked Draft carries draft: true, and the Japanese column textJa; the rest are unchanged", () => {
  const out = fortunesFrom([["No", "Tier", "Tier (ja)", "Category", "Text", "Draft", "Japanese"], [1, "Great Blessing", "大吉", "Food", "Theirs", "", "日本語"], [2, "Great Blessing", "大吉", "Fun", "A story line", "yes", ""]]) as { draft?: boolean; textJa?: string }[]
  assert.equal(out[0].draft, undefined)
  assert.equal(out[0].textJa, "日本語")
  assert.equal(out[1].draft, true)
  assert.equal(out[1].textJa, undefined)
})

test("draws: the first is main's pick over all 25; a redraw is never a draft or the one before", async () => {
  const { fortuneFor, fortuneIndex, mergeDraws, lastDraw } = await import("../src/lib/draws.ts")
  const pool = Array.from({ length: 25 }, (_, i) => ({ no: i + 1, draft: [2, 7, 22].includes(i + 1) }))
  for (const token of ["abc123", "sample", "zz9", "t-0"]) for (let n = 2; n < 40; n++) {
    const i = fortuneFor(token, n, pool, false)
    assert.ok(!pool[i].draft)
    assert.notEqual(i, fortuneFor(token, n - 1, pool, false))
  }
  assert.equal(fortuneFor("abc123", 7, pool, false), fortuneFor("abc123", 7, pool, false)) // the same on every device
  const saved = [{ draw: 1, no: 4 }, { draw: 2, no: 9 }]
  assert.deepEqual(mergeDraws(saved, [{ draw: 2, no: 11 }, { draw: 3, no: 5 }]), [{ draw: 1, no: 4 }, { draw: 2, no: 9 }, { draw: 3, no: 5 }])
  assert.equal(lastDraw([]), 0)
  assert.equal(fortuneIndex("abc123", 25), fortuneFor("abc123", 1, pool.map((f) => ({ no: f.no })), false))
})

// Invites went out on 15 Oct, so guests have seen their fortune: marking 2, 7 and 22 Draft may only move the
// households whose fortune was one of those three; everyone else keeps main's, still "of 25"
test("marking the story lines Draft moves only the households who had them", async () => {
  const { fortuneFor, fortuneIndex } = await import("../src/lib/draws.ts")
  const plain = Array.from({ length: 25 }, (_, i) => ({ no: i + 1 }))
  const marked = plain.map((f) => ({ ...f, draft: [2, 7, 22].includes(f.no) }))
  const tokens = Array.from({ length: 2000 }, (_, i) => `h${(i * 7919).toString(36)}x${i}`)
  let moved = 0
  for (const t of tokens) {
    const main = fortuneIndex(t, 25) // main today: FORTUNES[fortuneIndex(token, 25)]
    assert.equal(fortuneFor(t, 1, plain, false), main)
    const now = fortuneFor(t, 1, marked, false)
    if ([2, 7, 22].includes(main + 1)) { moved++; assert.ok(!marked[now].draft) } else assert.equal(now, main, t)
  }
  assert.ok(moved > 0 && moved < tokens.length / 4)
  console.log(`  ${moved} of ${tokens.length} sample tokens move (their fortune was 2, 7 or 22)`)
})

test("the back end appends each draw and never rewrites one", () => {
  const rows: unknown[][] = []
  let tab: { appendRow: (r: unknown[]) => void; setFrozenRows: () => void; getDataRange: () => { getValues: () => unknown[][] } } | null = null
  const make = () => (tab = { appendRow: (r) => void rows.push(r.map((v) => (typeof v === "string" ? v.replace(/^'/, "") : v))), setFrozenRows: () => {}, getDataRange: () => ({ getValues: () => rows }) })
  const g = {
    console, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    SpreadsheetApp: { getActive: () => ({ getSheetByName: (n: string) => (n === "Draws" ? tab : null), insertSheet: make }) },
  }
  vm.createContext(g)
  vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;cachedHousehold_ = (t) => t === 'house1' ? { token: t } : null; globalThis.__d = addDraw_", g)
  const add = (g as unknown as { __d: (t: string, d: unknown, n: unknown) => { ok: boolean; code?: string; draws?: unknown } }).__d
  assert.equal(add("house1", 1, 7).ok, true)
  assert.deepEqual(JSON.parse(JSON.stringify(add("house1", 2, 12).draws)), [{ draw: 1, no: 7 }, { draw: 2, no: 12 }])
  assert.deepEqual(JSON.parse(JSON.stringify(add("house1", 1, 3).draws)), [{ draw: 1, no: 7 }, { draw: 2, no: 12 }]) // draw 1 stays 7
  assert.equal(rows.length, 3) // the header and two draws
  assert.equal(add("nobody", 1, 1).code, "not_found")
  assert.equal(add("house1", "2", 1).code, "bad_request")
})

test("draw another (run 26 review): random, never the one just shown, never a draft while the switch is off", async () => {
  const { randomPick } = await import("../src/lib/draws.ts")
  const pool = Array.from({ length: 25 }, (_, i) => ({ no: i + 1, draft: [2, 7, 22].includes(i + 1) }))
  const seen = new Set<number>()
  for (let k = 0; k < 2000; k++) {
    const j = randomPick(pool, false, 5)
    assert.notEqual(pool[j].no, 5)
    assert.ok(!pool[j].draft)
    seen.add(pool[j].no)
  }
  assert.equal(seen.size, 21) // every other drawable line comes up: 25, less 3 drafts, less the one shown
  assert.equal(randomPick([{ no: 1 }], false, 1), 0) // a pool of one: that one again
  assert.equal(randomPick([{ no: 1, draft: true }], false, undefined), -1) // nothing drawable
})
