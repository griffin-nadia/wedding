import { test, expect } from "@playwright/test"

// Run 27: after a reply Home is the letter, Replied with Change my reply, the note and the countdown (days and hours).
// No reply chips, next step, tags or Seal it again. The fortune is an omikuji in the top bar, left of あ, once the
// household has replied: it opens the fortune in its own dialog (Esc, the X or Back to your invite close it, focus back
// on the icon), and it fits the bar at 390.
test("after a reply, Home is simple and the fortune is in the top bar", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("?h=sample")
  const bar = page.locator(".site-bar"), fortune = bar.getByRole("button", { name: "Draw your fortune" })
  await expect(page.locator("#letter").getByRole("button", { name: /RSVP/ }).first()).toBeVisible()
  await expect(fortune).toHaveCount(0) // not before a reply
  await page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()
  const d = page.getByRole("dialog")
  await d.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await d.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  const send = d.getByRole("button", { name: /^Send our reply$/ })
  while (!(await send.isVisible())) await d.getByRole("button", { name: /^Next$/ }).click()
  await send.click()
  await page.keyboard.press("Escape")
  const letter = page.locator("#letter")
  await expect(letter.getByText("Replied, thank you")).toBeVisible()
  await expect(letter.getByRole("button", { name: "Change my reply" })).toBeVisible()
  await expect(letter.locator(".reply-chips, .home-tags, .next-step")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Seal it again" })).toHaveCount(0)
  await expect(letter.locator(".count-box")).toHaveCount(2) // days and hours
  // The omikuji sits left of あ, and every bar control is on screen at this width
  await expect(fortune).toBeVisible()
  const lang = bar.getByRole("button", { name: /日本語に切り替える|Switch to English/ })
  expect((await fortune.boundingBox())!.x).toBeLessThan((await lang.boundingBox())!.x)
  const vw = page.viewportSize()!.width
  for (const b of await bar.getByRole("button").all()) if (await b.isVisible()) expect((await b.boundingBox())!.x + (await b.boundingBox())!.width).toBeLessThanOrEqual(vw)
  await fortune.click()
  const sheet = page.getByRole("dialog", { name: "A little fortune for the trip" })
  await sheet.getByRole("button", { name: "Draw one" }).click()
  await expect(sheet.locator(".omikuji-slip").first()).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(sheet).toHaveCount(0)
  await expect(fortune).toBeFocused()
  await fortune.click()
  await page.getByRole("dialog").getByRole("button", { name: "Back to your invite" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(letter.locator(".omikuji, .omikuji-stage")).toHaveCount(0)
})
