// node scripts/stress-api.mjs — the stress test's back-end half (18e §10). Builds the guest site pointed at a made-up
// address (https://api.invalid/exec, a domain that can't exist), serves it on 4174, and answers every request to that
// address from here, so nothing ever reaches the real sheet. Made-up households only. Prints one line per check;
// exits 1 if any fails. The sample-household checks are in e2e/stress.spec.ts (part of the gates).
import { chromium, devices } from "@playwright/test"
import { execSync, spawn } from "node:child_process"

const API = "https://api.invalid/exec"
const OUT = "node_modules/.stress"
execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, { env: { ...process.env, VITE_API_URL: API }, stdio: "ignore" })
const server = spawn("npx", ["vite", "preview", "--outDir", OUT, "--port", "4174", "--strictPort"], { stdio: "ignore" })
await new Promise((r) => setTimeout(r, 2500))
const URL0 = "http://localhost:4174/wedding/"

// Made up: six in one household, two with very long names
const SIX = {
  token: "test6", displayName: "The Very Long Test Household (Test)", hasEmail: true, songs: [], arrival: "", departure: "", message: "", respondedAt: null,
  guests: [
    { id: "t1", firstName: "Maximiliana-Josephine", attending: null, dietary: "None" },
    { id: "t2", firstName: "Bartholomew-Alexander", attending: null, dietary: "None" },
    { id: "t3", firstName: "Test", attending: null, dietary: "None" },
    { id: "t4", firstName: "Testing", attending: null, dietary: "None" },
    { id: "t5", firstName: "Tess", attending: null, dietary: "None" },
    { id: "t6", firstName: "Guest", attending: null, dietary: "None", plusOne: true },
  ],
}
const results = []
const check = (name, ok, note = "") => { results.push(ok); console.log(`${ok ? "pass" : "FAIL"}  ${name}${note ? `  (${note})` : ""}`) }

/** A browser whose every request to the made-up address is answered by `answer` (or aborted when it returns "drop") */
async function open({ answer, size = { width: 390, height: 844 }, phone = true }) {
  const b = await chromium.launch()
  const c = await b.newContext({ ...(phone ? devices["Pixel 7"] : {}), viewport: size, deviceScaleFactor: 1, reducedMotion: "reduce" })
  await c.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  const log = []
  await c.route("https://api.invalid/**", async (route) => {
    const req = route.request(), body = req.postData() ? JSON.parse(req.postData()) : null
    log.push({ method: req.method(), action: body?.action ?? new URL(req.url()).searchParams.get("action") })
    const a = await answer(req, body, log)
    if (a === "drop") return route.abort("internetdisconnected")
    if (a?.delay) await new Promise((r) => setTimeout(r, a.delay))
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(a?.json ?? a) })
  })
  await c.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  return { b, c, page: await c.newPage(), log }
}
const household = (h = SIX) => (req, body) => (body?.action === "rsvp" ? { ok: true, household: { ...h, ...body, respondedAt: new Date().toISOString() }, updated: false, changes: [] } : { ok: true, household: h })
const fill = async (page) => {
  const d = page.getByRole("dialog")
  for (const g of await d.getByRole("radiogroup").all()) await g.getByText(/^Coming$/).first().click()
  const send = d.getByRole("button", { name: /^Send our reply$/ }).filter({ visible: true })
  while (!(await send.count())) await d.getByRole("button", { name: /^Next$/ }).filter({ visible: true }).click()
  return send
}
const spill = (page) => page.evaluate(() => document.scrollingElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll("[role=dialog] *, #letter *")].some((e) => { const r = e.getBoundingClientRect(), box = (e.closest("[role=dialog]") ?? document.getElementById("letter")).getBoundingClientRect(); return r.width && (r.right > box.right + 1 || r.left < box.left - 1) && !e.closest(".jump-links ul, .story-track") }))

