import { test, expect } from "@playwright/test"

// Final run P: the letter rising out of the envelope is the card's own paper, the same colour token, corner tints and
// paper texture (same sheet, same scale, same blend) from the first frame to the last, in both themes. The opening is
// held at 0, 25, 50, 75 and 100% of its motion; at each, the envelope's letter is compared with the card it becomes,
// and the screen is screenshotted. The paper is made in the browser, so this test asks for it (ng-paper=on) and runs
// with software WebGL.
test.use({ reducedMotion: "no-preference", launchOptions: { args: ["--hide-scrollbars", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } })
test.describe.configure({ timeout: 180_000 }) // software WebGL on CI makes the paper slowly

for (const theme of ["autumn", "lantern"] as const) test(`the envelope's letter is the card's paper, frame by frame (${theme})`, async ({ page }) => {
  await page.addInitScript((t) => { localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t); localStorage.setItem("ng-paper", "on") }, theme)
  await page.goto("?h=sample")
  await expect(page.getByRole("button", { name: /^Open your invitation/ })).toBeVisible()
  test.skip(!(await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")))), "no WebGL here")
  await page.mouse.click(5, 5) // the first input starts the paper
  await expect(page.locator("html[data-paper]")).toHaveCount(1, { timeout: 30_000 })
  await page.waitForTimeout(500) // its 400 ms fade in
  // The float and anything else still moving, settled; then the opening starts and is held at its start
  await page.evaluate(() => { for (const a of document.getAnimations()) { a.pause(); if (!Number.isFinite(Number(a.effect?.getComputedTiming().endTime))) a.currentTime = 0 } }) // the float at its start
  // The opening's timer to the page (900 ms) is held until the frames are done; everything else runs as normal
  await page.evaluate(() => { const st = window.setTimeout; window.setTimeout = ((f: TimerHandler, ms?: number, ...a: unknown[]) => (ms === 900 ? 0 : st(f, ms, ...a))) as typeof window.setTimeout })
  await page.evaluate(() => (document.querySelector(".envelope") as HTMLElement).click())
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  const opening = await page.evaluate(() => {
    const all = document.getAnimations().filter((a) => (a.effect as KeyframeEffect)?.target instanceof Element && (a.effect as KeyframeEffect).target!.closest(".arrival, .letter-sealed") && Number.isFinite(Number(a.effect!.getComputedTiming().endTime)))
    for (const a of all) a.pause()
    ;(window as unknown as { __open: Animation[] }).__open = all
    return all.length
  })
  expect(opening).toBeGreaterThan(0)
  for (const pct of [0, 25, 50, 75, 100]) {
    const look = await page.evaluate((f) => {
      // One clock for the whole opening: f of the way to where its last part ends
      const all = (window as unknown as { __open: Animation[] }).__open, end = Math.max(...all.map((a) => Number(a.effect!.getComputedTiming().endTime)))
      for (const a of all) a.currentTime = f * end
      const paper = document.querySelector(".envelope-paper")!, card = document.querySelector(".letter-sealed .letter, #letter")!
      const of = (el: Element, pseudo?: string) => { const c = getComputedStyle(el, pseudo); return pseudo ? { image: c.backgroundImage, size: c.backgroundSize, blend: c.mixBlendMode, opacity: c.opacity } : { colour: c.backgroundColor } }
      // The card's corner tints are on its ::before; the envelope's letter carries the same two as background layers
      const tints = (s: string) => (s.match(/radial-gradient\([^)]*\([^)]*\)[^)]*\)/g) ?? []).join(" | ")
      return {
        colour: [of(paper).colour, of(card).colour],
        tints: [tints(getComputedStyle(paper).backgroundImage), tints(getComputedStyle(card, "::before").backgroundImage)],
        paper: [of(paper, "::after"), of(card, "::after")],
        visible: getComputedStyle(paper).opacity,
      }
    }, pct / 100)
    expect(look.colour[0], `${pct}%: the card's colour`).toBe(look.colour[1])
    expect(look.tints[0], `${pct}%: the card's corner tints`).toBe(look.tints[1])
    expect(look.paper[0], `${pct}%: the card's paper texture, scale and blend`).toEqual(look.paper[1])
    expect(look.paper[0].image, `${pct}%: the paper is there`).toContain("url(")
    // One shot at the held frame (the photo's drift on laptops never lets two in a row match), the countdown masked
    // The countdown is masked once the card shows (run 19: until then the card waits unseen, under the envelope)
    expect.soft(await page.screenshot({ animations: "allow", mask: pct >= 75 ? [page.locator(".count-boxes")] : [] })).toMatchSnapshot(`envelope-${theme}-${pct}.png`, { maxDiffPixelRatio: 0.02 })
  }
})
