// node scripts/lab-perf.mjs [--only id,id] [--loading] [--trace dir]: the lab's performance badges, local only.
// Needs `npm run build && npm run build:lab` first (it measures the built bundles, not the dev server). Serves dist
// gzipped, as GitHub Pages does, and opens each experiment (every take) on a throttled phone: the Pixel 7 profile,
// CPU 4x slower and Lighthouse's mobile network (1.6 Mbps down, 150 ms round trip). For each it records:
// - fps: frames per second over 3 s of the experiment's own motion (its interaction below), capped at 60
// - long tasks: tasks over 50 ms during that motion (and, separately, while it loads)
// - kb: the extra JavaScript it loads on demand, gzipped, beyond the lab's own frame
// Writes src/lab/perf.json (the cards' badges). --loading also measures the loading-screen idea against the guest
// site's own build: the time to the sealed envelope, cold and with the arrival's art preloaded, the globe's stall
// with and without the idle warm, and a repeat visit. --trace dir saves a Chromium trace of the globe drag there.
import { chromium, devices } from "@playwright/test"
import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import zlib from "node:zlib"

const args = process.argv.slice(2)
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null
const traceDir = args.includes("--trace") ? args[args.indexOf("--trace") + 1] : null
if (!fs.existsSync("dist/lab/lab.html")) { console.error("Build first: npm run build && npm run build:lab"); process.exit(1) }

// A static server for dist at /wedding/, gzipping text as Pages does; unknown guest routes get 404.html (the SPA)
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".mp3": "audio/mpeg", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon", ".txt": "text/plain" }
const gz = new Map()
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (!u.startsWith("/wedding/")) { res.statusCode = 404; return res.end() }
  let f = path.join("dist", u.slice("/wedding/".length))
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html")
  if (!fs.existsSync(f)) f = "dist/404.html"
  const ext = path.extname(f), type = TYPES[ext] ?? "application/octet-stream"
  res.setHeader("Content-Type", type)
  res.setHeader("Cache-Control", u.includes("/assets/") ? "public, max-age=31536000, immutable" : "max-age=600")
  if (/text|javascript|json|svg|manifest/.test(type) && /gzip/.test(req.headers["accept-encoding"] ?? "")) {
    if (!gz.has(f)) gz.set(f, zlib.gzipSync(fs.readFileSync(f), { level: 9 }))
    res.setHeader("Content-Encoding", "gzip"); return res.end(gz.get(f))
  }
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(4175, r))
const BASE = "http://localhost:4175/wedding/"
const PROFILE = "Pixel 7, CPU 4x slower, 1.6 Mbps / 150 ms"

const browser = await chromium.launch()
async function phone({ opened = true } = {}) {
  const ctx = await browser.newContext({ ...devices["Pixel 7"], reducedMotion: "no-preference" })
  await ctx.addInitScript(({ opened }) => {
    try { localStorage.setItem("ng-music", "off"); if (opened) localStorage.setItem("ng-opened", "1"); else localStorage.removeItem("ng-opened") } catch { /* fine */ }
    window.__long = []; window.__frames = []; window.__rec = false
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push({ at: e.startTime, d: e.duration }) }).observe({ type: "longtask", buffered: true })
    const tick = (t) => { if (window.__rec) window.__frames.push(t); requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }, { opened })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
  await cdp.send("Network.enable")
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  return { ctx, page }
}
const gzKB = (urls) => Math.round(urls.reduce((s, u) => {
  const f = path.join("dist", new URL(u).pathname.slice("/wedding/".length))
  return s + (fs.existsSync(f) ? zlib.gzipSync(fs.readFileSync(f)).length : 0)
}, 0) / 1024)
const scripts = (page) => page.evaluate(() => performance.getEntriesByType("resource").filter((e) => /\.js(\?|$)/.test(e.name)).map((e) => e.name))

// What each experiment does while it's measured (its own motion); the rest just play on arrival
const ACT = {
  "opening-letter-out": async (p) => { await p.getByRole("button", { name: /Open your invit/ }).click() },
  "opening-seal-reverse": async (p) => { await p.getByRole("button", { name: "Seal it again" }).click() },
  "confirm-stamp": async (p) => { await p.getByRole("button", { name: "Stamp again" }).click() },
  "story-prints": async (p) => { const b = p.locator(".x-sp-print"); for (const i of [0, 1, 2]) { await b.nth(i).click(); await p.waitForTimeout(300) } },
  "story-stack": async (p) => { await p.mouse.move(195, 420); await p.mouse.down(); await p.mouse.move(360, 380, { steps: 20 }); await p.mouse.up() },
  "story-canvas": async (p) => { await p.mouse.move(200, 420); await p.mouse.down(); await p.mouse.move(60, 300, { steps: 20 }); await p.mouse.up() },
  "journey-globe-styles": async (p) => { const c = await p.locator(".x-gs canvas").boundingBox(); const y = c.y + c.height / 2; await p.mouse.move(c.x + c.width * 0.8, y); await p.mouse.down(); await p.mouse.move(c.x + c.width * 0.2, y + 10, { steps: 24 }); await p.mouse.up() },
  "paper-light": async (p, take) => { if (take === "sweep") await p.getByRole("button", { name: /Change to/ }).click() },
  "micro-motion": async (p) => { await p.getByRole("button", { name: "Play all" }).click() },
}
const READY = { "journey-globe-styles": ".x-gs canvas", "journey-flat-painted": ".x-fp svg", "micro-paper": ".x-pp-swatch" }

