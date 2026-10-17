// "Where are you flying from?" (18f): suburbs, short names and typos find the city; the sheet only gets its bucket.
import { test } from "node:test"
import assert from "node:assert/strict"
import { bucketOf, findPlaces, placeOf, pointOf } from "../src/lib/places.ts"

const first = (q: string) => findPlaces(q)[0]?.name
test("suburbs, short names and typos resolve to the city", () => {
  for (const q of ["North Melbourne", "Noeth Melbourne", "Noeth Melb", "Brunswick", "melb", "Melborne", "fitzroy", "St Kilda"]) assert.equal(first(q), "Melbourne", q)
  assert.equal(first("Bondi"), "Sydney")
  assert.equal(first("Brisbne"), "Brisbane")
  assert.equal(first("Surfers Paradise"), "Gold Coast")
  assert.equal(first("North Melbourne, VIC 3051"), "Melbourne")
  assert.equal(first("tokyo"), "Tokyo")
  assert.equal(first("メルボルン"), "Melbourne")
})
test("unlisted Australian towns go by state, postcode, or Australia", () => {
  assert.equal(first("Wagga Wagga NSW"), "Sydney")
  assert.equal(first("Mildura 3500"), "Melbourne")
  assert.equal(first("somewhere in Australia"), "Australia")
  assert.deepEqual(findPlaces("zzzz"), []) // nothing: the field keeps the last real choice
})
test("the sheet gets its fixed list only", () => {
  assert.equal(bucketOf(placeOf("Gold Coast")!), "Brisbane")
  assert.equal(bucketOf(placeOf("Hobart")!), "Melbourne")
  assert.equal(bucketOf(placeOf("Canberra")!), "Sydney")
  assert.equal(bucketOf(placeOf("Australia")!), "Elsewhere in Australia")
  assert.equal(bucketOf(placeOf("Vancouver")!), "Canada")
  assert.equal(bucketOf(placeOf("Osaka")!), "Already in Japan")
  assert.equal(bucketOf(placeOf("London")!), "Somewhere else")
  assert.equal(placeOf("Elsewhere in Australia")?.name, "Australia") // an older answer on this device
})
test("every place is on the map, inside it", () => {
  for (const q of ["Kyoto", "Brisbane", "Perth", "Auckland", "Halifax", "Vancouver", "London", "Honolulu"]) {
    const [x, y] = pointOf(placeOf(q)!)
    assert.ok(x >= 0 && x <= 400 && y >= 0 && y <= 320, `${q} ${x},${y}`)
  }
  assert.deepEqual(pointOf(placeOf("Kyoto")!), [132, 112])
})
