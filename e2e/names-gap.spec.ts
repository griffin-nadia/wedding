import { test, expect } from "@playwright/test"

// Final run P: in Nadia's lettering, Griffin and Nadia sit the same distance from the "&", about the "&"'s own width,
// measured on the ink of the exported masks (scripts/art-export.mjs), not the image box
test("the names: the same gap either side of the \"&\", about its width", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "the masks are the same everywhere")
  await page.goto("?h=sample")
  const g = await page.evaluate(async () => {
    const cols = async (src: string) => {
      const i = new Image(); i.src = src; await i.decode()
      const c = new OffscreenCanvas(i.width, i.height), x = c.getContext("2d")!; x.drawImage(i, 0, 0)
      const px = x.getImageData(0, 0, i.width, i.height).data, on: boolean[] = []
      for (let X = 0; X < i.width; X++) { let ink = false; for (let y = 0; y < i.height && !ink; y++) ink = px[(y * i.width + X) * 4 + 3] > 8; on.push(ink) }
      return on
    }
    const base = "/wedding/"
    const N = await cols(`${base}art/names/names-mask-1040.webp`), A = await cols(`${base}art/names/amp-mask-1040.webp`)
    const aL = A.indexOf(true), aR = A.lastIndexOf(true)
    const gR = N.slice(0, aL).lastIndexOf(true), nL = aR + 1 + N.slice(aR + 1).indexOf(true)
    return { amp: aR - aL, left: aL - gR, right: nL - aR }
  })
  expect(Math.abs(g.left - g.right)).toBeLessThanOrEqual(2)
  expect(Math.abs(g.left - g.amp)).toBeLessThanOrEqual(4)
})

// Run 19 (6b): "N adia". Each word keeps the exact spacing of Nadia's 18 Oct drawing; only the gap to the "&" moved.
// The names as rendered at 1040 device px (520 CSS at 2x, the 1040 masks), in both themes, against the source's own ink
// columns at that scale (measured on private/nadia-art-18oct/lettering-dark-ink.png by .brief/tools/r19/names-overlay.mjs;
// numbers only, the art stays private): Griffin one stroke 432 wide; Nadia the N (157), a 14 gap, then "adia" (278).
// The N's gap is Nadia's own (26 px on her 2500 px drawing), not the cut.
test("the names as rendered keep the spacing of Nadia's drawing, word by word", async ({ browser }, info) => {
  test.skip(info.project.name !== "phone", "one render at 1040 is enough")
  const c = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce", baseURL: info.project.use.baseURL })
  const page = await c.newPage()
  for (const theme of ["light", "lantern"]) {
    await page.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t) }, theme)
    await page.goto("?h=sample")
    const el = page.locator(".names-lettering").first()
    await el.evaluate(async (e) => { e.style.width = "520px"; e.style.maxWidth = "none"; e.style.animation = "none"; await document.fonts.ready })
    await expect.poll(() => el.evaluate((e) => Math.round(e.getBoundingClientRect().width))).toBe(520)
    await page.waitForLoadState("networkidle")
    const png = (await el.screenshot()).toString("base64")
    const runs = await page.evaluate(async (d) => {
      const i = new Image(); i.src = `data:image/png;base64,${d}`; await i.decode()
      const cv = new OffscreenCanvas(i.width, i.height), x = cv.getContext("2d")!; x.drawImage(i, 0, 0)
      const px = x.getImageData(0, 0, i.width, i.height).data, W = i.width, H = i.height
      const ink = (o: number) => Math.abs(px[o] - px[0]) + Math.abs(px[o + 1] - px[1]) + Math.abs(px[o + 2] - px[2]) > 60 // against the corner's paper
      const out: [number, number][] = []; let s = -1
      for (let X = 0; X <= W; X++) {
        let on = false; if (X < W) for (let y = 0; y < H && !on; y++) on = ink((y * W + X) * 4)
        if (on && s < 0) s = X; if (!on && s >= 0) { out.push([s, X - 1]); s = -1 }
      }
      return { W, out }
    }, png)
    expect(runs.W).toBe(1040)
    // Words: the two widest gaps are either side of the "&"
    const r = runs.out, gaps = r.slice(1).map((q, i) => ({ i, g: q[0] - r[i][1] })).sort((a, b) => b.g - a.g).slice(0, 2).map((x) => x.i).sort((a, b) => a - b)
    const griffin = r.slice(0, gaps[0] + 1), nadia = r.slice(gaps[1] + 1)
    const near = (a: number, b: number) => expect(Math.abs(a - b), `${theme}: ${a} vs ${b} (${JSON.stringify(r)})`).toBeLessThanOrEqual(2)
    expect(griffin, theme).toHaveLength(1)
    near(griffin[0][1] - griffin[0][0], 432)
    expect(nadia, theme).toHaveLength(2)
    near(nadia[0][1] - nadia[0][0], 157)
    near(nadia[1][0] - nadia[0][1], 14)
    near(nadia[1][1] - nadia[1][0], 278)
  }
  await c.close()
})
