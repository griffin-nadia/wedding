import { test, expect } from "@playwright/test"

// Final run: Home's tags are the reply's steps (Who's coming, Food, A song, Travel dates), each done or not yet, each
// opening its own step
test("Home's four tags show what's done and open their step", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("?h=sample")
  await page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()
  const d = page.getByRole("dialog")
  await d.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await d.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  const send = d.getByRole("button", { name: /^Send our reply$/ })
  while (!(await send.isVisible())) await d.getByRole("button", { name: /^Next$/ }).click()
  await send.click()
  await page.keyboard.press("Escape")
  const tags = page.locator("#letter .reply-chips button")
  await expect(tags).toHaveCount(4)
  await expect(tags).toHaveText([/Who's coming.*done/, /Food.*done/, /A song.*not yet/, /Travel dates.*not yet/])
  // Run 19 (6b): on a phone, a calm 2x2 grid (four in a row don't fit at 390), nothing spilling out of its tag
  if (test.info().project.name === "phone") {
    const boxes = await tags.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), fits: e.scrollWidth <= e.clientWidth } }))
    expect(boxes[0].top).toBe(boxes[1].top); expect(boxes[2].top).toBe(boxes[3].top); expect(boxes[2].top).toBeGreaterThan(boxes[0].top)
    expect(boxes[0].left).toBe(boxes[2].left); expect(new Set(boxes.map((b) => b.w)).size).toBe(1)
    for (const b of boxes) expect(b.fits).toBe(true)
  }
  for (const [tag, heading] of [["A song", /song for good vibes/], ["Food", /dietary needs/], ["Travel dates", /travel dates/], ["Who's coming", /Who's coming/]] as const) {
    await tags.filter({ hasText: tag }).click()
    await expect(page.getByRole("dialog").getByRole("heading", { name: heading })).toBeVisible()
    await page.keyboard.press("Escape")
  }
})

// Run 27 (Jehan): no fortune or story tags on Home. Once a fortune has been drawn (here on the done screen), the
// omikuji in the top bar, left of あ, opens it in its own dialog: Esc closes it, focus back on the icon, Back to your
// invite closes it too. Before the first draw it isn't there.
test("the fortune lives in the top bar once drawn, never on Home", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("?h=sample")
  const icon = page.locator(".site-bar").getByRole("button", { name: "Draw your fortune" })
  await page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()
  const d = page.getByRole("dialog")
  await d.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await d.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  const send = d.getByRole("button", { name: /^Send our reply$/ })
  while (!(await send.isVisible())) await d.getByRole("button", { name: /^Next$/ }).click()
  await send.click()
  await expect(icon).toHaveCount(0) // replied, nothing drawn yet
  await d.getByRole("button", { name: "Draw one" }).click()
  await expect(d.locator(".omikuji-slip").first()).toBeVisible()
  await page.keyboard.press("Escape")
  const letter = page.locator("#letter")
  await expect(letter.locator(".omikuji, .omikuji-stage, .home-tags, .next-step")).toHaveCount(0)
  await expect(icon).toBeVisible()
  await icon.click()
  const sheet = page.getByRole("dialog", { name: "A little fortune for the trip" })
  await expect(sheet.locator(".omikuji-slip").first()).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(sheet).toHaveCount(0)
  await expect(icon).toBeFocused()
  await icon.click()
  await page.getByRole("dialog").getByRole("button", { name: "Back to your invite" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})
