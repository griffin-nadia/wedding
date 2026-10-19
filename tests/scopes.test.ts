// Run 20 (the 19 Oct 2026 outage): the Apps Script's declared scopes match what its code calls, so a push can't need
// a scope the wedding account hasn't approved without this failing first
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { check } from "../scripts/scopes-check.mjs"

const code = fs.readFileSync("apps-script/Code.gs", "utf8"), manifest = JSON.parse(fs.readFileSync("apps-script/appsscript.json", "utf8"))

test("the manifest declares exactly the scopes Code.gs needs", () => {
  assert.deepEqual(check(code, manifest), { missing: [], unused: [], unknown: [] })
})
test("a push that calls a new service fails with that scope", () => {
  assert.deepEqual(check(code + "\nGmailApp.search('x')", manifest).missing, ["https://www.googleapis.com/auth/gmail.modify"])
  assert.deepEqual(check(code + "\nYouTubeService.x()", manifest).unknown, ["YouTubeService"])
})
