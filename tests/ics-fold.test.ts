// The calendar file's lines fold at 75 octets (RFC 5545), counting bytes, never splitting a character.
import { test } from "node:test"
import assert from "node:assert/strict"
import { fold } from "../src/lib/ics-fold.ts"

test("short lines stay as they are", () => assert.equal(fold("SUMMARY:Griffin & Nadia"), "SUMMARY:Griffin & Nadia"))
test("long lines fold at 75 octets and unfold back to the same text", () => {
  for (const line of ["DESCRIPTION:" + "x".repeat(200), "LOCATION:京都市東山区八坂上町366 ザ・ソウドウ東山 京都 ".repeat(3)]) {
    const parts = fold(line).split("\r\n")
    for (const p of parts) assert.ok(new TextEncoder().encode(p).length <= 75, p)
    assert.equal(parts.map((p, i) => (i ? p.slice(1) : p)).join(""), line)
    assert.ok(parts.slice(1).every((p) => p.startsWith(" ")))
  }
})
