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
  await expect(map.locator(".vmap-pin")).toHaveCount(11)
  await expect(map.getByRole("img")).toHaveAttribute("alt", /Nadia's painted map of Higashiyama/)
  await map.getByRole("button", { name: /Kyoto Station/ }).click()
  await expect(page.locator(".kmap-card")).toContainText("Hachijo exit")
  await expect(page.locator(".vmap-key")).toContainText("Taxi from the station")
  await expect(page.locator(".vmap-key")).toContainText("Walk from Gion-Shijo")
  await expect(page.getByRole("button", { name: "Open the map" })).toBeVisible()
  await page.locator(".vmap-list summary").click()
  await expect(page.locator(".vmap-list [lang=ja]", { hasText: "清水寺" })).toBeVisible()
})

// Run 24b: every ring sits on its own dot in Nadia's art (the place's % of the image), at three widths (run 25: and 2560)
test("every place's ring is centred on its spot in the art", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  for (const [w, h] of [[390, 844], [1024, 768], [1440, 900], [2560, 1440]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto("travel?h=sample&preview#around")
    const map = page.locator(".vmap"); await map.scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
    const off = await map.evaluate((m) => {
      const img = m.querySelector("img")!.getBoundingClientRect()
      return [...m.querySelectorAll<HTMLElement>(".vmap-pin")].map((pin) => {
        const d = pin.querySelector(".vmap-dot")!.getBoundingClientRect()
        const x = img.left + (parseFloat(pin.style.left) / 100) * img.width, y = img.top + (parseFloat(pin.style.top) / 100) * img.height
        return Math.round(Math.hypot(d.left + d.width / 2 - x, d.top + d.height / 2 - y))
      })
    })
    expect(off.length, `${w}`).toBe(11)
    for (const o of off) expect(o, `${w}: a ring off its spot`).toBeLessThanOrEqual(2)
  }
})

// Run 25: the chosen place's chip shows on phones too, and no chip runs off the map at 390 or 430
test("the chosen place's chip shows on phones and stays on the map", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phones")
  for (const w of [390, 430]) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
    await page.goto("travel?h=sample&preview")
    await page.getByRole("button", { name: /Around the venue/ }).first().click()
    const pins = page.locator(".vmap-pin")
    for (let i = 0; i < await pins.count(); i++) {
      await pins.nth(i).click({ force: true })
      const r = await page.evaluate(() => { const c = document.querySelector(".vmap-chip")!.getBoundingClientRect(), m = document.querySelector(".vmap")!.getBoundingClientRect(); return { shown: c.width > 0, inside: c.left >= m.left && c.right <= m.right && c.top >= m.top && c.bottom <= m.bottom } })
      expect(r, `${w}: place ${i}`).toEqual({ shown: true, inside: true })
    }
  }
})

// Run 25: "Open the map" shows the same map full screen, from Travel and from The day (which has no map inline); Escape
// closes it and focus goes back to the link; the rings sit on their spots there too
for (const path of ["travel?h=sample&preview#around", "the-day?h=sample&preview"]) test(`Open the map, full screen (${path.split("?")[0]})`, async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto(path)
  if (path.startsWith("the-day")) await expect(page.locator("#letter .vmap")).toHaveCount(0) // the link, not a second map
  const open = page.getByRole("button", { name: "Open the map" })
  await open.click()
  const dialog = page.getByRole("dialog", { name: "Around the venue" })
  await expect(dialog.locator(".vmap-pin")).toHaveCount(11)
  await expect(dialog.getByRole("button", { name: "Open the map" })).toHaveCount(0)
  await dialog.getByRole("button", { name: /Yasaka Pagoda/ }).click()
  await expect(dialog.locator(".kmap-card")).toContainText("Yasaka Pagoda")
  const off = await dialog.locator(".vmap").evaluate((m) => {
    const img = m.querySelector("img")!.getBoundingClientRect()
    return [...m.querySelectorAll<HTMLElement>(".vmap-pin")].map((pin) => {
      const d = pin.querySelector(".vmap-dot")!.getBoundingClientRect()
      return Math.round(Math.hypot(d.left + d.width / 2 - (img.left + (parseFloat(pin.style.left) / 100) * img.width), d.top + d.height / 2 - (img.top + (parseFloat(pin.style.top) / 100) * img.height)))
    })
  })
  for (const o of off) expect(o).toBeLessThanOrEqual(2)
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
})
