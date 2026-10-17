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
