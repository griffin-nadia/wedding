import { test, expect } from "@playwright/test"
import fs from "node:fs"
import zlib from "node:zlib"
import path from "node:path"

// Performance budget: initial JS under 150 kB gzipped, LCP under 2.5 s, and CLS 0 to two places (under 0.01) on
// every page. GitHub's runners are slower than a laptop under the same throttling, so CI allows LCP up to 2.8 s.
const LCP = process.env.CI ? 2800 : 2500
test("initial JS under 150 kB gzipped", async () => {
  const html = fs.readFileSync("dist/index.html", "utf8")
  const files = [...html.matchAll(/(?:src|href)="\/wedding\/(assets\/[^"]+\.js)"/g)].map((m) => m[1])
  const kb = files.reduce((n, f) => n + zlib.gzipSync(fs.readFileSync(path.join("dist", f))).length, 0) / 1024
  console.log(`initial JS ${kb.toFixed(1)} kB gzipped`)
  expect(kb).toBeLessThan(150)
})

for (const path of ["", "the-day", "travel", "faqs", "our-story"]) test(`${path || "home"}: LCP under ${LCP / 1000} s, CLS 0.00`, async ({ page }, info) => {
  await page.addInitScript(() => {
    localStorage.setItem("ng-opened", "1")
    const w = window as unknown as { __lcp: number; __cls: number }
    w.__lcp = 0; w.__cls = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__lcp = e.startTime }).observe({ type: "largest-contentful-paint" as never, buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) w.__cls += e.value }).observe({ type: "layout-shift" as never, buffered: true })
  })
  // A mid-range phone on 4G: 4× slower CPU, 1.6 Mbps down, 150 ms round trip (Chromium only)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
  await cdp.send("Network.enable")
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  await page.goto(`${path}?h=sample`)
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(2500)
  const { lcp, cls } = await page.evaluate(() => { const w = window as unknown as { __lcp: number; __cls: number }; return { lcp: w.__lcp, cls: w.__cls } })
  console.log(`${info.project.name} ${path || "home"}: LCP ${Math.round(lcp)} ms, CLS ${cls.toFixed(4)}`)
  expect(lcp).toBeLessThan(LCP)
  expect(cls).toBeLessThan(0.01)
})
