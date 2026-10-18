// Final run: the back end's "flying from" keeps the picked city, reads the older fixed answers, and refuses free text
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"

const ctx: { __x?: Record<string, (...a: unknown[]) => unknown> } = {}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__x = { flyingOf_, bucketOf_, setFlying_ }", ctx)
const x = ctx.__x!, plain = (v: unknown) => JSON.parse(JSON.stringify(v))

test("older answers still draw a line; picked cities keep theirs", () => {
  assert.deepEqual(plain(x.flyingOf_({ "Flying from": "Brisbane" })), { name: "Brisbane", country: "AU", lat: -27.468, lon: 153.028 })
  assert.deepEqual(plain(x.flyingOf_({ "Flying from": "'Victoria", "Flying country": "'CA", "Flying lat": 48.43, "Flying lon": -123.37 })), { name: "Victoria", country: "CA", lat: 48.43, lon: -123.37 })
  assert.equal(x.flyingOf_({ "Flying from": "" }), null)
})
test("every city counts toward the nearest older answer too", () => {
  assert.equal(x.bucketOf_({ name: "Gold Coast", country: "AU", lat: -28.0, lon: 153.4 }), "Brisbane")
  assert.equal(x.bucketOf_({ name: "Hobart", country: "AU", lat: -42.88, lon: 147.33 }), "Melbourne")
  assert.equal(x.bucketOf_({ name: "Victoria", country: "CA", lat: 48.43, lon: -123.37 }), "Canada")
  assert.equal(x.bucketOf_({ name: "London", country: "GB", lat: 51.5, lon: -0.12 }), "Somewhere else")
})
test("only a picked city or an older answer is saved: anything else is refused before the sheet is touched", () => {
  for (const bad of ["Noeth Melbourne", { id: "x1", name: "Melbourne", country: "AU", lat: 1, lon: 1 }, { id: 1, name: "", country: "AU", lat: 1, lon: 1 }, { id: 1, name: "A", country: "Australia", lat: 1, lon: 1 }, { id: 1, name: "A", country: "AU", lat: 200, lon: 1 }, null])
    assert.equal((x.setFlying_("t", bad) as { code: string }).code, "bad_request", JSON.stringify(bad))
})
