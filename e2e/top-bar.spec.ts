import { test, expect } from "@playwright/test"

// The top bar (docs/quality.md): あ / A, music and the sun or moon live in it on every screen, never in the letter.
// 18e: the card is a fixed frame whose content scrolls inside it; the bar never hides and never changes as it does,
// and the page itself never scrolls.
test("the switches sit in the top bar, which stays put on every scroll", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample")
  const bar = page.locator(".site-bar")
  await expect(bar.locator(".mode-switches")).toBeVisible()
  await expect(page.locator("#letter .mode-switches, #letter .utility-btn[aria-pressed]")).toHaveCount(0)
  const look = () => bar.evaluate((e) => { const s = getComputedStyle(e, "::before"); return `${s.backgroundColor} ${s.boxShadow} ${s.backdropFilter}` })
  const still = await look()
  for (const y of [600, 1400, 900, 200]) {
    await page.evaluate((to) => document.querySelector(".letter-scroll")!.scrollTo({ top: to, behavior: "instant" }), y)
    await page.evaluate(() => scrollTo({ top: 500, behavior: "instant" })) // the page itself has nowhere to go
    await page.waitForTimeout(250)
    const r = await bar.boundingBox()
    expect(r?.y).toBe(0)
    await expect(bar).toBeVisible()
    expect(await page.evaluate(() => scrollY)).toBe(0)
    expect(await look()).toBe(still)
  }
  // The bar, the dock and the card are one paper
  const paper = await page.evaluate(() => [getComputedStyle(document.querySelector(".site-bar")!, "::before").backgroundColor, getComputedStyle(document.querySelector(".site-nav")!).backgroundColor, getComputedStyle(document.documentElement).getPropertyValue("--letter-bg")])
  if (await page.evaluate(() => innerWidth < 768)) expect(paper[1]).toBe(paper[0])
})

// 18e: one sticky layer. The page header scrolls away with the page; only Travel's jump links stay, as one slim row
// flush with the card's top edge. The card's words fade softly (16px) into its top and bottom edges.
test("Travel: the header scrolls away, the jump links stay flush with the card's top edge", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample")
  await expect(page.locator("#on-the-day")).toBeAttached() // the whole page is there to scroll
  await page.evaluate(() => document.querySelector(".letter-scroll")!.scrollTo({ top: 900, behavior: "instant" }))
  await expect(page.locator(".jump-links")).toHaveAttribute("data-stuck")
  const m = await page.evaluate(() => {
    const card = document.getElementById("letter")!.getBoundingClientRect(), links = document.querySelector(".jump-links")!.getBoundingClientRect()
    const head = document.querySelector(".page-header")!.getBoundingClientRect(), s = getComputedStyle(document.querySelector(".letter-fade")!) // the edge fades: a still layer since the run 26 review (Day scroll), not a mask on the scroller
    return { flush: Math.round(links.top - card.top), slim: links.height <= 52, headGone: head.bottom < card.top, mask: (s.maskImage || s.webkitMaskImage).includes("16px"), sticky: [...document.querySelectorAll("#letter *")].filter((e) => getComputedStyle(e).position === "sticky").length }
  })
  expect(m).toEqual({ flush: 1, slim: true, headGone: true, mask: true, sticky: 1 })
})

// Run 26 live bug: the top bar's RSVP (laptops) opened the sheet once; after closing it, pressing it again did nothing
// (the address was already /?rsvp=1, so nothing changed). It opens every time, from Home and from another page.
test("the top bar's RSVP opens the reply every time it's pressed", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "the top bar's RSVP shows from 768")
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample")
  for (let i = 0; i < 3; i++) {
    await page.locator(".site-rsvp").click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toBeHidden()
  }
})

// Run 26 live bug: a faint line ran right above the nav tabs (the dock's edge: laptops in Lantern, phones in both).
// The tabs have no line above them, in either theme, on phones and laptops
test("no line above the nav tabs, day or night", async ({ page }) => {
  for (const theme of ["autumn", "lantern"]) {
    await page.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t) }, theme)
    await page.goto("travel?h=sample")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
    const edge = await page.locator(".site-nav").evaluate((e) => { const s = getComputedStyle(e); return { line: s.borderTopWidth === "0px" || /rgba\(.*, 0\)$|transparent/.test(s.borderTopColor), shadow: s.boxShadow } })
    expect(edge, theme).toEqual({ line: true, shadow: "none" })
  }
})
