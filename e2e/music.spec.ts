import { test, expect } from "@playwright/test"

// The song stops the moment the page is hidden or the phone locks (pagehide), and the Now Playing entry clears
test("hiding the page stops the song and clears Now Playing", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once is enough")
  await page.addInitScript(() => localStorage.setItem("ng-opened", "1"))
  await page.goto("?h=sample")
  await expect(page.locator("[data-music-toggle]").filter({ visible: true }).first()).toBeVisible() // it listens for the first tap once it's loaded
  await page.locator("#letter").click({ position: { x: 20, y: 200 } }) // the first tap starts it
  const state = () => page.evaluate(() => ({ playback: navigator.mediaSession.playbackState, title: navigator.mediaSession.metadata?.title ?? null }))
  await expect.poll(state, { timeout: 8000 }).toEqual({ playback: "playing", title: "Griffin & Nadia" })
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide")))
  expect(await state()).toEqual({ playback: "none", title: null })
})

// The song (docs/quality.md): light enough for a phone, and it loops cleanly (under a second's silence across the seam)
test("the song is small and loops with under a second of silence", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once is enough")
  await page.goto("?h=sample")
  const r = await page.evaluate(async () => {
    const data = await (await fetch("audio/song.mp3")).arrayBuffer(), bytes = data.byteLength
    const a = await new OfflineAudioContext(2, 44100, 44100).decodeAudioData(data)
    const ch = a.getChannelData(0), n = ch.length
    let s = 0; while (s < n && Math.abs(ch[s]) < 0.001) s++
    let e = n - 1; while (e > 0 && Math.abs(ch[e]) < 0.001) e--
    return { kbps: (bytes * 8) / a.duration / 1000, mb: bytes / 1e6, seamMs: ((s + n - 1 - e) / a.sampleRate) * 1000 }
  })
  expect(r.kbps).toBeLessThan(160)
  expect(r.mb).toBeLessThan(3.5)
  expect(r.seamMs).toBeLessThan(1000)
})

test("the music credit is only in FAQs, in the last answer", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ng-opened", "1"))
  await page.goto("?h=sample")
  await page.waitForLoadState("networkidle")
  await expect(page.locator("body")).not.toContainText("Music:")
  await page.goto("faqs?h=sample")
  const last = page.locator("#letter [data-slot=accordion-item]").last()
  await last.locator("[data-slot=accordion-trigger]").click()
  await expect(last).toContainText("Who made this site?")
  await expect(last).toContainText("Music: “A Town With an Ocean View” (Joe Hisaishi).")
})

// Coming back to the tab: it carries on from where it stopped and is back at 20% within a second, not a slow restart.
// 18g: the level is the Web Audio gain node (iOS ignores audio.volume), so the tests read the gain
test("back on the tab, the song carries on from where it stopped, quickly back to 20%", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once is enough")
  await page.addInitScript(() => {
    localStorage.setItem("ng-opened", "1")
    const Orig = window.Audio
    window.Audio = function (src?: string) { const a = new Orig(src); (window as unknown as { __a: HTMLAudioElement }).__a = a; return a } as unknown as typeof Audio
  })
  await page.goto("?h=sample")
  await expect(page.locator("[data-music-toggle]").filter({ visible: true }).first()).toBeVisible()
  await page.locator("#letter").click({ position: { x: 20, y: 200 } })
  const a = () => page.evaluate(() => { const x = (window as unknown as { __a: HTMLAudioElement }).__a; return { t: x?.currentTime ?? 0, v: (window as unknown as { __ngGain?: () => number }).__ngGain?.() ?? 0, paused: x?.paused ?? true, element: x?.volume ?? 0 } })
  await expect.poll(async () => (await a()).v, { timeout: 9000 }).toBeGreaterThan(0.19)
  expect((await a()).v).toBeLessThanOrEqual(0.2)
  expect((await a()).element).toBe(1) // the element stays at full; the gain sets the level
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide")))
  const stopped = await a()
  expect(stopped.paused).toBe(true)
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow")))
  await page.waitForTimeout(1000)
  const back = await a()
  expect(back.paused).toBe(false)
  expect(back.t).toBeGreaterThanOrEqual(stopped.t)
  expect(back.v).toBeGreaterThan(0.19)
})

// 18e: the first touch anywhere starts it at once (no wait), easing out over about 2.5 s; 18g: to 20%, never above 25%
// (the gain node); until then the toggle shows it's waiting
test("the first tap starts the song at once, eases to 20% and never goes over 25%", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once is enough")
  await page.addInitScript(() => {
    localStorage.setItem("ng-opened", "1")
    const Orig = window.Audio
    window.Audio = function (src?: string) { const a = new Orig(src); (window as unknown as { __a: HTMLAudioElement }).__a = a; return a } as unknown as typeof Audio
  })
  await page.goto("?h=sample")
  const toggle = page.locator("[data-music-toggle]").filter({ visible: true }).first()
  await expect(toggle).toHaveAttribute("data-waiting", "true")
  await page.locator("#letter").tap({ position: { x: 20, y: 200 } })
  const v = () => page.evaluate(() => { const a = (window as unknown as { __a?: HTMLAudioElement }).__a; return a && !a.paused ? (window as unknown as { __ngGain?: () => number }).__ngGain?.() ?? 0 : -1 })
  await expect.poll(v, { timeout: 1500, intervals: [50] }).toBeGreaterThan(0)
  await expect(toggle).not.toHaveAttribute("data-waiting")
  // Eased out: well past half way at the half-way mark
  await page.waitForTimeout(1250)
  expect(await v()).toBeGreaterThan(0.15)
  let top = 0
  for (let i = 0; i < 20; i++) { top = Math.max(top, await v()); await page.waitForTimeout(100) }
  expect(top).toBeGreaterThan(0.19)
  expect(top).toBeLessThanOrEqual(0.25)
})

test("switched on with the toggle, it's at 20% within about half a second", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once is enough")
  await page.addInitScript(() => {
    localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off")
    const Orig = window.Audio
    window.Audio = function (src?: string) { const a = new Orig(src); (window as unknown as { __a: HTMLAudioElement }).__a = a; return a } as unknown as typeof Audio
  })
  await page.goto("?h=sample")
  const toggle = page.locator("[data-music-toggle]").filter({ visible: true }).first()
  await expect(toggle).not.toHaveAttribute("data-waiting")
  await toggle.tap()
  await expect.poll(() => page.evaluate(() => (window as unknown as { __ngGain?: () => number }).__ngGain?.() ?? 0), { timeout: 1200, intervals: [50] }).toBeGreaterThan(0.19)
})
