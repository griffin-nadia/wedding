import { test, expect, type Page } from "@playwright/test"

// 18f: every reply step with a phone keyboard up (the visible area shrinks while a field has focus), in Light and
// Lantern: Back / Next stay on screen just above it, the focused field sits fully above them, the page doesn't
// scroll sideways, and nothing shows above the sticky step header
test.describe.configure({ timeout: 120_000 })
const up = async (page: Page, on: boolean) => { await page.setViewportSize({ width: 390, height: on ? 480 : 844 }); await page.waitForTimeout(450) }

for (const theme of ["autumn", "lantern"] as const) test(`each reply step with the keyboard up (${theme})`, async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "a phone keyboard")
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await page.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t) }, theme)
  await page.goto("?h=sample")
  await page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()
  const d = page.getByRole("dialog")
  await d.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await d.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await d.getByText("Bringing someone?").click()
  // One field per step: the plus one's name, a dietary note, the song search, the note
  const fields: [string, () => Promise<void>][] = [
    ["who", async () => { await d.getByLabel("Their name").focus() }],
    ["food", async () => { await d.getByRole("group").first().getByRole("button", { name: "Other" }).click(); await d.getByLabel(/Tell us more/).first().focus() }],
    ["song", async () => { await d.getByRole("searchbox").focus() }],
    ["travel", async () => { await d.getByLabel(/Anything else/).focus() }],
  ]
  for (const [step, focus] of fields) {
    await focus()
    await up(page, true)
    const r = await page.evaluate(() => {
      const bar = document.querySelector(".rsvp-actions")!.getBoundingClientRect(), f = document.activeElement!.getBoundingClientRect()
      const head = document.querySelector(".sheet-head")!.getBoundingClientRect(), body = document.querySelector(".sheet-body")!.getBoundingClientRect()
      return { barOn: bar.bottom <= innerHeight + 1 && bar.height > 0, fieldAbove: f.bottom <= bar.top + 1 && f.top >= body.top - 1, sideways: document.documentElement.scrollWidth > innerWidth + 1, bodyUnderHead: body.top >= head.bottom - 1 }
    })
    expect(r, step).toEqual({ barOn: true, fieldAbove: true, sideways: false, bodyUnderHead: true })
    await up(page, false)
    await d.getByRole("button", { name: /^Next$/ }).click()
  }
  await expect(d.getByRole("button", { name: /^Send our reply$/ })).toBeVisible()
})