async function measure(id, take, o = {}) {
  const { ctx, page } = await phone()
  const url = o.url ?? `${BASE}lab/lab-play.html?x=${id}${take ? `&take=${take}` : ""}`
  await page.goto(url, { waitUntil: "load" })
  if (o.before) await o.before(page)
  if (o.ready ?? READY[id]) await page.locator(o.ready ?? READY[id]).first().waitFor({ timeout: 60_000 })
  await page.waitForTimeout(1500)
  const loadLong = await page.evaluate(() => window.__long.filter((l) => l.d > 50).length)
  const tracing = traceDir && id === "journey-globe-styles"
  if (tracing) await browser.startTracing(page, { path: path.join(traceDir, `globe-${o.name ?? take}-drag.json`) })
  const t0 = await page.evaluate(() => { window.__rec = true; window.__frames = []; return performance.now() })
  await (o.act ?? ACT[id] ?? (async () => {}))(page, take)
  await page.waitForTimeout(3000)
  const r = await page.evaluate((t0) => {
    window.__rec = false
    const f = window.__frames, gaps = f.slice(1).map((t, i) => t - f[i]).sort((a, b) => a - b)
    const long = window.__long.filter((l) => l.at >= t0 && l.d > 50)
    return { fps: f.length > 1 ? Math.min(60, Math.round(((f.length - 1) * 1000) / (f[f.length - 1] - f[0]))) : 0, p95: Math.round(gaps[Math.floor(gaps.length * 0.95)] ?? 0), longTasks: long.length, longestMs: Math.round(Math.max(0, ...long.map((l) => l.d))) }
  }, t0)
  if (tracing) await browser.stopTracing()
  const js = await scripts(page)
  await ctx.close()
  return { ...r, loadLong, js }
}

const out = { measured: new Date().toLocaleDateString("en-CA"), profile: PROFILE, entries: {} }
try { Object.assign(out.entries, JSON.parse(fs.readFileSync("src/lab/perf.json", "utf8")).entries ?? {}) } catch { /* first run */ }
// The lab's own frame, with no experiment in it: its code isn't the experiment's
const shell = await (async () => { const { ctx, page } = await phone(); await page.goto(`${BASE}lab/lab-play.html?x=none`, { waitUntil: "load" }); await page.waitForTimeout(800); const js = await scripts(page); await ctx.close(); return new Set(js) })()
const { ctx: c0, page: p0 } = await phone()
await p0.goto(`${BASE}lab/lab.html`, { waitUntil: "load" })
const { entries } = await p0.evaluate(() => window.__labIndex)
await c0.close()
for (const e of entries) {
  if (only && !only.includes(e.id)) continue
  const takes = {}
  for (const t of e.takes ?? [null]) {
    const m = await measure(e.id, t)
    const kb = gzKB(m.js.filter((u) => !shell.has(u)))
    takes[t ?? "-"] = { fps: m.fps, p95: m.p95, longTasks: m.longTasks, longestMs: m.longestMs, loadLongTasks: m.loadLong, kb }
    console.log(`${e.id}${t ? ` (${t})` : ""}: ${m.fps} fps, p95 frame ${m.p95} ms, ${m.longTasks} long tasks${m.longTasks ? ` (longest ${m.longestMs} ms)` : ""}, ${m.loadLong} while loading, ${kb} KB`)
  }
  // The badge: the worst take, so nothing looks better than it is
  const all = Object.values(takes)
  out.entries[e.id] = { fps: Math.min(...all.map((x) => x.fps)), longTasks: Math.max(...all.map((x) => x.longTasks)), longestMs: Math.max(...all.map((x) => x.longestMs)), kb: Math.max(...all.map((x) => x.kb)), takes }
}

