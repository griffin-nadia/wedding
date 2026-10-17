import { test, expect, type Page } from "@playwright/test"

// Page changes (docs/quality.md): the card's top and its visible bottom edge are the same on every page, the paper
// behind everything is the theme's colour, and the light / dark circle grows from the button, the first time too.
const go = async (page: Page, path: string, theme = "autumn") => {
  await page.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-theme", t); localStorage.setItem("ng-music", "off") }, theme)
  await page.goto(`${path}?h=sample`)
  await page.waitForLoadState("networkidle")
}

test("the card's top and visible bottom don't move between pages", async ({ page }) => {
  await go(page, "")
  const edges = []
  for (const i of [1, 2, 3, 4, 0]) {
    await page.locator(".site-nav a").nth(i).click()
    await page.waitForTimeout(700)
    edges.push(await page.evaluate(() => {
      const l = document.getElementById("letter")!.getBoundingClientRect()
      const wide = innerWidth >= 768, limit = wide ? innerHeight - 64 : document.querySelector(".site-nav")!.getBoundingClientRect().top - 12
      return [Math.round(l.top), Math.round(Math.min(l.bottom, limit))]
    }))
  }
  expect(new Set(edges.map((e) => e.join())).size).toBe(1)
})

test("the paper behind the page is the theme's colour, and theme-color matches it", async ({ page }) => {
  for (const theme of ["autumn", "lantern"]) {
    await go(page, "travel", theme)
    const { bg, meta } = await page.evaluate(() => ({ bg: getComputedStyle(document.documentElement).backgroundColor, meta: document.querySelector('meta[name="theme-color"]')!.getAttribute("content") }))
    const hex = (c: string) => "#" + (c.match(/\d+/g) ?? []).slice(0, 3).map((n) => (+n).toString(16).padStart(2, "0")).join("")
    expect(hex(bg)).toBe(meta)
  }
})

test("the light and dark circle grows from the button, the first time too", async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }) // the circle is the motion-on version (reduced motion cuts)
  await page.clock.install({ time: new Date("2026-10-17T02:00:00Z") })
  await page.clock.pauseAt(new Date("2026-10-17T02:00:01Z"))
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.removeItem("ng-theme") })
  await page.goto("?h=sample")
  await page.waitForLoadState("networkidle")
  const btn = page.locator(".site-bar .mode-switches > button:last-child")
  await btn.focus() // the keyboard, so no pointer moves (on laptops the photo leans toward the pointer)
  await page.waitForTimeout(400)
  // Settle what's still arriving (the names write themselves in on a first visit), so only the switch changes pixels
  await page.evaluate(() => { for (const a of document.getAnimations()) try { a.finish() } catch { /* endless ones */ } })
  const b = (await btn.boundingBox())!, cx = b.x + b.width / 2, cy = b.y + b.height / 2
  const cdp = await context.newCDPSession(page), frames: string[] = []
  cdp.on("Page.screencastFrame", (f) => { frames.push(f.data); void cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}) })
  await cdp.send("Page.startScreencast", { format: "png", everyNthFrame: 1 })
  await page.waitForTimeout(400)
  const at = frames.length
  await page.keyboard.press("Enter")
  await page.waitForTimeout(1000)
  await cdp.send("Page.stopScreencast")
  // The first frame that differs from the one before the switch: is the area round the button already in the new
  // mode? It is when the circle grows from the button; from the middle, it would be the last place to change.
  const { width, height } = page.viewportSize()!
  const probe = await context.newPage()
  const first = await probe.evaluate(async ([before, after, w, h, bx, by]) => {
    const px = async (d: string) => { const i = new Image(); i.src = "data:image/png;base64," + d; await i.decode(); const c = new OffscreenCanvas(w, h).getContext("2d")!; c.drawImage(i, 0, 0, w, h); return c.getImageData(0, 0, w, h).data }
    const a = await px(before)
    const changed = (d: Uint8ClampedArray, x: number, y: number) => { const k = (y * w + x) * 4; return Math.abs(a[k] - d[k]) + Math.abs(a[k + 1] - d[k + 1]) + Math.abs(a[k + 2] - d[k + 2]) > 90 }
    for (const f of after) {
      const d = await px(f); let n = 0, near = 0, all = 0
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (changed(d, x, y)) n++
      if (n <= 30) continue
      // A ring round the button (16 to 40px out, inside the screen), clear of its own icon
      for (let y = Math.max(0, by - 40); y < Math.min(h, by + 40); y++) for (let x = Math.max(0, bx - 40); x < Math.min(w, bx + 40); x++) {
        const r = Math.hypot(x - bx, y - by); if (r < 16 || r > 40) continue; all++; if (changed(d, x, y)) near++ }
      return { n, near: near / all }
    }
    return null
  }, [frames[at - 1], frames.slice(at, at + 40), width, height, Math.round(cx), Math.round(cy)] as const)
  await probe.close()
  expect(first, `no change seen on ${info.project.name}`).not.toBeNull()
  expect(first!.near).toBeGreaterThan(0.25)
})

test("phones: at the end of a page the card stops 12px above the dock, with nothing repainted over it", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phones only")
  await go(page, "travel")
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }))
  await page.waitForTimeout(300)
  const gap = await page.evaluate(() => document.querySelector(".site-nav")!.getBoundingClientRect().top - document.getElementById("letter")!.getBoundingClientRect().bottom)
  expect(Math.round(gap)).toBe(12)
  await expect(page.locator(".scene")).toHaveCount(1)
})

test("each page has its own title", async ({ page }) => {
  await go(page, "")
  const titles = [await page.title()]
  for (const i of [1, 2, 3, 4]) { await page.locator(".site-nav a").nth(i).click(); await page.waitForTimeout(400); titles.push(await page.title()) }
  expect(titles).toEqual(["Griffin & Nadia", "The day · Griffin & Nadia", "Travel · Griffin & Nadia", "Our story · Griffin & Nadia", "FAQs · Griffin & Nadia"])
})
