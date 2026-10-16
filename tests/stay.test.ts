// Their stay picks follow the planner, links lose their tracking, and a failed or empty read keeps the built-in list.
import { test } from "node:test"
import assert from "node:assert/strict"
import { areasOf, cleanLink, pickList, type Picks } from "../src/lib/stay.ts"

const fallback: Picks = { note: "Compare other booking sites too. Prices change.", hotels: [{ name: "Built in", area: "Kyoto Station", price: "~$150 AUD", note: "", href: "https://example.com/" }], airbnbs: [] }

test("tracking comes off links, real parts stay", () => {
  assert.equal(cleanLink("https://www.kyotocenturyhotel.jp/?gad_source=1&gad_campaignid=2&gclid=Cj0"), "https://www.kyotocenturyhotel.jp/")
  assert.equal(cleanLink("https://all.accor.com/hotel/B4F4/index.en.shtml?utm_term=mar&gclid=x&lang=en"), "https://all.accor.com/hotel/B4F4/index.en.shtml?lang=en")
  assert.equal(cleanLink("https://www.airbnb.com.au/rooms/1?check_in=2027-10-14&adults=2&source_impression_id=p3"), "https://www.airbnb.com.au/rooms/1")
  assert.equal(cleanLink("javascript:alert(1)"), "")
  assert.equal(cleanLink("http://insecure.example"), "")
})

test("the planner's rows replace the built-in list", () => {
  const live = { ok: true, note: "Her note", hotels: [{ name: "Rinn", area: "Kiyomizu-Gojo", price: "from ~$150 AUD", note: "Closer to the venue", href: "https://rinn.example/?gclid=1" }], airbnbs: [{ area: "Sanjo", price: "~$660", sleeps: "9", href: "https://www.airbnb.com.au/rooms/9" }] }
  const p = pickList(live, fallback)
  assert.equal(p.note, "Her note")
  assert.equal(p.hotels[0].href, "https://rinn.example/")
  assert.equal(p.airbnbs[0].sleeps, "9")
  assert.deepEqual(areasOf(p), ["Kiyomizu-Gojo", "Sanjo"])
})

test("a failed, empty or odd answer keeps the built-in list", () => {
  assert.equal(pickList(null, fallback), fallback)
  assert.equal(pickList({ ok: false, code: "not_configured" }, fallback), fallback)
  assert.equal(pickList({ ok: true, hotels: [], airbnbs: [] }, fallback), fallback)
  assert.equal(pickList({ ok: true, hotels: [{ name: "No link" }], airbnbs: "nope" }, fallback), fallback)
})
