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
