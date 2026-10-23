import { test, expect, type Page } from "@playwright/test"

// Final run: Our story's last stop is the painted globe. Run 25: one view per screen. The stop shows the globe (the
// flat map with no WebGL) and a Full screen control above it; that opens a dialog with Globe / Map in a fixed spot, + and
// − on the globe, Escape and the X back to the story. Run 26c: no chapter pins; G and N mark Victoria and Brisbane.
test.use({ launchOptions: { args: ["--hide-scrollbars", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } })
test.describe.configure({ timeout: 90_000 })
test.use({ trace: "retain-on-failure" }) // run 26: a trace when the full-screen map is slow on CI
const toEnd = async (page: Page) => {
  await page.goto("our-story?h=sample")
  const next = page.getByRole("button", { name: /next chapter/i })
  await expect(next).toBeVisible()
  while (await next.isEnabled()) { await next.click(); await page.waitForTimeout(150) }
}
const webgl = (page: Page) => page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")))
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") }) })

test("the stop shows the globe; Full screen opens it with Globe / Map, and closes back to the story", async ({ page }) => {
  await toEnd(page)
  test.skip(!(await webgl(page)), "no WebGL here")
  const stop = page.locator(".story-slide-map")
  await expect(stop.locator(".journey-globe canvas")).toHaveCount(1, { timeout: 30_000 })
  await expect(stop.locator(".journey-globe")).toHaveAttribute("data-ready", "true")
  // Kyoto pinned with its date; Brisbane and Victoria always named; one visual, no switch and no zoom on the stop
  await expect(stop.locator(".globe-pin")).toContainText("Kyoto, 15 Oct 2027")
  await expect(stop.locator(".globe-place")).toHaveText(["NBrisbane", "GVictoria, Canada"]) // run 26c: N and G beside their places
  await expect(stop.locator(".journey-flat")).toHaveCount(0)
  await expect(stop.getByRole("radio")).toHaveCount(0)
  await expect(stop.getByRole("button", { name: "Zoom in" })).toHaveCount(0)
  await expect(stop.locator(".journey-legend")).toBeVisible()
  // The control centred above the globe
  const open = page.getByRole("button", { name: "Open the map full screen" })
  const map = (await stop.locator(".journey-globe").boundingBox())!, ctl = (await open.boundingBox())!
  expect(ctl.y + ctl.height).toBeLessThanOrEqual(map.y + 1)
  expect(Math.abs(ctl.x + ctl.width / 2 - (map.x + map.width / 2))).toBeLessThan(2)
  // Dragging sideways turns the globe, never the story
  const art = (await stop.locator(".journey-globe-art").boundingBox())!
  await page.mouse.move(art.x + art.width * 0.7, art.y + art.height / 2); await page.mouse.down()
  for (let i = 1; i <= 8; i++) await page.mouse.move(art.x + art.width * (0.7 - i * 0.06), art.y + art.height / 2)
  await page.mouse.up()
  await expect(page.getByRole("button", { name: /next chapter/i })).toBeDisabled()

  await open.click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("radio", { name: "Globe" })).toBeChecked()
  await expect(dialog.locator(".journey-globe canvas")).toHaveCount(1, { timeout: 30_000 })
  await expect(dialog.getByRole("button", { name: "Zoom in" })).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Zoom out" })).toBeVisible()
  await expect(dialog.locator(".journey-legend")).toBeVisible()
  // Run 26: the full-screen globe's box is the whole stage, so zoomed in it never shows as a square; + zooms it
  const vw = page.viewportSize()!.width
  expect((await dialog.locator(".journey-globe").boundingBox())!.width).toBeGreaterThanOrEqual(vw - 1)
  // Run 26c: no numbered chapter pins (Nadia's review); G and N beside Victoria and Brisbane instead
  await expect(dialog.locator(".chapter-pin")).toHaveCount(0)
  await expect(dialog.locator(".globe-place .home-mark")).toHaveText(["N", "G"])
  // The globe fits its box after a resize (the camera's distance is worked out again): the buffer has the box's shape
  const vp = page.viewportSize()!
  await page.setViewportSize({ width: 700, height: 500 }); await page.waitForTimeout(400)
  const fits = await dialog.locator(".journey-globe").evaluate((g) => { const c = g.querySelector("canvas")!; return Math.abs(c.width / c.height - g.clientWidth / g.clientHeight) < 0.02 })
  expect(fits).toBe(true)
  await page.setViewportSize(vp); await page.waitForTimeout(400)
  const toggle = (await dialog.locator(".journey-mode").boundingBox())!
  await dialog.getByRole("radio", { name: "Map" }).click()
  await expect(dialog.locator(".journey-flat")).toBeVisible()
  await expect(dialog.locator(".journey-globe")).toHaveCount(0)
  expect(await dialog.locator(".journey-mode").boundingBox()).toEqual(toggle) // the switch didn't move
  // The sample's 8 cities: Australia's 4 are one bundle, so 5 lines; the same pins as the globe
  await expect(dialog.locator(".journey-flat .journey-guest")).toHaveCount(5)
  await expect(dialog.locator(".journey-flat .journey-guest-bundle")).toHaveCount(1)
  await expect(dialog.locator(".journey-flat .chapter-pin")).toHaveCount(0)
  await expect(dialog.locator(".journey-flat .home-mark-letter")).toHaveText(["N", "G"])
  // Run 26: no paper planes under reduced motion (the lines are already drawn); + and − zoom the map too, 1x to 3x
  await expect(dialog.locator(".journey-plane")).toHaveCount(0)
  const viewBox = () => dialog.locator("svg.journey-flat-lines").getAttribute("viewBox")
  for (let i = 0; i < 5; i++) await dialog.getByRole("button", { name: "Zoom in" }).click()
  await expect.poll(viewBox).toMatch(/ 133\.33\d* 106\.66\d*$/) // 3x at most: a third of 400 × 320
  await expect(dialog.locator(".journey-flat")).toHaveAttribute("data-zoomed", "true")
  for (let i = 0; i < 5; i++) await dialog.getByRole("button", { name: "Zoom out" }).click()
  await expect.poll(viewBox).toBe("0 0 400 320")
  // Escape closes it, focus back on the control, the story where it was
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
  await expect(page.getByRole("button", { name: /next chapter/i })).toBeDisabled()
})

test("no WebGL: the stop shows the flat map, and Full screen opens on the map", async ({ page }) => {
  await page.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, k: string, ...a: unknown[]) { return /webgl/.test(k) ? null : (o as (...x: unknown[]) => unknown).call(this, k, ...a) } as typeof o })
  await toEnd(page)
  await expect(page.locator(".story-slide-map .journey-flat")).toBeVisible()
  // The canvas has the painting's size from the start, never the default 300 × 150
  expect(await page.locator(".story-slide-map .journey-flat-art").evaluate((c: HTMLCanvasElement) => [c.width, c.height])).not.toEqual([300, 150])
  await page.getByRole("button", { name: "Open the map full screen" }).click()
  await expect(page.getByRole("dialog").getByRole("radio", { name: "Map" })).toBeChecked()
})
