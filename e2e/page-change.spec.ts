import { test, expect, type Page } from "@playwright/test"

// Page changes (docs/quality.md): the card's top and its visible bottom edge are the same on every page, the paper
// behind everything is the theme's colour, and the light / dark circle grows from the button, the first time too.
const go = async (page: Page, path: string, theme = "autumn") => {
  await page.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-theme", t); localStorage.setItem("ng-music", "off") }, theme)
  await page.goto(`${path}?h=sample`)
  await page.waitForLoadState("networkidle")
}

// Home's card is only as tall as what's on it (18e), so its bottom is left out; its top is the same as the others'
test("the card's top and visible bottom don't move between pages", async ({ page }) => {
  await go(page, "")
  const edges = [], tops = []
  for (const i of [1, 2, 3, 4, 0]) {
    await page.locator(".site-nav a").nth(i).click()
    await page.waitForTimeout(700)
    edges.push(await page.evaluate(() => {
      const l = document.getElementById("letter")!.getBoundingClientRect()
      const wide = innerWidth >= 768, limit = wide ? innerHeight - 64 : document.querySelector(".site-nav")!.getBoundingClientRect().top - 12
      return [Math.round(l.top), Math.round(Math.min(l.bottom, limit))]
    }))
    tops.push(edges.at(-1)![0])
    if (i === 0) edges.pop()
  }
  expect(new Set(edges.map((e) => e.join())).size).toBe(1)
  expect(new Set(tops).size).toBe(1)
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

// 18e: the card is a fixed frame, 12px under the bar and 12px above the dock, at the top of its scroll and the end
test("phones: the card sits 12px under the bar and 12px above the dock, scrolled or not", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phones only")
  await go(page, "travel")
  const gaps = () => page.evaluate(() => { const l = document.getElementById("letter")!.getBoundingClientRect(); return [Math.round(l.top - document.querySelector(".site-bar")!.getBoundingClientRect().bottom), Math.round(document.querySelector(".site-nav")!.getBoundingClientRect().top - l.bottom)] })
  expect(await gaps()).toEqual([12, 12])
  await page.evaluate(() => { const s = document.querySelector(".letter-scroll")!; s.scrollTo({ top: s.scrollHeight, behavior: "instant" }) })
  await page.waitForTimeout(300)
  expect(await gaps()).toEqual([12, 12])
  await expect(page.locator(".scene")).toHaveCount(1)
})

test("each page has its own title", async ({ page }) => {
  await go(page, "")
  const titles = [await page.title()]
  for (const i of [1, 2, 3, 4]) { await page.locator(".site-nav a").nth(i).click(); await page.waitForTimeout(400); titles.push(await page.title()) }
  expect(titles).toEqual(["Griffin & Nadia", "The day · Griffin & Nadia", "Travel · Griffin & Nadia", "Our story · Griffin & Nadia", "FAQs · Griffin & Nadia"])
})

// 18e: the circle's origin is the toggle's centre, exactly, on the first switch and the second (at 390 and 1440).
// Read from the circle the toggle writes, so a frame-timing quirk can't hide an off-centre start. Run 19: and from the
// circle the browser is actually drawing mid-reveal (the snapshot's computed clip), after a page change too (laptops
// change pages with a view transition of their own), and the reveal is the slow token, 450 ms.
test("the theme circle starts at the toggle's centre, first and second switch", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.addInitScript(() => {
    localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.removeItem("ng-theme")
    const w = window as unknown as { __circles: string[] }; w.__circles = []
    new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) { const t = (n as Element).textContent ?? ""; const c = t.match(/circle\(0px at (\d+)px (\d+)px\)/); if (c) w.__circles.push(`${c[1]},${c[2]}`) } }).observe(document, { childList: true, subtree: true })
  })
  await page.goto("?h=sample")
  await page.waitForLoadState("networkidle")
  const btn = page.locator(".site-bar .mode-switches > button:last-child")
  const centre = async () => { const b = (await btn.boundingBox())!; return `${Math.round(b.x + b.width / 2)},${Math.round(b.y + b.height / 2)}` }
  // Mid-reveal: the circle on screen has grown past 0 and is centred on the button
  const drawn = async () => (await page.waitForFunction(() => {
    const c = getComputedStyle(document.documentElement, "::view-transition-new(root)").clipPath.match(/circle\(([\d.]+)px at ([\d.]+)px ([\d.]+)px\)/)
    return c && +c[1] > 0 ? `${Math.round(+c[2])},${Math.round(+c[3])}` : null
  }, null, { polling: 16, timeout: 2000 })).jsonValue()
  const want = [await centre()], seen = []
  await btn.click()
  seen.push(await drawn())
  const ms = await page.evaluate(() => [...new Set(document.documentElement.getAnimations({ subtree: true }).filter((a) => (a.effect as KeyframeEffect).pseudoElement === "::view-transition-new(root)").map((a) => a.effect!.getTiming().duration))])
  expect(ms).toEqual([450])
  await page.waitForTimeout(1000) // the reveal finishes
  await page.locator(".site-nav a").nth(2).click() // to Travel, then switch back
  await page.waitForTimeout(800)
  want.push(await centre())
  await btn.click()
  seen.push(await drawn())
  await page.waitForTimeout(1000)
  expect(await page.evaluate(() => (window as unknown as { __circles: string[] }).__circles)).toEqual(want)
  expect(seen).toEqual(want)
})

