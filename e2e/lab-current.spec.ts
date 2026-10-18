import { test, expect, type Page } from "@playwright/test"

// 18f: the lab's "the site today" takes on Home, Travel and the reply must look like the live pages (the guest
// build), at 390 and 1440, so an experiment is only ever compared against what guests really see
const LAB = "lab-x2tyua87sy/lab-play.html"
const CASES = [
  { name: "home", x: "home-current", path: "?h=sample" },
  { name: "travel", x: "travel-current", path: "travel?h=sample" },
  { name: "rsvp", x: "rsvp-current", path: "?h=sample&rsvp=1" },
]
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
})
// The countdown's seconds, the toast and the lab's own note can differ; everything else must match
const CALM = ".home-countdown, .countdown, [data-countdown], .toast-region, .x-rsvp-current-note { visibility: hidden !important; }"
async function shot(page: Page) {
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(1500)
  for (const f of page.frames()) await f.addStyleTag({ content: CALM }).catch(() => {})
  await page.waitForTimeout(200)
  return (await page.screenshot({ animations: "disabled" })).toString("base64")
}
/** The share of pixels that differ by more than a little, compared in the browser */
async function differ(page: Page, a: string, b: string) {
  return page.evaluate(async ([a, b]) => {
    const load = async (s: string) => { const i = new Image(); i.src = `data:image/png;base64,${s}`; await i.decode(); return i }
    const [x, y] = await Promise.all([load(a), load(b)])
    const w = Math.min(x.width, y.width), h = Math.min(x.height, y.height)
    const px = (i: HTMLImageElement) => { const c = new OffscreenCanvas(w, h), g = c.getContext("2d")!; g.drawImage(i, 0, 0); return g.getImageData(0, 0, w, h).data }
    const p = px(x), q = px(y)
    let n = 0
    for (let k = 0; k < p.length; k += 4) if (Math.abs(p[k] - q[k]) + Math.abs(p[k + 1] - q[k + 1]) + Math.abs(p[k + 2] - q[k + 2]) > 48) n++
    return n / (w * h)
  }, [a, b])
}
for (const c of CASES) test(`the lab's current ${c.name} looks like the live page`, async ({ page }) => {
  await page.goto(c.path)
  const live = await shot(page)
  await page.goto(`${LAB}?x=${c.x}&h=sample&paper=off`)
  const lab = await shot(page)
  const d = await differ(page, live, lab)
  expect(d, `${(d * 100).toFixed(2)}% of pixels differ`).toBeLessThan(0.02)
})
