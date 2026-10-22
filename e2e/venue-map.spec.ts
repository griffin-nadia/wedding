import { test, expect } from "@playwright/test"

// Run 22: Nadia's venue map is off on the site (config.venueMap) until the invites are out; ?preview shows it. On it:
// a button over each of her 11 places, the chosen one's card, the route switch, the full-size link and the list with
// the Japanese names.
test("the venue map is off by default and complete with ?preview", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample#around")
  await expect(page.locator(".kmap")).toBeVisible()
  await expect(page.locator(".vmap")).toHaveCount(0)

  await page.goto("travel?h=sample&preview#around")
  const map = page.locator(".vmap")
  await expect(map).toBeVisible()
  await expect(map.locator(".vmap-spot")).toHaveCount(11)
  await expect(map.getByRole("img")).toHaveAttribute("alt", /Nadia's painted map of Higashiyama/)
  await map.getByRole("button", { name: /Kyoto Station/ }).click()
  await expect(page.locator(".kmap-card")).toContainText("Hachijo exit")
  await page.getByRole("radio", { name: /By train/ }).click()
  await expect(page.getByText(/Keihan line north to Kiyomizu Gojo/)).toBeVisible()
  await expect(page.getByRole("link", { name: /View the full map/ })).toHaveAttribute("href", /venue-map-full\.webp$/)
  await page.locator(".vmap-list summary").click()
  await expect(page.locator(".vmap-list [lang=ja]", { hasText: "清水寺" })).toBeVisible()
})
