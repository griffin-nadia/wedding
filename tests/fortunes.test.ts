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
