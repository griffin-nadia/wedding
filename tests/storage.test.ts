// Saved data is versioned and checked on load (run 19): anything that doesn't fit is removed, never read.
import { test } from "node:test"
import assert from "node:assert/strict"
import { checkStorage, VERSION, VERSION_KEY } from "../src/lib/storage.ts"

function fake(init: Record<string, string>): Storage {
  const m = new Map(Object.entries(init))
  return {
    get length() { return m.size }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k), clear: () => m.clear(),
  }
}
const all = (s: Storage) => Object.fromEntries(Array.from({ length: s.length }, (_, i) => [s.key(i)!, s.getItem(s.key(i)!)]))

test("corrupt or old values go, good ones and other sites' keys stay, and the version is stamped", () => {
  const good = {
    "ng-theme": "lantern", "ng-lang": "ja", "ng-invite": "abc", "ng-opened": "1",
    "ng-household": JSON.stringify({ token: "abc", displayName: "Sam & Alex", guests: [{ id: "g1", firstName: "Sam" }], songs: [] }),
    "ng-draft-abc": JSON.stringify({ at: 1, form: { guests: [], songs: [] } }),
    "ng-flying:abc": "Melbourne", "ng-flying:def": JSON.stringify({ id: "x", name: "Perth" }),
    "ng-tune": JSON.stringify({ overrides: { all: {} }, notes: [] }), "ng-song-art": "{}", "ng-fly-abc": JSON.stringify({ visa: true }),
    "someone-else": "{not json",
  }
  const bad = {
    "ng-theme": "neon", "ng-lang": "fr", "ng-household": JSON.stringify({ token: "abc" }), "ng-draft-abc": JSON.stringify({ at: 9e15, form: 1 }),
    "ng-flying:abc": "{broken", "ng-tune": JSON.stringify({ overrides: { all: "x" } }), "ng-song-art": "[1]", "ng-fly-abc": "null",
  }
  const l = fake(good)
  checkStorage({ localStorage: l, sessionStorage: fake({}) })
  assert.deepEqual(all(l), { ...good, [VERSION_KEY]: String(VERSION) })
  const b = fake({ ...bad, "ng-invite": "abc" })
  checkStorage({ localStorage: b, sessionStorage: fake({ "ng-content": JSON.stringify({ story: "no" }) }) })
  assert.deepEqual(all(b), { "ng-invite": "abc", [VERSION_KEY]: String(VERSION) })
})

test("blocked storage is fine", () => {
  const blocked = new Proxy({}, { get() { throw new Error("SecurityError") } }) as Storage
  assert.doesNotThrow(() => checkStorage({ localStorage: blocked, sessionStorage: blocked }))
})
