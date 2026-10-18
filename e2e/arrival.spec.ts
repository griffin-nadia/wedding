import { test, expect, type Page } from "@playwright/test"
import fs from "node:fs"

test.use({ reducedMotion: "no-preference" })
const open = (page: Page) => page.getByRole("button", { name: "Open", exact: true })

// 18e: a calm Open button under a floating envelope, which never offers its picture on a long press
test("the arrival: a real Open button, no long-press save, and the float pauses where it is on opening", async ({ page }) => {
  await page.goto("?h=sample")
  await expect(open(page)).toBeVisible()
  const env = await page.evaluate(() => {
    const e = document.querySelector(".envelope")!
    return {
      inLink: !!e.closest("a"),
      draggable: [...e.querySelectorAll("img")].every((i) => i.getAttribute("draggable") === "false"),
      callout: getComputedStyle(e).getPropertyValue("-webkit-touch-callout") || "none",
      select: getComputedStyle(e).userSelect,
      floating: getComputedStyle(document.querySelector(".envelope-float")!).animationName,
    }
  })
  expect(env).toEqual({ inLink: false, draggable: true, callout: "none", select: "none", floating: "envelope-float" })
  // The envelope sits below the middle of the screen, the label under it
  const [e, l, h] = await page.evaluate(() => [document.querySelector(".envelope")!.getBoundingClientRect().top, document.querySelector(".arrival-open")!.getBoundingClientRect().top, innerHeight])
  expect(e).toBeGreaterThan(h * 0.3)
  expect(l).toBeGreaterThan(e)
  await open(page).click()
  await expect(page.locator(".envelope-float")).toHaveCSS("animation-play-state", "paused")
  await expect(page.locator("#letter")).toBeFocused({ timeout: 3000 })
})

// 18f: in Lantern the letter coming out of the envelope is the night letter from its first frame (walnut paper,
// cream names); the "&" is the brand sage in both themes, on the envelope's letter and on Home
for (const theme of ["autumn", "lantern"] as const) test(`the envelope's letter in ${theme}: the theme's paper from the start, a sage "&"`, async ({ page }) => {
  await page.addInitScript((t) => { localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t) }, theme)
  await page.goto("?h=sample")
  await expect(open(page)).toBeVisible()
  const look = () => page.evaluate(() => {
    const css = (s: string) => getComputedStyle(document.querySelector(s)!)
    return { bg: css(".envelope-paper").backgroundColor, ink: css(".envelope-paper .names-art-ink").backgroundColor, amp: css(".envelope-paper .names-art-amp").backgroundColor, edge: css(".envelope-paper").borderTopWidth }
  })
  const before = await look()
  const sage = theme === "lantern" ? "rgb(157, 176, 138)" : "oklch(0.502 0.074 123.8)" // Lantern's sage is #9db08a (polish.css)
  expect(before.amp).toBe(sage)
  expect(before.edge, "no coloured strip along the letter's top (run 19)").toBe("0px")
  if (theme === "lantern") {
    expect(before.bg).toBe("oklch(0.245 0.034 49)") // walnut, the night letter
    expect(before.ink).toBe("oklch(0.932 0.03 80.7)") // cream lettering
  }
  await open(page).click()
  await page.waitForTimeout(150)
  expect((await look()).bg).toBe(before.bg) // the same paper while it opens: nothing swaps mid-way
  await expect(page.locator("#letter .names-art-amp").first()).toBeVisible({ timeout: 5000 })
  expect(await page.locator("#letter .names-art-amp").first().evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(sage)
})

