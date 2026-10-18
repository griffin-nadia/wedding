import { test, expect } from "@playwright/test"

// Run 19, one layout: on laptops every page's card and every sheet is the same width, --letter-width, at 1024, 1280,
// 1440 and 1920; and opening FAQs never changes the card's width (at 900 it used to grow to fit the open answer).
test("every card and sheet is the same width, and an open FAQ never moves it", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "laptops")
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  const width = (sel: string) => page.locator(sel).first().evaluate((e) => Math.round(e.getBoundingClientRect().width))
  // Each page once, then every width (the layout is CSS, so a resize is the same as a fresh load at that size)
  const sizes = [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]]
  const pages: [string, string, string][] = [["home", "?h=sample", "#letter"], ["the-day", "the-day?h=sample", "#letter"], ["travel", "travel?h=sample", "#letter"],
    ["our-story", "our-story?h=sample", "#letter"], ["faqs", "faqs?h=sample", "#letter"], ["rsvp", "?h=sample&rsvp=1", ".sheet"], ["hotels", "travel?h=sample#hotels", ".sheet"]]
  for (const [name, url, sel] of pages) {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto(url); await page.locator(sel).first().waitFor()
    const token = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--letter-width")))
    for (const [w, h] of sizes) { await page.setViewportSize({ width: w, height: h }); expect(await width(sel), `${name} at ${w}`).toBe(token) }
  }
  await page.setViewportSize({ width: 900, height: 800 })
  await page.goto("faqs?h=sample")
  const triggers = page.locator("#letter [data-slot=accordion-trigger]")
  await triggers.first().waitFor()
  const before = await width("#letter")
  await triggers.first().click(); await triggers.nth(1).click()
  expect(await width("#letter")).toBe(before)
})
