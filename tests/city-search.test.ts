// "Where are you flying from?" (final run): the GeoNames index, searched on this device
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { buildIndex, searchCities, cityLabel } from "../src/lib/city-search.ts"

const index = buildIndex(JSON.parse(fs.readFileSync("public/data/cities.json", "utf8")))
const top = (q: string) => { const r = searchCities(index, q); return r[0] ? cityLabel(r[0]) : "" }
const all = (q: string) => searchCities(index, q).map(cityLabel)

test("typos find the city", () => {
  assert.match(top("Melborne"), /^Melbourne, Victoria, Australia/)
  assert.match(top("Vancover"), /^Vancouver, British Columbia, Canada/)
  assert.match(top("Brisbne"), /^Brisbane, Queensland, Australia/)
})
test("suburbs and short names go to their city; Gold Coast stays itself", () => {
  for (const q of ["North Melbourne", "Brunswick", "Fitzroy", "Melb"]) assert.match(top(q), /^Melbourne, Victoria/, q)
  assert.match(top("Syd"), /^Sydney, New South Wales/)
  assert.match(top("Bris"), /^Brisbane, Queensland/)
  assert.match(top("Gold Coast"), /^Gold Coast, Queensland/)
})
test("accents and Japanese names", () => {
  assert.match(top("Montreal"), /^Montréal, Quebec, Canada/)
  assert.match(top("東京"), /^Tokyo, Tokyo, Japan/)
  assert.match(top("札幌"), /^Sapporo, Hokkaido, Japan/)
})
test("ambiguous names say where; a state alone suggests its capital and cities", () => {
  const v = all("Victoria")
  assert.ok(v.some((l) => l.startsWith("Victoria, British Columbia, Canada")), v.join(" / "))
  assert.ok(v.some((l) => l.startsWith("Melbourne, Victoria, Australia")), v.join(" / "))
  const l = all("London")
  assert.ok(l.some((x) => x === "London, England, United Kingdom") && l.some((x) => x.startsWith("London, Ontario, Canada")), l.join(" / "))
  assert.match(all("Queensland")[0], /^Brisbane, Queensland/)
  assert.match(all("British Columbia")[0], /^Victoria, British Columbia/)
})
test("ranking: exact first, then the likely countries, then population", () => {
  assert.match(top("Perth"), /^Perth, Western Australia, Australia/)
  assert.match(top("Richmond"), /, (Australia|Canada)$|Richmond, British Columbia/)
  assert.equal(searchCities(index, "m").length, 0) // two letters at least
})
test("fast enough to feel instant", () => {
  const t0 = performance.now()
  for (const q of ["Melborne", "Vancover", "Brisbne", "Toront", "Osak", "Christchur"]) searchCities(index, q)
  assert.ok((performance.now() - t0) / 6 < 100)
})
