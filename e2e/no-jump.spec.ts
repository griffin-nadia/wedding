import { test, expect } from "@playwright/test"

// Phones: a tap never throws the page somewhere else (docs/quality.md)
test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phones only")
  await page.addInitScript(() => localStorage.setItem("ng-opened", "1"))
  await page.goto("travel?h=sample")
})

test("opening a row keeps it under your finger while the open one above closes", async ({ page }) => {
  const rows = page.locator("#letter [data-slot=accordion-trigger]")
  await rows.nth(0).click()
  await page.waitForTimeout(500) // let it finish opening
  await rows.nth(2).evaluate((e) => document.querySelector(".letter-scroll")!.scrollBy(0, e.getBoundingClientRect().top - innerHeight / 2))
  const top = () => rows.nth(2).evaluate((e) => e.getBoundingClientRect().top)
  const before = await top()
  await rows.nth(2).click()
  await page.waitForTimeout(600)
  expect(Math.abs((await top()) - before)).toBeLessThan(2)
})

test("closing a sheet puts the page back where it was", async ({ page }) => {
  const opener = page.locator("#letter .stay-row").first()
  await opener.evaluate((e) => e.scrollIntoView({ block: "center" }))
  const at = () => page.evaluate(() => document.querySelector(".letter-scroll")!.scrollTop)
  const y = await at()
  expect(y).toBeGreaterThan(0)
  await opener.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.evaluate(() => scrollBy({ top: 300, behavior: "instant" })) // what a phone keyboard does to the page behind
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect.poll(at).toBe(y)
})