// Run 19: each journey is one clear sequence on one clock. Held at 0, 25, 50, 75 and 100% of it: the card is never
// half see-through, its words never show while the envelope is on screen over it, the open envelope is always her
// paper at full strength, and each step is where it should be. Open, seal, open, seal, the last two straight through.
const hold = async (page: Page, start: () => Promise<unknown>) => {
  await page.evaluate(() => { (window as unknown as { __before: Set<Animation> }).__before = new Set(document.getAnimations()) })
  await start()
  // Only the journey's own animations, just made (the page's CSS ones, like the names drawing on, run as they would)
  return page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))) // "Seal it again" starts on the next render
    const seen = (window as unknown as { __before: Set<Animation> }).__before
    const all = document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition) && !seen.has(a))
    for (const a of all) a.pause()
    ;(window as unknown as { __seq: Animation[] }).__seq = all
    return all.length
  })
}
const at = (page: Page, f: number) => page.evaluate((f) => {
  const all = (window as unknown as { __seq: Animation[] }).__seq, end = Math.max(...all.map((a) => Number(a.effect!.getComputedTiming().endTime)))
  for (const a of all) a.currentTime = f * end
  const css = (s: string) => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null }
  const box = (s: string) => document.querySelector(s)?.getBoundingClientRect()
  const op = (s: string) => Number(css(s)?.opacity ?? 0)
  const card = box(".letter-sealed .letter, .letter-stage .letter")!, env = box(".envelope")
  const over = !!env && env.left < card.right && env.right > card.left && env.top < card.bottom && env.bottom > card.top
  // How see-through the open envelope is: its own opacity times every box above it
  const through = (el: Element | null) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o }
  const open = document.querySelector(".envelope-drawn.is-open")
  return {
    words: op(".letter-scroll"), card: op(".letter-sealed"), sheet: op(".arrival-sheet"), envelope: op(".envelope-float"), over,
    closed: css(".envelope-drawn.is-closed")?.clipPath, openShown: op(".envelope-drawn.is-open"), paper: op(".envelope-paper"),
    paperY: css(".envelope-paper")?.transform, press: op(".envelope-press"),
    openLook: open && Number(css(".envelope-drawn.is-open")!.opacity) > 0 ? { strength: through(open), filter: css(".envelope-drawn.is-open")!.filter, blend: css(".envelope-drawn.is-open")!.mixBlendMode } : null,
  }
}, f)
const done = (page: Page) => page.evaluate(() => { for (const a of (window as unknown as { __seq: Animation[] }).__seq) a.finish() })

test("open, seal, open, seal: one step at a time, held at 0, 25, 50, 75 and 100%", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("ng-music", "off"))
  await page.goto("?h=sample")
  await expect(open(page)).toBeVisible()
  // Sealed: the bar has no paper of its own over the photo, colour or texture
  const bar = () => page.evaluate(() => [getComputedStyle(document.querySelector(".site-bar")!, "::before").opacity, getComputedStyle(document.querySelector(".site-bar")!, "::after").opacity])
  await expect.poll(bar).toEqual(["0", "0"])
  const check = (f: Awaited<ReturnType<typeof at>>, pct: number, what: string) => {
    expect([0, 1], `${what} ${pct}%: the card is never half see-through`).toContain(f.card)
    expect([0, 1], `${what} ${pct}%: nor the sheet on its way`).toContain(f.sheet)
    expect(f.words > 0 && f.card > 0 && f.envelope > 0 && f.over, `${what} ${pct}%: no words under the envelope`).toBe(false)
    // Her open envelope, whenever it's on screen and not on its way out under the card: full strength, nothing over it
    if (f.openLook) expect({ ...f.openLook, strength: f.envelope === 1 ? f.openLook.strength : 1 }, `${what} ${pct}%: the open envelope is her paper at full strength`).toEqual({ strength: 1, filter: "none", blend: "normal" })
  }

  // Open
  expect(await hold(page, () => page.locator(".envelope").evaluate((e: HTMLElement) => e.click()))).toBeGreaterThan(5)
  const opening = []
  for (const pct of [0, 25, 50, 75, 100]) { const f = await at(page, pct / 100); check(f, pct, "opening"); opening.push(f) }
  expect(opening[0]).toMatchObject({ card: 0, sheet: 0, envelope: 1 }) // the flap starts to open
  expect(opening[1].paperY, "25%: the letter is on its way out").not.toBe("none")
  expect(opening[4]).toMatchObject({ card: 1, words: 1, sheet: 0, envelope: 0 }) // the card, its words in
  await done(page)
  await expect(page.locator("#letter")).toBeFocused({ timeout: 3000 })
  await expect.poll(bar, { message: "open: the bar's paper is back" }).not.toEqual(["0", "0"])

  // Seal
  const reseal = page.getByRole("button", { name: "Seal it again" })
  expect(await hold(page, () => reseal.click())).toBeGreaterThan(5)
  const sealing = []
  for (const pct of [0, 25, 50, 75, 100]) {
    const f = await at(page, pct / 100); check(f, pct, "sealing"); sealing.push(f)
    if (info.project.name === "phone") await info.attach(`seal-${pct}`, { body: await page.screenshot({ animations: "allow", mask: [page.locator(".count-boxes")] }), contentType: "image/png" })
  }
  expect(sealing[0]).toMatchObject({ card: 1, words: 1, envelope: 0 }) // the card as it was, nothing over it
  expect(sealing[1]).toMatchObject({ card: 0, words: 0, sheet: 1 }) // its words gone, shrinking into the letter
  expect(sealing[2]).toMatchObject({ sheet: 0, paper: 1, openShown: 1, envelope: 1 }) // the letter going into the pocket
  expect(sealing[3].closed, "75%: the flap is closing").not.toBe("none")
  expect(sealing[4]).toMatchObject({ closed: expect.stringMatching(/^inset\(0px( 0px 0%)?\)$/), press: 0, paper: 0 }) // closed, the seal on, the float next
  expect((await at(page, 0.95)).press, "95%: the seal pressing on").toBe(1)
  await done(page)
  await expect(page.locator(".arrival-note-words")).toBeVisible({ timeout: 3000 })
  await expect(open(page)).toBeVisible()

  // Open and seal once more, straight through
  await page.locator(".envelope").evaluate((e: HTMLElement) => e.click())
  await expect(page.locator("#letter")).toBeFocused({ timeout: 4000 })
  await reseal.click()
  await expect(open(page)).toBeVisible({ timeout: 4000 })
  await expect(page.locator(".arrival-sheet")).toHaveCSS("opacity", "0")
  await expect(page.locator(".envelope-float")).toHaveCSS("animation-play-state", "running") // floating again
})

