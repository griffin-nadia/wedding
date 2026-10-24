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

test("lab: a globe look shows both views under one switch, and its tuning panel keeps the sliders in the address", async ({ page }) => {
  await page.goto("lab/lab-play.html?x=globe-airmail")
  await expect(page.getByRole("group", { name: /in the story\./i })).toBeVisible()
  await expect(page.getByRole("group", { name: /full screen\./i })).toBeVisible()
  await page.getByRole("radio", { name: "Map" }).click()
  await expect(page).toHaveURL(/view=flat/)
  const tune = page.locator("details", { hasText: "Tune the look" })
  if (!(await tune.getAttribute("open")) && (await tune.getAttribute("open")) !== "") await tune.locator("summary").click()
  await tune.getByRole("slider", { name: "Shadow" }).fill("60")
  await expect(page).toHaveURL(/k\.shadow=60/)
  await tune.getByRole("button", { name: "Back to the look as painted" }).click()
  await expect(page).not.toHaveURL(/k\.shadow/)
})

test("lab: every globe look has the site's marks only: the Kyoto seal, G, N and You, no chapter pins or inset", async ({ page }) => {
  await page.goto("lab/lab-play.html?x=globe-papercut&view=flat")
  await expect(page.locator(".x-g24-badge", { hasText: "G" }).first()).toBeVisible()
  await expect(page.locator(".x-g24-badge", { hasText: "N" }).first()).toBeVisible()
  await expect(page.locator(".x-g24-badge", { hasText: "You" }).first()).toBeVisible()
  await expect(page.locator(".x-g24-seal", { hasText: "京" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: /Explain its line/ })).toHaveCount(0)
  await expect(page.getByRole("img", { name: /Kyoto close up/ })).toHaveCount(0)
})