// Baselines, so a number means something: the site's own globe today (headless Chromium draws WebGL in software,
// so a globe's fps here is far below a real phone's GPU; only the comparison counts), and the sweep's theme change
// with the sweep off (what the theme change costs on its own)
const drag = (sel) => async (p) => { const c = await p.locator(sel).boundingBox(); const y = c.y + c.height / 2; await p.mouse.move(c.x + c.width * 0.8, y); await p.mouse.down(); await p.mouse.move(c.x + c.width * 0.2, y + 10, { steps: 24 }); await p.mouse.up() }
const BASELINES = [
  { name: "site-globe", id: "journey-globe-styles", url: `${BASE}our-story?h=sample`, ready: ".journey-globe canvas", act: drag(".journey-globe canvas"),
    before: async (p) => { const n = p.getByRole("button", { name: /next chapter/i }); await n.waitFor(); while (await n.isEnabled()) { await n.click(); await p.waitForTimeout(150) } } },
  { name: "sweep-off", id: "paper-light", take: "sweep", url: `${BASE}lab/lab-play.html?x=paper-light&take=sweep&k.sweep=0` },
]
out.baselines = {}
try { Object.assign(out.baselines, JSON.parse(fs.readFileSync("src/lab/perf.json", "utf8")).baselines ?? {}) } catch { /* first run */ }
for (const b of BASELINES) {
  if (only && !only.includes(b.id) && !only.includes(b.name)) continue
  const m = await measure(b.id, b.take ?? null, b)
  out.baselines[b.name] = { fps: m.fps, p95: m.p95, longTasks: m.longTasks, longestMs: m.longestMs, loadLongTasks: m.loadLong }
  console.log(`baseline ${b.name}: ${m.fps} fps, p95 frame ${m.p95} ms, ${m.longTasks} long tasks${m.longTasks ? ` (longest ${m.longestMs} ms)` : ""}`)
}

if (args.includes("--loading")) {
  // The guest site's own build: its chunks for the globe stop
  const assets = fs.readdirSync("dist/assets")
  const pick = (re) => assets.filter((f) => re.test(f)).map((f) => `${BASE}assets/${f}`)
  const globe = [...pick(/^journey-globe-.*\.js$/), ...pick(/^three\.module-.*\.js$/), ...pick(/^Line(2|Geometry|Material)-.*\.js$/), ...pick(/^paint-globe-.*\.js$/), ...pick(/^land-110m-.*\.js$/)]
  const arrivalArt = ["art/envelope/envelope-closed-820.avif", "art/envelope/envelope-open-back-820.avif", "art/envelope/envelope-open-front-820.avif", "art/names/names-mask-1040.webp", "art/names/amp-mask-1040.webp"]
  const run = async (preload, warm) => {
    const { ctx, page } = await phone({ opened: false })
    if (preload) await ctx.addInitScript((list) => {
      const add = () => { for (const [h, type] of list) { const l = document.createElement("link"); l.rel = "preload"; l.as = "image"; l.href = h; if (type) l.type = type; l.setAttribute("fetchpriority", "high"); document.head.appendChild(l) } }
      if (document.head) add(); else document.addEventListener("DOMContentLoaded", add, { once: true })
    }, arrivalArt.map((a) => [`/wedding/${a}`, a.endsWith(".avif") ? "image/avif" : null]))
    await page.goto(`${BASE}?h=sample`, { waitUntil: "commit" })
    const env = await page.waitForFunction(() => { const i = document.querySelector("img.envelope-drawn.is-closed"); return i && i.complete && i.naturalWidth > 0 ? Math.round(performance.now()) : false }, null, { polling: 50, timeout: 120_000 }).then((h) => h.jsonValue())
    await page.waitForLoadState("load"); await page.waitForTimeout(2000)
    if (warm) await page.evaluate(async (urls) => { await Promise.all(urls.map((u) => fetch(u, { priority: "low" }).then((r) => r.blob()))) }, globe)
    const stall = await page.evaluate(async (urls) => { const t = performance.now(); await Promise.all(urls.map((u) => import(u))); return Math.round(performance.now() - t) }, globe)
    // A second visit in the same browser (everything cached)
    await page.goto(`${BASE}?h=sample`, { waitUntil: "commit" })
    await page.evaluate(() => localStorage.removeItem("ng-opened"))
    await page.reload({ waitUntil: "commit" })
    const again = await page.waitForFunction(() => { const i = document.querySelector("img.envelope-drawn.is-closed"); return i && i.complete && i.naturalWidth > 0 ? Math.round(performance.now()) : false }, null, { polling: 50, timeout: 60_000 }).then((h) => h.jsonValue())
    await ctx.close()
    return { env, stall, again }
  }
  const rows = []
  for (const [label, preload, warm] of [["today", false, false], ["preload the arrival art", true, false], ["preload and idle warm", true, true]]) {
    const r = []; for (let i = 0; i < 3; i++) r.push(await run(preload, warm)) // three runs each, the median
    const med = (k) => r.map((x) => x[k]).sort((a, b) => a - b)[1]
    rows.push({ label, envelopeMs: med("env"), globeStallMs: med("stall"), repeatVisitMs: med("again") })
    console.log(`${label}: envelope at ${med("env")} ms, globe stop's code ${med("stall")} ms, repeat visit envelope at ${med("again")} ms`)
  }
  out.loading = { profile: PROFILE, globeKB: gzKB(globe), rows }
}
fs.writeFileSync("src/lab/perf.json", `${JSON.stringify(out, null, 1)}\n`)
await browser.close(); server.close()
console.log("wrote src/lab/perf.json")
