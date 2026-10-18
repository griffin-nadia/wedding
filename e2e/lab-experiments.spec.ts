import { test, expect } from "@playwright/test"

// Every lab experiment (lab run 19): its first take opens full screen without an error, with its Options. Runs with
// reduced motion, as the whole suite does, so it walks the still versions. Phone only, and one take each, so it stays
// light beside the site's own performance budget on CI (the globe paints in software there).
test.describe.configure({ timeout: 120_000 })

test("lab: every experiment opens cleanly", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone only: one pass is enough")
  await page.goto("lab/lab.html")
  const { entries } = await page.evaluate(() => (window as unknown as { __labIndex: { entries: { id: string; takes?: string[] }[] } }).__labIndex)
  expect(entries.length).toBeGreaterThan(10)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`))
  for (const e of entries) {
    const url = `lab/lab-play.html?x=${e.id}${e.takes ? `&take=${e.takes[0]}` : ""}`
    // An experiment that's still loading its own frames can abort the next navigation once; go again
    await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => page.goto(url, { waitUntil: "domcontentloaded" }))
    await expect(page.getByRole("button", { name: "Options" })).toBeVisible()
  }
  await page.goto("about:blank")
  expect(errors).toEqual([])
})
