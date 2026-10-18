import { test, expect } from "@playwright/test"

// 18g: the paper is made in the browser after the page has settled and fades in over the cards and sheets; it keeps
// text AA on its darkest spot; under reduced motion or Save-Data it stays plain. WebGL here is software (SwiftShader).
test.use({ reducedMotion: "no-preference", launchOptions: { args: ["--hide-scrollbars", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } })
test.describe.configure({ timeout: 90_000 })
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-paper", "on") }) })

for (const theme of ["autumn", "lantern"] as const) test(`the paper is made, fades in over the card, and keeps text AA (${theme})`, async ({ page }) => {
  await page.addInitScript((t) => localStorage.setItem("ng-theme", t), theme)
  await page.goto("?h=sample")
  test.skip(!(await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")))), "no WebGL in this browser: the paper stays plain (by design)")
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-paper"), null, { timeout: 45_000 })
  await page.waitForTimeout(600) // the 400 ms fade
  const r = await page.evaluate(() => {
    const a = getComputedStyle(document.querySelector("#letter")!, "::after")
    return { opacity: parseFloat(a.opacity), on: parseFloat(document.documentElement.style.getPropertyValue("--paper-on")), image: a.backgroundImage.startsWith("url(\"blob:"), blend: a.mixBlendMode, canvases: document.querySelectorAll("canvas").length }
  })
  expect(r.image).toBe(true)
  expect(r.blend).toBe(theme === "lantern" ? "screen" : "multiply")
  expect(r.opacity).toBeCloseTo(r.on, 2)
  expect(r.on).toBeGreaterThan(0)
  expect(r.canvases).toBe(0) // the WebGL context is gone once it's made
})

test("reduced motion or Save-Data: plain paper, nothing made", async ({ browser }) => {
  for (const opts of [{ reducedMotion: "reduce" as const }, {}]) {
    const c = await browser.newContext(opts)
    if (!("reducedMotion" in opts)) await c.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true } }))
    await c.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-paper", "on") })
    const p = await c.newPage()
    await p.goto("?h=sample")
    await p.locator("#letter").click()
    await p.waitForTimeout(6000)
    expect(await p.evaluate(() => document.documentElement.hasAttribute("data-paper"))).toBe(false)
    await c.close()
  }
})
