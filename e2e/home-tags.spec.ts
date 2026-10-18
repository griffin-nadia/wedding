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
  for (const [tag, heading] of [["A song", /song for the dance floor/], ["Food", /dietary needs/], ["Travel dates", /travel dates/], ["Who's coming", /Who's coming/]] as const) {
    await tags.filter({ hasText: tag }).click()
    await expect(page.getByRole("dialog").getByRole("heading", { name: heading })).toBeVisible()
    await page.keyboard.press("Escape")
  }
})