// Run 19: their faces stay clear of the envelope, its note and Open, at every phone size standing and lying down and
// at laptop sizes, in both themes. Boxes are drawn over the faces (red), the note (blue), the envelope (green) and Open
// (yellow) for the screenshot. The faces' box is the photo's face rect (scenes.json) where the photo lands on screen.
const phones = [[320, 568], [375, 667], [390, 844], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430]] as const
const laptops = [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]] as const
for (const theme of ["autumn", "lantern"] as const) test(`nothing covers their faces on the arrival (${theme})`, async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const scenes = JSON.parse(fs.readFileSync("src/content/scenes.json", "utf8")) as Record<string, { w: number; h: number; face?: number[]; wide?: { w: number; h: number; face?: number[] } }>
  await page.addInitScript((t) => { localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t); localStorage.setItem("ng-opened", "1") }, theme)
  await page.goto("?h=sample")
  // After "Seal it again" (still under reduced motion: it's just sealed), the same arrival as a first visit
  await page.getByRole("button", { name: "Seal it again" }).click()
  await expect(open(page)).toBeVisible()
  const sizes = info.project.name === "phone" ? phones : laptops
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h })
    await page.waitForFunction(([w, h]) => innerWidth === w && innerHeight === h, [w, h])
    await page.waitForTimeout(200) // the note re-places itself on the resize (a ResizeObserver, then a render)
    await expect(page.locator(".arrival-note-words"), `${w}×${h}: the note is there`).toBeVisible()
    const r = await page.evaluate((scenes) => {
      const layer = document.querySelector<HTMLElement>("[data-photo].opacity-100")!, img = layer.querySelector("img")!
      const s = scenes[layer.dataset.photo!], meta = matchMedia("(min-width: 1280px)").matches && s.wide ? s.wide : s
      const b = img.getBoundingClientRect(), k = Math.max(b.width / meta.w, b.height / meta.h)
      const [px, py] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100)
      const ox = b.left + (b.width - meta.w * k) * px, oy = b.top + (b.height - meta.h * k) * py, [x0, y0, x1, y1] = meta.face!
      const face = new DOMRect(ox + x0 * meta.w * k, oy + y0 * meta.h * k, (x1 - x0) * meta.w * k, (y1 - y0) * meta.h * k)
      const boxes = { face, words: document.querySelector(".arrival-note-words")!.getBoundingClientRect(), arrow: document.querySelector(".arrival-note-arrow")!.getBoundingClientRect(), envelope: document.querySelector(".envelope")!.getBoundingClientRect(), open: document.querySelector(".arrival-open")!.getBoundingClientRect() }
      document.querySelectorAll(".face-box").forEach((e) => e.remove())
      const colour = { face: "red", words: "blue", arrow: "blue", envelope: "lime", open: "yellow" }
      for (const [k, v] of Object.entries(boxes)) { const d = document.createElement("div"); d.className = "face-box"; Object.assign(d.style, { position: "fixed", zIndex: "99", left: `${v.x}px`, top: `${v.y}px`, width: `${v.width}px`, height: `${v.height}px`, outline: `2px solid ${colour[k as keyof typeof colour]}`, pointerEvents: "none" }); document.body.append(d) }
      const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      const names = Object.keys(boxes) as (keyof typeof boxes)[], overlaps: string[] = []
      for (const a of names) for (const b of names) if (a < b && !(a === "arrow" && b === "words") && hit(boxes[a], boxes[b])) overlaps.push(`${a} × ${b}`)
      return { overlaps, faceBottom: face.bottom / innerHeight, side: document.querySelector<HTMLElement>(".arrival-note")!.dataset.side, wide: innerWidth >= 1024, portrait: innerHeight > innerWidth, onScreen: [boxes.words, boxes.arrow].every((b) => b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight) }
    }, scenes)
    expect(r.overlaps, `${w}×${h}: nothing overlaps`).toEqual([])
    expect(r.onScreen, `${w}×${h}: the note is on screen`).toBe(true)
    if (!r.wide && r.portrait) { expect(r.faceBottom, `${w}×${h}: their faces in the top 45%`).toBeLessThanOrEqual(0.45); expect(r.side).toBe("above") }
    if (r.wide) expect(r.side, `${w}×${h}: beside the envelope`).not.toBe("above")
    if (w === 390 || w === 1440) await expect(page).toHaveScreenshot(`arrival-faces-${theme}-${w}.png`)
    else await info.attach(`faces-${w}x${h}`, { body: await page.screenshot(), contentType: "image/png" })
  }
})

