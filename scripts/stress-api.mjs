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
  // Run 20 (the 19 Oct 2026 outage): the back end answering with an error is our trouble, never "that link doesn't
  // look right", and a copy of the invite from the last 24 hours still shows; an older copy waits for the back end
  { const down = (req, body) => ({ ok: false, code: "read_failed", error: "We couldn't load that." })
    for (const [name, saved, line] of [["no saved copy", null, "We're having a little trouble"], ["a copy from an hour ago", 3600e3, "Dear "], ["a copy from two days ago", 48 * 3600e3, "We're having a little trouble"]]) {
      const { b, c, page } = await open({ answer: down })
      if (saved) await c.addInitScript(([h, at]) => { localStorage.setItem("ng-invite", h.token); localStorage.setItem("ng-household", JSON.stringify(h)); localStorage.setItem("ng-household-at", String(Date.now() - at)) }, [SIX, saved])
      await page.goto(`${URL0}?h=test6`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500)
      const shown = await page.getByText(line, { exact: false }).first().isVisible(), wrong = await page.getByText("That link doesn't look right").count()
      check(`the back end down, ${name}: ${line === "Dear " ? "the invite" : "\"a little trouble\""}`, shown && !wrong)
      await b.close()
    }
  }
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

  // Ask us (final run): one tap sends once; the sheet's "busy" (a few in a row) and a lost connection each get their
  // own calm line, the second with the wedding address to email instead
  for (const [name, answer, line] of [
    ["sends once and says so", (r, body) => (body?.action === "ask" ? { delay: 600, json: { ok: true } } : household()(r, body)), "Sent. We'll get back to you soon."],
    ["busy: try again in a little while", (r, body) => (body?.action === "ask" ? { ok: false, code: "busy" } : household()(r, body)), "That's a few questions in a row"],
    ["connection lost: try again, or email us", (r, body) => (body?.action === "ask" ? "drop" : household()(r, body)), "We couldn't send that just now"],
  ]) {
    const { b, page, log } = await open({ answer })
    await page.goto(`${URL0}faqs?h=test6`); await page.waitForLoadState("networkidle")
    await page.getByRole("button", { name: "Ask us", exact: true }).click()
    const d = page.getByRole("dialog")
    await d.getByLabel("Your question").fill("Is there a bus from the hotel to the venue?")
    await d.getByRole("button", { name: "Send" }).dblclick()
    const shown = await d.getByText(line, { exact: false }).waitFor({ timeout: 15000 }).then(() => true, () => false)
    const sent = log.filter((l) => l.action === "ask").length
    check(`Ask us: ${name}`, shown && (name.startsWith("connection") ? sent >= 1 : sent === 1), `${sent} sent`)
    await b.close()
  }

  // Can't find your invite (final run): the same neutral line whether the email is on the list or not, and only the
  // email goes to the back end
  for (const found of [true, false]) {
    let body0 = null
    const { b, page } = await open({ answer: (r, body) => { if (body?.action === "resend") { body0 = body; return found ? { ok: true } : { ok: true } } return { ok: true, household: null } } })
    await page.goto(`${URL0}?h=nope`); await page.waitForLoadState("networkidle")
    await page.getByLabel("Your email").fill(found ? "on-the-list@example.com" : "not-on-it@example.com")
    await page.getByRole("button", { name: /Send my link/ }).click()
    const neutral = await page.getByText("If that email's on our list, your link is on its way.", { exact: false }).waitFor({ timeout: 10000 }).then(() => true, () => false)
    check(`can't find your invite: the neutral line (${found ? "on the list" : "not on it"})`, neutral && body0 && Object.keys(body0).sort().join() === "action,email")
    await b.close()
  }

  // Journeys at full size (final run): 99 made-up cities (under 100 guests in all) on Our story's last stop, flat map
  // and globe: each shows and fits at 320
  { const cities = Array.from({ length: 99 }, (_, i) => ({ name: `Test city ${i + 1}`, country: "AU", lat: -40 + (i % 30), lon: 110 + i * 0.4, n: 1 }))
    const answer = (r, body) => (new URL(r.url()).searchParams.get("action") === "journeys" ? { ok: true, cities } : household()(r, body))
    for (const mode of ["flat", "globe"]) {
      const { b, c, page } = await open({ answer, size: { width: 320, height: 640 } })
      await c.addInitScript((m) => localStorage.setItem("ng-map", m), mode)
      await page.goto(`${URL0}our-story?h=test6`); await page.waitForLoadState("networkidle")
      const next = page.getByRole("button", { name: /next chapter/i })
      while (await next.isEnabled()) { await next.click(); await page.waitForTimeout(150) }
      await page.waitForTimeout(1500)
      const ok = mode === "flat" ? (await page.locator(".story-slide-map .journey-flat").isVisible()) : await page.locator(".journey-globe").isVisible()
      check(`journeys: 99 cities, ${mode === "flat" ? "the flat map" : "the globe"} at 320`, ok && !(await spill(page)))
      await b.close()
    }
  }
} finally {
  server.kill()
}
console.log(`${results.filter(Boolean).length} of ${results.length} passed`)
process.exit(results.every(Boolean) ? 0 : 1)
