import { test, expect } from "@playwright/test"

// The lab's Paper experiment (18f): four presets, each in Light and Lantern, sliders, Copy settings
test.describe.configure({ timeout: 90_000 })
test("lab paper: four presets in both themes, sliders move the picked one", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {})
  await page.goto("lab/lab-play.html?x=micro-paper")
  const group = page.getByRole("radiogroup", { name: "Paper" })
  // Eight shaders start up first (slow in a browser without a GPU, as on CI)
  await expect(group.getByRole("radio")).toHaveCount(4, { timeout: 30_000 })
  await expect(group.getByRole("radio", { name: /Chosen/ })).toHaveAttribute("aria-checked", "true")
  await expect(page.locator(".x-pp-swatch")).toHaveCount(10) // 4 presets and the crosshatch, each light and dark
  await group.getByRole("radio", { name: /No folds or wrinkles/ }).click()
  const folds = page.getByRole("slider", { name: "Folds" })
  await expect(folds).toHaveValue("0")
  await folds.fill("0.2")
  await expect(page.locator(".x-pp-tools output").first()).toHaveText("0.20")
  await page.getByRole("button", { name: "Copy settings" }).click()
  await expect(page.getByText(/Settings copied\.|Settings below/)).toBeVisible({ timeout: 10_000 })
})