// Lab run 19 (arrival-framing): on a first visit, sealed with motion on, the envelope sits clear below their faces at
// the four common phone widths in both themes (#178 gave 170 to 260 px; before it, 28 px over at 360). The faces'
// box is faceRect()'s sum (src/lib/face.ts).
for (const theme of ["autumn", "lantern"] as const) test(`the sealed envelope clears their faces at phone widths (${theme})`, async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone widths")
  const scenes = JSON.parse(fs.readFileSync("src/content/scenes.json", "utf8")) as Record<string, { w: number; h: number; face?: number[] }>
  await page.addInitScript((t) => { localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t) }, theme)
  for (const [w, h] of [[360, 780], [390, 844], [412, 915], [430, 932]] as const) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto("?h=sample")
    await expect(open(page)).toBeVisible()
    expect(await page.evaluate(() => [localStorage.getItem("ng-opened"), document.documentElement.hasAttribute("data-sealed")])).toEqual([null, true])
    await page.waitForFunction(() => document.querySelector<HTMLImageElement>("[data-photo].opacity-100 img")?.complete)
    await page.waitForTimeout(1000) // the sealed framing transitions in
    const gap = await page.evaluate((scenes) => {
      const layer = document.querySelector<HTMLElement>("[data-photo].opacity-100")!, img = layer.querySelector("img")!, meta = scenes[layer.dataset.photo!]
      const b = img.getBoundingClientRect(), k = Math.max(b.width / meta.w, b.height / meta.h)
      const [px, py] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100)
      const oy = b.top + (b.height - meta.h * k) * (Number.isNaN(py) ? 0.5 : py), ox = b.left + (b.width - meta.w * k) * (Number.isNaN(px) ? 0.5 : px)
      const [x0, y0, x1, y1] = meta.face!, env = document.querySelector(".arrival .envelope")!.getBoundingClientRect()
      const face = new DOMRect(ox + x0 * meta.w * k, oy + y0 * meta.h * k, (x1 - x0) * meta.w * k, (y1 - y0) * meta.h * k)
      return Math.round(env.top - face.bottom)
    }, scenes)
    console.log(`${theme} ${w}: envelope ${gap} px below their faces`)
    expect(gap, `${theme} ${w}×${h}: a gap between their faces and the envelope`).toBeGreaterThan(0)
  }
})
