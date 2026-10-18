// Final run: Ask us on the back end keeps bots, floods and long questions out before anything is saved
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"

const ctx: Record<string, unknown> = {}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__x = { ask_ }", ctx)
const ask = (ctx.__x as { ask_: (b: unknown) => { ok: boolean; code?: string } }).ask_
test("a bot's hidden field: yes, and nothing kept", () => assert.deepEqual({ ...ask({ website: "http://spam", question: "hi" }) }, { ok: true }))
test("empty or over 500 characters is refused", () => {
  assert.equal(ask({ question: "  " }).code, "bad_request")
  assert.equal(ask({ question: "x".repeat(501) }).code, "bad_request")
})
test("no invite needs a name and a real email", () => {
  assert.equal(ask({ question: "Where?", name: "", email: "a@b.co" }).code, "bad_email")
  assert.equal(ask({ question: "Where?", name: "Sam", email: "nope" }).code, "bad_email")
})
