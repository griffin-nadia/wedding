// Lag check (run 19): a Pixel 7 sized phone with a 4x slower CPU, motion on. For each interaction it counts long
// tasks (over 50 ms) and dropped frames (frame gaps beyond one 60 Hz frame) while it plays, and saves a Chrome
// performance trace of the whole run. Needs a build served first, e.g.
//   npx vite preview --port 4308 --strictPort &   then   node scripts/perf-trace.mjs 4308 [runs] [trace.json]
import { chromium, devices } from "@playwright/test"

const port = Number(process.argv[2] ?? 4173), runs = Number(process.argv[3] ?? 3), tracePath = process.argv[4]
const base = `http://localhost:${port}/wedding/`

const watch = () => {
  const w = window, s = { long: [], frames: [] }
  w.__lag = s
  new PerformanceObserver((l) => { for (const e of l.getEntries()) s.long.push([e.startTime, e.duration]) }).observe({ type: "longtask" })
  const tick = (t) => { s.frames.push(t); requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
}
const read = (page, from, to) => page.evaluate(([a, b]) => {
  const s = window.__lag, long = s.long.filter(([t]) => t >= a && t <= b).map(([, d]) => d)
  const f = s.frames.filter((t) => t >= a && t <= b)
  let dropped = 0
  for (let i = 1; i < f.length; i++) dropped += Math.max(0, Math.round((f[i] - f[i - 1]) / (1000 / 60)) - 1)
  return { long: long.length, longest: Math.round(Math.max(0, ...long)), dropped }
}, [from, to])

// Main-thread work in the window too (Chrome's own counters): task time, layouts and style recalcs
let cdpNow
const metrics = async () => Object.fromEntries((await cdpNow.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]))
async function measure(page, ms, act) {
  await page.waitForTimeout(600)
  const m0 = await metrics(), from = await page.evaluate(() => performance.now())
  await act()
  await page.waitForTimeout(ms)
  const r = await read(page, from, await page.evaluate(() => performance.now())), m1 = await metrics()
  return { ...r, task: Math.round((m1.TaskDuration - m0.TaskDuration) * 1000), layouts: m1.LayoutCount - m0.LayoutCount, styles: m1.RecalcStyleCount - m0.RecalcStyleCount }
}

async function session(browser, opened) {
  const context = await browser.newContext({ ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: "no-preference" })
  await context.addInitScript((o) => { localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", "autumn"); if (o) localStorage.setItem("ng-opened", "1"); else localStorage.removeItem("ng-opened") }, opened)
  await context.addInitScript(watch)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
  await cdp.send("Performance.enable")
  cdpNow = cdp
  return { context, page, cdp }
}
const go = async (page, path) => { await page.goto(`${base}${path}?h=sample`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800) }

const results = {}
const add = (k, r) => (results[k] ??= []).push(r)
const browser = await chromium.launch({ args: ["--hide-scrollbars"] })
for (let run = 0; run < runs; run++) {
  // The envelope, on a first visit
  {
    const { context, page } = await session(browser, false)
    if (tracePath && run === 0) await browser.startTracing(page, { path: tracePath, screenshots: false })
    await go(page, "")
    await page.getByRole("button", { name: "Open", exact: true }).waitFor()
    add("envelope open", await measure(page, 3200, () => page.getByRole("button", { name: "Open", exact: true }).click()))
    if (tracePath && run === 0) await browser.stopTracing()
    await context.close()
  }
  const { context, page, cdp } = await session(browser, true)
  await go(page, "")
  add("page change", await measure(page, 1200, () => page.locator(".site-nav a").nth(1).click()))
  add("page change", await measure(page, 1200, () => page.locator(".site-nav a").nth(2).click()))
  await go(page, "")
  add("theme switch", await measure(page, 1400, () => page.locator(".site-bar .mode-switches > button:last-child").click()))
  add("theme switch", await measure(page, 1400, () => page.locator(".site-bar .mode-switches > button:last-child").click()))
  await go(page, "")
  add("open a sheet", await measure(page, 1200, () => page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()))
  await go(page, "faqs")
  const q = page.locator("#letter [data-slot=accordion-trigger]")
  add("accordion", await measure(page, 900, () => q.nth(0).click()))
  add("accordion", await measure(page, 900, () => q.nth(1).click()))
  await go(page, "our-story")
  const box = (await page.locator(".story-track").boundingBox()), y = box.y + box.height / 2
  const touch = (type, x) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: x === undefined ? [] : [{ x, y }] })
  const swipe = async () => { await touch("touchStart", box.x + box.width * 0.8); for (let i = 1; i <= 10; i++) { await touch("touchMove", box.x + box.width * (0.8 - i * 0.06)); await page.waitForTimeout(16) } await touch("touchEnd") }
  add("story swipe", await measure(page, 1200, swipe))
  add("story swipe", await measure(page, 1200, swipe))
  await context.close()
}
await browser.close()

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
console.log("interaction      | n  | long tasks >50ms | longest ms | dropped frames (median / max) | main-thread ms | layouts | style recalcs (medians)")
for (const [k, rs] of Object.entries(results)) console.log([k.padEnd(16), String(rs.length).padEnd(2), med(rs.map((r) => r.long)), Math.max(...rs.map((r) => r.longest)), `${med(rs.map((r) => r.dropped))} / ${Math.max(...rs.map((r) => r.dropped))}`, med(rs.map((r) => r.task)), med(rs.map((r) => r.layouts)), med(rs.map((r) => r.styles))].join(" | "))
