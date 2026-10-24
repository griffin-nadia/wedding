import { test, expect } from "@playwright/test"

// Run 27: the globe looks picker, the one lab-derived page that ships. Unlisted (noindex, no link anywhere), loads,
// and switching a look changes the globe and the note Jehan gets.
test("looks picker: noindex, loads, switches a look", async ({ page }) => {
  await page.goto("looks/qx26de88/")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow")
  await expect(page.getByRole("heading", { name: "Globe looks" })).toBeVisible()
  await expect(page.getByRole("radio", { name: "Airmail" })).toBeChecked()
  await expect(page.getByText("Globe pick: Airmail, land 100%, lines 100%, planes 100%, globe, day")).toBeVisible()
  await page.getByRole("radio", { name: "Video game" }).check()
  await expect(page).toHaveURL(/look=arcade/)
  await expect(page.getByText(/Globe pick: Video game,/)).toBeVisible()
  await expect(page.getByRole("group", { name: /video game/i })).toBeVisible()
  await page.getByRole("radio", { name: "Night", exact: true }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "lantern")
})

test("looks picker: no link to it from the site", async ({ page }) => {
  await page.goto("?h=sample")
  await expect(page.locator('a[href*="qx26de88"]')).toHaveCount(0)
})
