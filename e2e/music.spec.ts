import { test, expect } from "@playwright/test"

// The song stops the moment the page is hidden or the phone locks (pagehide), and the Now Playing entry clears
test("hiding the page stops the song and clears Now Playing", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once is enough")
  await page.addInitScript(() => localStorage.setItem("ng-opened", "1"))
  await page.goto("?h=sample")
  await expect(page.locator("[data-music-toggle]").filter({ visible: true }).first()).toBeVisible() // it listens for the first tap once it's loaded
  await page.locator("#letter").click({ position: { x: 20, y: 200 } }) // the first tap starts it, 2 s later
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
  await expect(last).toContainText("Music: “A Town With an Ocean View” by Joe Hisaishi, piano by Piano ZeroL.")
})

// Coming back to the tab: it carries on from where it stopped and is back at 30% within a second, not a slow restart
test("back on the tab, the song carries on from where it stopped, quickly back to 30%", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "once is enough")
  await page.addInitScript(() => {
    localStorage.setItem("ng-opened", "1")
    const Orig = window.Audio
    window.Audio = function (src?: string) { const a = new Orig(src); (window as unknown as { __a: HTMLAudioElement }).__a = a; return a } as unknown as typeof Audio
  })
  await page.goto("?h=sample")
  await expect(page.locator("[data-music-toggle]").filter({ visible: true }).first()).toBeVisible()
  await page.locator("#letter").click({ position: { x: 20, y: 200 } })
  const a = () => page.evaluate(() => { const x = (window as unknown as { __a: HTMLAudioElement }).__a; return { t: x?.currentTime ?? 0, v: x?.volume ?? 0, paused: x?.paused ?? true } })
  await expect.poll(async () => (await a()).v, { timeout: 9000 }).toBeGreaterThan(0.29)
  expect((await a()).v).toBeLessThanOrEqual(0.3)
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pagehide")))
  const stopped = await a()
  expect(stopped.paused).toBe(true)
  await page.evaluate(() => dispatchEvent(new PageTransitionEvent("pageshow")))
  await page.waitForTimeout(1000)
  const back = await a()
  expect(back.paused).toBe(false)
  expect(back.t).toBeGreaterThanOrEqual(stopped.t)
  expect(back.v).toBeGreaterThan(0.29)
})
