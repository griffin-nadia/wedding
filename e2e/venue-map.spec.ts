import { test, expect } from "@playwright/test"

// Run 22: Nadia's venue map (config.venueMap, on since run 26, so no ?preview needed). On it: a button over each of
// her 11 places, the chosen one's card, the route key, Open the map and the list with the Japanese names.
test("the venue map is on and complete", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample#around")
  await expect(page.locator(".kmap")).toHaveCount(0)
  const map = page.locator(".vmap")
  await expect(map).toBeVisible()
  await expect(map.locator(".vmap-pin")).toHaveCount(11)
  await expect(map.getByRole("img")).toHaveAttribute("alt", /Nadia's painted map of Higashiyama/)
  await map.getByRole("button", { name: /Kyoto Station/ }).click()
  await expect(page.locator(".kmap-card")).toContainText("Hachijo exit")
  await expect(page.locator(".vmap-key")).toContainText("Taxi from the station")
  await expect(page.locator(".vmap-key")).toContainText("Walk from Gion-Shijo")
  await expect(page.getByRole("button", { name: "Open the map" })).toBeVisible()
  await expect(page.getByRole("radiogroup", { name: "The places on the map" }).getByRole("radio")).toHaveCount(11)
})

// Run 26c: the places selector is a radio group (APG, native radios): Tab lands on the chosen place, the arrow keys
// move and choose, and the map's dot (opaque, honey gold and bigger when chosen) and the card follow
test("the places radio group: keyboard chooses, the dot and card follow", async ({ page }, info) => {
  test.skip(info.project.name !== "laptop", "keyboard")
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample#around")
  const group = page.getByRole("radiogroup", { name: "The places on the map" })
  const sodoh = group.getByRole("radio", { name: "The Sodoh" })
  await expect(sodoh).toBeChecked()
  await sodoh.focus()
  await page.keyboard.press("ArrowRight")
  await expect(group.getByRole("radio", { name: "Kyoto Station" })).toBeFocused()
  await expect(group.getByRole("radio", { name: "Kyoto Station" })).toBeChecked()
  await expect(page.locator(".kmap-card")).toContainText("Hachijo exit")
  await page.keyboard.press("ArrowLeft")
  await page.keyboard.press("ArrowLeft") // back past the first: wraps to the last
  await expect(group.getByRole("radio", { name: "Kiyomizu-dera" })).toBeChecked()
  await expect(page.locator(".vmap").getByRole("button", { name: /Kiyomizu-dera/ })).toHaveAttribute("aria-pressed", "true")
  await page.waitForTimeout(400) // the gold fades in and the dot grows over 200ms
  const dots = await page.locator(".vmap").evaluate((m) => [...m.querySelectorAll<HTMLElement>(".vmap-pin")].map((p) => {
    const d = p.querySelector<HTMLElement>(".vmap-dot")!, cs = getComputedStyle(d), fill = getComputedStyle(d, "::before")
    return { on: p.classList.contains("is-on"), alpha: Number(cs.backgroundColor.match(/[\d.]+/g)?.[3] ?? 1), shadow: cs.boxShadow !== "none", gold: fill.opacity === "1", scale: new DOMMatrix(cs.transform).a }
  }))
  for (const d of dots) { expect(d.alpha).toBe(1); expect(d.shadow).toBe(true) }
  const on = dots.filter((d) => d.on)
  expect(on).toHaveLength(1)
  expect(on[0].gold).toBe(true)
  expect(on[0].scale).toBeGreaterThan(1.2)
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
      await pins.nth(i).evaluate((el: HTMLElement) => el.click()) // a pin can sit below the card's own scroll fold
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

// Run 26: no two dots closer than the minimum gap (edge to edge, the chosen one with its soft ring) at 390, 430, 1440
// and 2560, inline and full screen, every one on its spot in the art; and for every place, its chip stays on the map,
// over no other dot and none of her painted lettering (LABELS: the same boxes as venue-map.tsx, % of the art)
const MIN_GAP = 3
const LABELS = [[60.6, 34.2, 79.7, 42.5], [58.8, 51.6, 73.6, 55.5], [61.4, 25, 76.2, 28.8], [77.6, 66, 93.7, 73], [19, 80.4, 35.4, 83.6],
  [32.6, 10.9, 48.1, 16.9], [58.1, 4.6, 63.8, 8.6], [46.6, 19.5, 54, 23.3], [35.2, 44.6, 46.4, 48.5], [39.8, 62.6, 45.9, 66.7], [52.5, 88, 59.4, 92.2]]
test("dots keep the minimum gap and their spots; chips stay clear of dots and her lettering", async ({ page }, info) => {
  test.skip(info.project.name !== "laptop", "sizes set here")
  test.setTimeout(90_000)
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  for (const [w, h] of [[390, 844], [430, 932], [1440, 900], [2560, 1440]]) for (const full of [false, true]) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto(`travel?h=sample&w=${w}${full ? "f" : ""}#around`) // a new address each time, so the page reloads
    if (full) await page.getByRole("button", { name: "Open the map" }).click()
    const map = full ? page.getByRole("dialog").locator(".vmap") : page.locator(".vmap")
    await map.scrollIntoViewIfNeeded(); await page.waitForTimeout(1400) // past the dots' first pulse, so they're their own size
    const pins = map.locator(".vmap-pin"), where = `${w}${full ? " full screen" : ""}`
    for (let i = 0; i < await pins.count(); i++) {
      await pins.nth(i).evaluate((el: HTMLElement) => el.click()); await page.waitForTimeout(30)
      const r = await map.evaluate((m, labels) => {
        const img = m.querySelector("img")!.getBoundingClientRect()
        const dots = [...m.querySelectorAll<HTMLElement>(".vmap-pin")].map((pin) => {
          const d = pin.querySelector<HTMLElement>(".vmap-dot")!, b = d.getBoundingClientRect(), cs = getComputedStyle(d)
          // The chosen one: its fill's soft ring (a spread from inside the ink ring), grown with the dot
          const on = pin.classList.contains("is-on"), spread = +(getComputedStyle(d, "::before").boxShadow.match(/0px 0px 0px ([\d.]+)px/)?.[1] ?? 0)
          const r = on ? Math.max(d.offsetWidth / 2, d.clientWidth / 2 + spread) * new DOMMatrix(cs.transform).a : d.offsetWidth / 2
          return { x: b.left + b.width / 2, y: b.top + b.height / 2, r, b,
            at: Math.hypot(b.left + b.width / 2 - (img.left + (parseFloat(pin.style.left) / 100) * img.width), b.top + b.height / 2 - (img.top + (parseFloat(pin.style.top) / 100) * img.height)) }
        })
        let gap = Infinity
        for (let a = 0; a < dots.length; a++) for (let b = a + 1; b < dots.length; b++) gap = Math.min(gap, Math.hypot(dots[a].x - dots[b].x, dots[a].y - dots[b].y) - dots[a].r - dots[b].r)
        const c = m.querySelector(".vmap-chip")!.getBoundingClientRect(), on = m.querySelector(".vmap-pin.is-on")!, box = m.getBoundingClientRect()
        const hit = (l: number, t: number, rr: number, bb: number) => l < c.right && rr > c.left && t < c.bottom && bb > c.top
        const covered = [...m.querySelectorAll(".vmap-pin")].filter((p) => p !== on).some((p) => { const d = p.querySelector(".vmap-dot")!.getBoundingClientRect(); return hit(d.left, d.top, d.right, d.bottom) })
        const lettering = labels.filter(([x1, y1, x2, y2]) => hit(img.left + x1 / 100 * img.width, img.top + y1 / 100 * img.height, img.left + x2 / 100 * img.width, img.top + y2 / 100 * img.height)).length
        const inside = c.left >= box.left - 0.5 && c.right <= box.right + 0.5 && c.top >= box.top - 0.5 && c.bottom <= box.bottom + 0.5
        return { gap: Math.round(gap * 10) / 10, off: Math.max(...dots.map((d) => d.at)), covered, lettering, inside, side: `at ${Math.round(c.left - box.left)},${Math.round(c.top - box.top)}, ${Math.round(c.width)}x${Math.round(c.height)} on a ${Math.round(box.width)}px map` }
      }, LABELS)
      expect(r.gap, `${where}: place ${i}: two dots too close`).toBeGreaterThanOrEqual(MIN_GAP)
      expect(r.off, `${where}: a dot off its spot`).toBeLessThanOrEqual(2)
      expect({ covered: r.covered, inside: r.inside }, `${where}: place ${i}'s chip (${r.side})`).toEqual({ covered: false, inside: true })
      // The Sodoh's chip clears all her lettering at every size. Elsewhere on a phone-sized map a chip can have nowhere
      // free of every painted label; it takes the place that covers least (no dot, on the map), so that's not asserted
      if (await pins.nth(i).getAttribute("data-id") === "venue") expect(r.lettering, `${where}: The Sodoh's chip (${r.side}) over her lettering`).toBe(0)
    }
  }
})

// Run 26: the places are one Tab stop; arrow keys move to the nearest place that way, Enter chooses it (its card)
test("arrow keys move between places and Enter opens the card", async ({ page }, info) => {
  test.skip(info.project.name !== "laptop", "keyboard")
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("travel?h=sample&preview#around")
  const map = page.locator(".vmap")
  await expect(map.getByRole("toolbar")).toBeVisible()
  await expect(map.locator('.vmap-pin[tabindex="0"]')).toHaveCount(1)
  await map.getByRole("button", { name: /The Sodoh/ }).focus()
  await page.keyboard.press("ArrowDown") // The Sodoh, then straight down: Yasaka Pagoda
  await expect(map.getByRole("button", { name: /Yasaka Pagoda/ })).toBeFocused()
  await page.keyboard.press("ArrowUp")
  await page.keyboard.press("ArrowUp") // up from The Sodoh: Yasaka Shrine
  await expect(map.getByRole("button", { name: /Yasaka Shrine/ })).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(page.locator(".kmap-card")).toContainText("Yasaka Shrine")
  await expect(map.getByRole("button", { name: /Yasaka Shrine/ })).toHaveAttribute("aria-pressed", "true")
})