// Final M: on phones the dock's pill follows a swipe, then settles on the page it opened
test("the dock's pill follows a swipe", async ({ page, context }, info) => {
  test.skip(info.project.name !== "phone", "phones only")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await go(page, "the-day")
  const pillX = () => page.locator(".nav-mark").evaluate((el) => el.getBoundingClientRect().left)
  const before = await pillX(), slot = await page.locator(".nav-mark").evaluate((el) => el.getBoundingClientRect().width)
  const h = (await page.locator("#letter h1").first().boundingBox())!, y = h.y + h.height / 2 // on the heading, clear of links
  const finger = await context.newCDPSession(page)
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x?: number) => finger.send("Input.dispatchTouchEvent", { type, touchPoints: x === undefined ? [] : [{ x, y }] })
  await touch("touchStart", 300)
  for (let i = 1; i <= 8; i++) { await touch("touchMove", 300 - i * 15); await page.waitForTimeout(16) }
  await page.waitForTimeout(50)
  const mid = await pillX()
  expect(mid).toBeGreaterThan(before + slot * 0.1) // part way to Travel, under the finger
  expect(mid).toBeLessThan(before + slot * 0.9)
  for (let i = 9; i <= 16; i++) { await touch("touchMove", 300 - i * 15); await page.waitForTimeout(16) }
  await touch("touchEnd")
  await expect(page).toHaveURL(/travel/)
  await page.waitForTimeout(500)
  expect(Math.abs(await pillX() - (before + slot))).toBeLessThan(2) // settled on Travel
})

// Final M: the laptop credit has no chip, 12px and quiet, and still AA against the paper halo it sits in
test("the laptop credit: no chip, 12px, quiet but AA, full ink on focus", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "laptops only")
  await go(page, "")
  const credit = page.locator(".credit-mark:not(.credit-foot)")
  await expect(credit).toBeVisible()
  const read = () => credit.evaluate((el) => {
    const c = document.createElement("canvas").getContext("2d")!
    const rgb = (v: string) => { c.fillStyle = "#000"; c.fillStyle = v; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3) }
    const lum = (v: string) => { const [r, g, b] = rgb(v).map((n) => { const s = n / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
    const cs = getComputedStyle(el), paper = getComputedStyle(document.documentElement).getPropertyValue("--letter-bg").trim()
    const [a, b] = [lum(cs.color), lum(paper)].sort((x, y) => y - x)
    return { size: cs.fontSize, bg: cs.backgroundColor, ratio: (a + 0.05) / (b + 0.05), color: cs.color }
  })
  const rest = await read()
  expect(rest.size).toBe("12px")
  expect(rest.bg).toBe("rgba(0, 0, 0, 0)")
  expect(rest.ratio).toBeGreaterThanOrEqual(4.5)
  await credit.focus()
  await page.waitForTimeout(300)
  const focused = await read()
  expect(focused.ratio).toBeGreaterThan(rest.ratio)
})
