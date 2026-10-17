import { test, expect } from "@playwright/test"

// The top bar (docs/quality.md): あ / A, music and the sun or moon live in it on every screen, never in the letter;
// it never hides on scroll, and the only change once the page scrolls is a hairline under it.
test("the switches sit in the top bar, which stays put on every scroll", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample")
  const bar = page.locator(".site-bar")
  await expect(bar.locator(".mode-switches")).toBeVisible()
  await expect(page.locator("#letter .mode-switches, #letter .utility-btn[aria-pressed]")).toHaveCount(0)
  const hairline = () => bar.evaluate((e) => getComputedStyle(e, "::before").boxShadow)
  const still = await hairline()
  for (const y of [600, 1400, 900, 200]) {
    await page.evaluate((to) => scrollTo({ top: to, behavior: "instant" }), y)
    await page.waitForTimeout(250)
    const r = await bar.boundingBox()
    expect(r?.y).toBe(0)
    await expect(bar).toBeVisible()
  }
  expect(await hairline()).not.toBe(still)
})
