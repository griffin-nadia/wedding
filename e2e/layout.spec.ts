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

// Run 21: on laptops each card is as tall as what's on it. At 1440x900 no page has more than 64px of card with nothing
// in it (a long page fills the frame and scrolls inside, so it has none), and no page title has the old moss rule.
test("every card fits its content: no more than 64px of dead space at 1440x900", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "laptops")
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  for (const url of ["?h=sample", "the-day?h=sample", "travel?h=sample", "our-story?h=sample", "faqs?h=sample"]) {
    await page.goto(url); await page.locator("#letter").waitFor(); await page.waitForTimeout(300)
    const m = await page.evaluate(() => {
      const card = document.querySelector("#letter")!, sc = card.querySelector(".letter-scroll") ?? card
      // What's on it: from its first child's top to its last child's bottom, plus the padding (scrollHeight never
      // drops below the scroller's own height, so it can't see empty space)
      const kids = [...sc.children].filter((e) => getComputedStyle(e).position !== "absolute" && (e as HTMLElement).offsetParent)
      const cs = getComputedStyle(sc), h = card.getBoundingClientRect().height
      const content = kids.length ? kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : h
      if (sc !== card && sc.scrollHeight > sc.clientHeight + 1) return { dead: 0, rule: false, scrolls: true }
      const rule = [...card.querySelectorAll(".heading")].some((e) => getComputedStyle(e, "::after").content !== "none")
      return { dead: Math.round(h - Math.min(content, h)), rule, scrolls: false }
    })
    expect(m.dead, `${url}: dead space`).toBeLessThanOrEqual(64)
    expect(m.rule, `${url}: rule under the title`).toBe(false)
  }
})
