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
  await expect(page.getByRole("group", { name: /in the story\./ })).toBeVisible()
  await expect(page.getByRole("group", { name: /full screen\./ })).toBeVisible()
  await page.getByRole("radio", { name: "Map" }).click()
  await expect(page).toHaveURL(/view=flat/)
  const tune = page.locator("details", { hasText: "Tune the look" })
  if (!(await tune.getAttribute("open")) && (await tune.getAttribute("open")) !== "") await tune.locator("summary").click()
  await tune.getByRole("slider", { name: "Shadow" }).fill("60")
  await expect(page).toHaveURL(/k\.shadow=60/)
  await tune.getByRole("button", { name: "Back to the look as painted" }).click()
  await expect(page).not.toHaveURL(/k\.shadow/)
})

test("lab: a story line opens its own detail dialog, never the chapter; focus goes in and comes back", async ({ page }) => {
  await page.goto("lab/lab-play.html?x=globe-papercut&view=flat")
  // G beside Victoria, N beside Brisbane, no kanji seal, the Kyoto close-up with the pagoda
  await expect(page.locator(".x-g24-badge", { hasText: "G" }).first()).toBeVisible()
  await expect(page.locator(".x-g24-badge", { hasText: "N" }).first()).toBeVisible()
  await expect(page.getByText("京", { exact: true })).toHaveCount(0)
  await expect(page.getByRole("img", { name: /Yasaka Pagoda/ }).first()).toBeVisible()
  const url = page.url()
  const opener = page.getByRole("navigation", { name: /story.s lines/ }).getByRole("button", { name: /Nadia visits Canada/ })
  await opener.click()
  const dialog = page.getByRole("dialog", { name: /Nadia visits Canada/ })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("Brisbane")
  await expect(dialog.locator(":focus")).toHaveCount(1)
  expect(page.url()).toBe(url)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  // A ring on the map opens the same kind of view; Back to the map closes it
  // (keyboard, so a slow GL frame over the ring can't swallow the tap in CI)
  const ring = page.getByRole("button", { name: /Became friends, Kansai Gaidai, Hirakata\. Explain its line/ }).first()
  await ring.focus(); await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByRole("dialog").getByRole("button", { name: "Back to the map" }).click()
  await expect(page.getByRole("dialog")).toBeHidden()
})
