// While Google has the reply script locked (five days in October 2026), guests should get the calm
// "Replies are paused" line, not an error, and the site shouldn't keep retrying a script that's out for days.
import { test } from "node:test"
import assert from "node:assert/strict"
import { ApiError, call, isRetryable } from "../src/lib/call.ts"

const URL = "https://script.google.com/macros/s/x/exec"
const codeOf = async (p: Promise<unknown>) => { try { await p; return "ok" } catch (e) { return e instanceof ApiError ? e.code : "other" } }
function withFetch(fake: (input: string, init?: RequestInit) => Promise<Response>, run: () => Promise<void>) {
  const real = globalThis.fetch
  globalThis.fetch = fake as typeof fetch
  return run().finally(() => { globalThis.fetch = real })
}

test("Google's own page instead of our JSON means paused", () => withFetch(
  async () => new Response("<html>Sorry, unable to open the file at this time.</html>", { status: 200, headers: { "Content-Type": "text/html" } }),
  async () => assert.equal(await codeOf(call(`${URL}?action=household`)), "paused")))

test("a blocked request while Google still answers means paused", () => withFetch(
  async (_input, init) => { if (init?.mode === "no-cors") return new Response(null, { status: 200 }); throw new TypeError("Failed to fetch") },
  async () => assert.equal(await codeOf(call(`${URL}?action=household`)), "paused")))

test("no answer at all is still a connection problem", () => withFetch(
  async () => { throw new TypeError("Failed to fetch") },
  async () => assert.equal(await codeOf(call(URL, { method: "POST" })), "network")))

test("forbidden or gone means paused; a server error stays a server error", async () => {
  await withFetch(async () => new Response("", { status: 403 }), async () => assert.equal(await codeOf(call(URL)), "paused"))
  await withFetch(async () => new Response("", { status: 503 }), async () => assert.equal(await codeOf(call(URL)), "server"))
})

test("our JSON comes through untouched", () => withFetch(
  async () => Response.json({ ok: true, household: { token: "t" } }),
  async () => assert.deepEqual(await call(URL), { ok: true, household: { token: "t" } })))

test("a paused script isn't retried", () => {
  assert.equal(isRetryable("paused"), false)
  assert.equal(isRetryable("busy"), true)
})
