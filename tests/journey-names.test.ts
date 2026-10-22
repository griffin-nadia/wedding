// Run 24: a guest city is named only with 2+ households (else its country), and a country with 4+ lines is one bundle
import { test } from "node:test"
import assert from "node:assert/strict"
import { bundle, placeLabel } from "../src/lib/journey-names.ts"

test("a city is named only when 2 or more households come from it", () => {
  assert.equal(placeLabel({ name: "Melbourne", country: "AU", n: 6 }), "Melbourne")
  assert.equal(placeLabel({ name: "Perth", country: "AU", n: 1 }), "Australia")
  assert.equal(placeLabel({ name: "London", country: "GB", n: 1 }), "United Kingdom")
})

test("4 or more lines from one country become one bundle with its count; fewer stay as they are", () => {
  const au = [["Melbourne", 6], ["Sydney", 3], ["Gold Coast", 2], ["Perth", 1]].map(([name, n]) => ({ name: name as string, country: "AU", lat: -30, lon: 140, n: n as number }))
  const ca = [{ name: "Vancouver", country: "CA", lat: 49, lon: -123, n: 3 }]
  const out = bundle([...au, ...ca])
  assert.equal(out.length, 2)
  const b = out.find((x) => x.country === "AU")!
  assert.deepEqual([b.bundled, b.n, b.label], [true, 12, "Australia · 12 households"])
  assert.deepEqual(out.find((x) => x.country === "CA")!.label, "Vancouver")
})
