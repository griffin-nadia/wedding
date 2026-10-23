import { test, expect } from "@playwright/test"

// Run 26: the paper is a sheet exported ahead (scripts/paper-export.mjs), the size this screen shows it, asked for from
// the first paint and laid over the cards and sheets once it has decoded, keeping text AA on its darkest spot. On a
// first visit a plain veil covers the page until it's in (1.5 s at most once shown); not again once it's been seen. Reduced
// motion: the same paper and veil, nothing fades. Save-Data: plain paper, nothing fetched. (Automated browsers skip it
// unless a test asks, ng-paper=on, as these do.)
test.use({ reducedMotion: "no-preference" })
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-paper", "on") }) })

for (const theme of ["autumn", "lantern"] as const) test(`the sheet for this screen is laid over the card, keeping text AA, the veil goes (${theme})`, async ({ page }, info) => {
  await page.addInitScript((t) => localStorage.setItem("ng-theme", t), theme)
  await page.goto("?h=sample")
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-paper"), null, { timeout: 10_000 })
  await expect(page.locator("#paper-veil")).toHaveCount(0)
  await page.waitForTimeout(600) // the 400 ms fade
  const r = await page.evaluate(() => {
    const a = getComputedStyle(document.querySelector("#letter")!, "::after")
    return { opacity: parseFloat(a.opacity), on: parseFloat(document.documentElement.style.getPropertyValue("--paper-on")), image: a.backgroundImage, blend: a.mixBlendMode, canvases: document.querySelectorAll("canvas").length }
  })
  expect(r.image).toContain(`/paper/paper-${theme}-${info.project.name === "phone" ? "p800" : "l1600"}.avif`)
  expect(r.blend).toBe(theme === "lantern" ? "screen" : "multiply")
  expect(r.opacity).toBeCloseTo(r.on, 2)
  expect(r.on).toBeGreaterThan(0)
  expect(r.canvases).toBe(0) // no WebGL any more
  // Seen once: no veil the next time
  await page.reload()
  expect(await page.evaluate(() => document.getElementById("paper-veil"))).toBeNull()
})

test("first visit: the veil covers the page until the sheet is in, never past 1.5 s", async ({ page }) => {
  // The sheet held back, so the cap is what takes the veil away
  await page.route(/\/paper\/.*\.avif$/, async (r) => { await new Promise((res) => setTimeout(res, 4000)); await r.continue() })
  await page.goto("?h=sample", { waitUntil: "commit" }) // the load event waits for the held sheet
  const veil = page.locator("#paper-veil")
  await expect(veil).toBeVisible()
  await expect(veil).toHaveCount(0, { timeout: 2500 })
})

test("reduced motion: the same paper, nothing fades; Save-Data: plain, nothing fetched", async ({ browser }) => {
  for (const opts of [{ reducedMotion: "reduce" as const }, {}]) {
    const c = await browser.newContext(opts)
    const save = !("reducedMotion" in opts)
    if (save) await c.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }))
    await c.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-paper", "on") })
    const p = await c.newPage(), sheets: string[] = []
    p.on("request", (r) => { if (/\/paper\//.test(r.url())) sheets.push(r.url()) })
    await p.goto("?h=sample")
    await p.waitForTimeout(3000)
    expect(await p.evaluate(() => document.documentElement.hasAttribute("data-paper"))).toBe(!save)
    expect(sheets.length > 0).toBe(!save)
    if (!save) expect(parseFloat(await p.evaluate(() => getComputedStyle(document.querySelector("#letter")!, "::after").transitionDuration))).toBeLessThan(0.01)
    await c.close()
  }
})
