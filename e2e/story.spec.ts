import { test, expect, type Page } from "@playwright/test"

// Our story's transitions (docs/quality.md): the next print comes in turned and settles straight, the words
// cross-fade, a drag follows the finger, a swipe on the story never turns the page, and under reduced motion it only
// fades.
const open = async (page: Page) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("our-story?h=sample")
  await page.waitForLoadState("networkidle")
}
/** For each stop: its print's rotation in degrees and x offset, its words' opacity, and whether it's drawn */
const stops = (page: Page) => page.locator(".story-slide").evaluateAll((els) => els.map((s) => {
  const m = new DOMMatrix(getComputedStyle(s.querySelector(".story-media")!).transform)
  const w = s.querySelector(".story-words")
  return { deg: Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI * 10) / 10, x: Math.round(m.e), words: w ? +getComputedStyle(w).opacity : 1, shown: getComputedStyle(s).visibility !== "hidden", opacity: +getComputedStyle(s).opacity }
}))
const current = (page: Page) => page.locator(".journey-dots span").evaluateAll((d) => d.findIndex((s) => s.classList.contains("is-on")))

test.describe("with motion", () => {
  test.use({ reducedMotion: "no-preference" })

  test("the next print comes in turned and settles straight; the words cross-fade", async ({ page }) => {
    await open(page)
    await page.getByRole("button", { name: /next/i }).click()
    await page.waitForTimeout(90)
    const mid = await stops(page)
    expect(mid[1].shown).toBe(true)
    expect(mid[1].deg).toBeGreaterThan(0.5) // still turned on the way in
    expect(mid[1].words).toBeLessThan(1) // its words are still fading in (the opener has none to fade out)
    // Settled (the spring takes about 450 ms; a busy moment, like the paper being made, can stretch it a little)
    await expect.poll(async () => (await stops(page))[1], { timeout: 3000 }).toMatchObject({ deg: 0, x: 0, words: 1, shown: true })
    const rest = await stops(page)
    expect(rest.filter((s) => s.shown)).toHaveLength(1)
    expect(await current(page)).toBe(1)
  })

  test("a drag follows the finger, and a swipe on the story never turns the page", async ({ page }, info) => {
    await open(page)
    const box = (await page.locator(".story-track").boundingBox())!, y = box.y + box.height / 2, x = box.x + box.width * 0.8
    const finger = info.project.name === "phone" ? await page.context().newCDPSession(page) : null
    const at = async (type: "start" | "move" | "end", px: number) => {
      if (finger) await finger.send("Input.dispatchTouchEvent", { type: `touch${type[0].toUpperCase()}${type.slice(1)}` as "touchStart", touchPoints: type === "end" ? [] : [{ x: px, y }] })
      else if (type === "start") { await page.mouse.move(px, y); await page.mouse.down() } else if (type === "move") await page.mouse.move(px, y); else await page.mouse.up()
    }
    await at("start", x)
    for (let i = 1; i <= 10; i++) { await at("move", x - i * 12); await page.waitForTimeout(16) }
    const held = await stops(page)
    expect(held[1].shown).toBe(true) // the next stop is partly in, under the finger
    expect(held[1].x).toBeGreaterThan(0)
    await at("move", x - box.width * 0.5)
    await at("end", 0)
    await page.waitForTimeout(900)
    expect(await current(page)).toBe(1)
    expect(new URL(page.url()).pathname).toMatch(/our-story/)
  })
})

test("reduced motion: the stops fade, nothing moves or turns", async ({ page }) => {
  await open(page) // the projects run with reduced motion
  await page.getByRole("button", { name: /next/i }).click()
  await page.waitForTimeout(60)
  const s = await stops(page)
  for (const stop of s) expect(stop).toMatchObject({ deg: 0, x: 0 })
  await page.waitForTimeout(300)
  expect((await stops(page))[1].opacity).toBe(1)
  expect(await current(page)).toBe(1)
})

// 18e: one input model on laptops. An arrow button, an arrow key and a trackpad swipe each move exactly one stop;
// a swipe's momentum tail never adds a second, and quick presses never skip or repeat one.
test("arrows, keys and a trackpad swipe each step exactly one stop", async ({ page }, info) => {
  test.skip(info.project.name !== "laptop", "a trackpad and a keyboard: laptops")
  await open(page)
  const track = page.locator(".story-track")
  await track.hover()
  // One swipe as a trackpad sends it: a push, then a long tail of momentum, 16 ms apart
  const swipe = async (dir: 1 | -1) => {
    for (const d of [8, 22, 40, 55, 48, 36, 28, 20, 14, 10, 7, 5, 3, 2, 1, 1]) { await page.mouse.wheel(d * dir, 1); await page.waitForTimeout(16) }
    await page.waitForTimeout(260) // the wheel goes quiet
  }
  await swipe(1); expect(await current(page)).toBe(1)
  await swipe(1); expect(await current(page)).toBe(2)
  await swipe(-1); expect(await current(page)).toBe(1)
  // Up and down is the page's, never a stop
  await page.mouse.wheel(0, 120); await page.waitForTimeout(260); expect(await current(page)).toBe(1)
  await track.focus()
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight")
  expect(await current(page)).toBe(4)
  await page.keyboard.press("ArrowLeft"); expect(await current(page)).toBe(3)
  const next = page.getByRole("button", { name: /next/i })
  await next.click(); await next.click()
  expect(await current(page)).toBe(5)
})

// 18f: every photo stop's print ends on the same line, so its caption sits in the same spot on every stop (a
// two-line title or a landscape print never moves it)
test("each print ends on the same line on every stop, captions right under it", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("our-story?h=sample")
  await page.waitForTimeout(800)
  const bottoms = await page.evaluate(() => [...document.querySelectorAll(".story-slide:not(.story-slide-map):not(.story-slide-opener)")]
    .map((s) => s.querySelector(".story-print > div, .story-print-blank")!.getBoundingClientRect().bottom))
  expect(bottoms.length).toBeGreaterThan(3)
  expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(6) // the prints' own small tilts
})
