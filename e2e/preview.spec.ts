import { test, expect } from "@playwright/test"

// Run 21, review links (?h=preview-en and ?h=preview-ja stand in for the Preview tab's tokens without a back end): a
// banner saying replies aren't saved, Leave feedback opening the Ask us sheet as Feedback, the Japanese one opening in
// Japanese, and nothing of it on a guest's own link.
test("review links show the preview banner and feedback; a guest's link never does", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("?h=sample"); await page.locator("#letter").waitFor()
  await expect(page.locator(".preview-banner")).toHaveCount(0)

  await page.goto("faqs?h=preview-en")
  const banner = page.locator(".preview-banner")
  await expect(banner).toContainText("Preview: replies aren't saved")
  await banner.getByRole("button", { name: "Leave feedback" }).click()
  const sheet = page.getByRole("dialog")
  await expect(sheet.getByRole("heading", { name: "Feedback" })).toBeVisible()
  await sheet.getByLabel("What reads oddly or looks off?").fill("The second FAQ wraps oddly.")
  await sheet.getByRole("button", { name: "Send" }).click()
  await expect(sheet.getByRole("status")).toContainText("Thanks, noted.")
})

test("the Japanese review opens in Japanese", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.removeItem("ng-lang") })
  await page.goto("?h=preview-ja")
  await expect(page.locator(".preview-banner")).toContainText("プレビュー")
  await expect(page.locator("html")).toHaveAttribute("lang", "ja")
})
