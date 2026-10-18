import { test, expect } from "@playwright/test"

// The lab's controls (lab run 19): the view lives in the address, Options picks a take, Copy settings makes a note,
// Compare with live swaps in the live page in place, and the Shortlist lists every open decision with its takes
test.describe.configure({ timeout: 60_000 })

test("lab: a take, Copy settings and Compare with live, all kept in the address", async ({ page }) => {
  await page.goto("lab/lab-play.html?x=confirm-stamp")
  await page.getByRole("button", { name: "Options" }).click()
  const sheet = page.getByRole("dialog")
  await sheet.getByRole("radio", { name: "京 Kyoto" }).check()
  await expect(page).toHaveURL(/take=kyo/)
  await sheet.getByRole("button", { name: "Copy settings" }).click()
  await expect(page.getByText(/Settings copied\.|Settings below/)).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Compare with live" }).click()
  await expect(page).toHaveURL(/live=1/)
  await expect(page.locator("iframe.lab-full")).toHaveAttribute("src", /\/wedding\/\?rsvp=1&h=sample/)
  // The link opens the same view
  await page.reload()
  await expect(page.getByRole("button", { name: "Compare with live" })).toHaveAttribute("aria-pressed", "true")
})

test("lab: the Shortlist has every open decision, each take pickable", async ({ page }) => {
  await page.goto("lab/lab.html#shortlist")
  const seal = page.getByRole("group", { name: /The seal/ })
  await expect(seal.getByRole("radio")).toHaveCount(3)
  await seal.getByRole("radio", { name: /G·N/ }).check()
  await expect(page.getByText(/1 of \d+ picked/)).toBeVisible()
})
