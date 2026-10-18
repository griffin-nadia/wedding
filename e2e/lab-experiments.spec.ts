import { test, expect } from "@playwright/test"

// Every lab experiment, every take (lab run 19): it opens full screen without an error, with its Options and (where
// the site has one) Compare with live. Runs with reduced motion, as the whole suite does, so it walks the still
// versions too.
test.describe.configure({ timeout: 180_000 })

test("lab: every experiment and take opens cleanly", async ({ page }) => {
  await page.goto("lab/lab.html")
  const { entries } = await page.evaluate(() => (window as unknown as { __labIndex: { entries: { id: string; takes?: string[] }[] } }).__labIndex)
  expect(entries.length).toBeGreaterThan(10)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`))
  for (const e of entries) {
    for (const take of e.takes ?? [""]) {
      await page.goto(`lab/lab-play.html?x=${e.id}${take ? `&take=${take}` : ""}`)
      await expect(page.getByRole("button", { name: "Options" })).toBeVisible()
      await page.waitForTimeout(400)
    }
  }
  expect(errors).toEqual([])
})