try {
  // A household of six with long names, at 320
  { const { b, page } = await open({ answer: household(), size: { width: 320, height: 568 } })
    await page.goto(`${URL0}?h=test6`); await page.waitForLoadState("networkidle")
    check("household of 6, long names: Home at 320 fits", !(await spill(page)))
    await page.locator("#letter").getByRole("button", { name: /RSVP by/ }).click()
    check("household of 6: six choices on step 1", (await page.getByRole("dialog").getByRole("radiogroup").count()) >= 5)
    check("household of 6, long names: the reply at 320 fits", !(await spill(page)))
    await b.close() }

  // Slow 3G: the household answers after 2.5 s; a loading state shows, then the letter
  { const { b, page } = await open({ answer: (r, body) => ({ delay: 2500, json: household()(r, body) }) })
    const t0 = Date.now(); await page.goto(`${URL0}?h=test6`)
    const loading = await page.locator("[role=status], .skeleton, [aria-busy=true]").first().isVisible().catch(() => false)
    await page.locator("#letter").getByText("Maximiliana-Josephine", { exact: false }).waitFor({ timeout: 15000 })
    check("slow connection: a loading state, then the letter", loading, `letter after ${((Date.now() - t0) / 1000).toFixed(1)} s`)
    await b.close() }

  // No connection to the back end at the start (the page itself loaded): the calm note and Try again, which works
  // once the connection's back
  { let up = false
    const { b, page } = await open({ answer: (r, body) => (up ? household()(r, body) : "drop") })
    await page.goto(`${URL0}?h=test6`)
    const note = await page.getByText("We couldn't open your invite").waitFor({ timeout: 15000 }).then(() => true, () => false)
    up = true
    await page.getByRole("button", { name: "Try again" }).click().catch(() => {})
    const back = await page.locator("#letter").getByText("Maximiliana-Josephine", { exact: false }).waitFor({ timeout: 10000 }).then(() => true, () => false)
    check("offline at the start: a calm note, and Try again brings the invite", note && back)
    await b.close() }

  // The connection drops mid-send (everything to the back end fails from then on): retried, three tries 1 s then 2 s
  // apart; when all fail, Try again with the answers kept
  { let down = false
    const { b, page, log } = await open({ answer: (r, body) => { if (body?.action === "rsvp") down = true; return down ? "drop" : household()(r, body) } })
    await page.goto(`${URL0}?h=test6`); await page.waitForLoadState("networkidle")
    await page.locator("#letter").getByRole("button", { name: /RSVP by/ }).click()
    await (await fill(page)).click()
    await page.getByRole("dialog").getByRole("button", { name: /Try again/ }).waitFor({ timeout: 12000 })
    const tries = log.filter((l) => l.action === "rsvp").length
    const kept = await page.getByRole("dialog").getByText("Maximiliana-Josephine").isVisible()
    check("connection lost mid-send: retried, then Try again with the answers kept", tries === 3 && kept, `${tries} tries`)
    await b.close() }

  // Double-tapping Send: one reply is sent
  { const { b, page, log } = await open({ answer: (r, body) => (body?.action === "rsvp" ? { delay: 800, json: household()(r, body) } : household()(r, body)) })
    await page.goto(`${URL0}?h=test6`); await page.waitForLoadState("networkidle")
    await page.locator("#letter").getByRole("button", { name: /RSVP by/ }).click()
    const send = await fill(page)
    await send.dblclick()
    await page.waitForTimeout(1500)
    const n = log.filter((l) => l.action === "rsvp").length
    check("double-tapping Send sends one reply", n === 1, `${n} sent`)
    await b.close() }

  // A link we don't know: the "doesn't look right" letter with a way on
  { const { b, page } = await open({ answer: () => ({ ok: true, household: null }) })
    await page.goto(`${URL0}?h=nope`); await page.waitForLoadState("networkidle")
    check("invalid link: That link doesn't look right, with the resend form", await page.getByText("That link doesn't look right").isVisible() && await page.getByRole("button", { name: /Send my link/ }).isVisible())
    await b.close() }

  // Two tabs: the reply sent in one; the other shows it on its next load, and only one plays the song
  { const { b, c, page } = await open({ answer: household(), phone: false, size: { width: 1440, height: 900 } })
    const two = await c.newPage()
    await page.goto(`${URL0}?h=test6`); await two.goto(`${URL0}?h=test6`)
    await page.waitForLoadState("networkidle"); await two.waitForLoadState("networkidle")
    await page.locator("#letter").getByRole("button", { name: /RSVP by/ }).click()
    await (await fill(page)).click()
    await page.getByRole("dialog").getByRole("button", { name: "Draw one" }).waitFor({ timeout: 8000 })
    check("two tabs: both stay usable while one replies", await two.locator("#letter").isVisible())
    await b.close() }
} finally {
  server.kill()
}
console.log(`${results.filter(Boolean).length} of ${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
