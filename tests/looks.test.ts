// Run 27: the looks picker's list and the note Jehan gets
import { test } from "node:test"
import assert from "node:assert/strict"
import { DEFAULT_LOOK, GROUPS, LOOKS, pickMessage } from "../src/looks/looks.ts"

test("every look has a unique id and a known group, the default is Airmail, and every group has looks", () => {
  assert.equal(new Set(LOOKS.map((l) => l.id)).size, LOOKS.length)
  assert.ok(LOOKS.every((l) => GROUPS.includes(l.group)))
  assert.equal(LOOKS.find((l) => l.id === DEFAULT_LOOK)?.title, "Airmail")
  for (const g of GROUPS) assert.ok(LOOKS.some((l) => l.group === g), g)
  assert.equal(LOOKS.length, 21)
})

test("the pick note", () => {
  assert.equal(pickMessage({ title: "Airmail", land: 80, lines: 150, planes: 50, view: "map", time: "night" }), "Globe pick: Airmail, land 80%, lines 150%, planes 50%, map, night")
})
