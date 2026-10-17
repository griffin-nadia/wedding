import { test, expect, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

// Every page at 390 and 1440 (the two projects), in Light and Lantern: a screenshot and an axe pass (WCAG 2.2 AA).
const PAGES = [["home", ""], ["the-day", "the-day"], ["travel", "travel"], ["faqs", "faqs"], ["our-story", "our-story"]] as const

async function open(page: Page, path: string, theme: string) {
  // A fixed moment, so the countdown, the Kyoto time and the season never change a screenshot
  await page.clock.setFixedTime(new Date("2026-10-17T02:00:00Z"))
  await page.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-theme", t); localStorage.setItem("ng-music", "off") }, theme)
  await page.goto(`${path}?h=sample`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState("networkidle")
}

for (const theme of ["light", "lantern"]) for (const [name, path] of PAGES) {
  test(`${name} (${theme})`, async ({ page }) => {
    await open(page, path, theme)
    await expect(page).toHaveScreenshot(`${name}-${theme}.png`, { fullPage: true })
    // @axe-core/playwright ships its own copy of the Page type; the page is the same object
    const axe = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
  })
}

// 18e: the countdown's new digit rolls in at its full size (the 3D flip used to shrink it to a sliver mid-turn)
test("the countdown digit never shrinks while it rolls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("?h=sample")
  const secs = page.locator(".count-box-num").last()
  await expect(secs).toBeVisible()
  const full = (await secs.boundingBox())!.height
  const heights: number[] = []
  await page.waitForFunction(() => document.querySelector(".count-box:last-child .count-flip"), null, { timeout: 3000 })
  for (let i = 0; i < 8; i++) { heights.push((await page.locator(".count-box-num").last().boundingBox())!.height); await page.waitForTimeout(25) }
  expect(Math.min(...heights)).toBeGreaterThan(full * 0.95)
})
