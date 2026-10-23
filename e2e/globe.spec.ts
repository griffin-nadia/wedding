import { test, expect, type Page } from "@playwright/test"

// Final run: Our story's last stop is the painted globe. Run 25: one view per screen. Run 26: the stop shows the flat
// map (no three.js until the globe opens) and a Full screen control above it; that opens a dialog with Globe / Map in a fixed spot, + and
// − on the globe, Escape and the X back to the story. Chapter pins on both views go to their stop.
test.use({ launchOptions: { args: ["--hide-scrollbars", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } })
test.describe.configure({ timeout: 90_000 })
const toEnd = async (page: Page) => {
  await page.goto("our-story?h=sample")
  const next = page.getByRole("button", { name: /next chapter/i })
  await expect(next).toBeVisible()
  while (await next.isEnabled()) { await next.click(); await page.waitForTimeout(150) }
}
const webgl = (page: Page) => page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")))
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") }) })

test("the stop shows the flat map and no three.js; Full screen opens the globe with Globe / Map, and closes back to the story", async ({ page }) => {
  // Run 26: three.js is fetched only when the globe first opens full screen, never on the stop
  const three: string[] = []
  page.on("request", (r) => { if (/three\.module/.test(r.url())) three.push(r.url()) })
  await toEnd(page)
  test.skip(!(await webgl(page)), "no WebGL here")
  const stop = page.locator(".story-slide-map")
  await expect(stop.locator(".journey-flat")).toBeVisible({ timeout: 15_000 })
  // Brisbane and Victoria always named; one visual, no switch and no zoom on the stop
  await expect(stop.locator(".journey-flat-names .journey-place")).toHaveText(["Brisbane", "Victoria"])
  await expect(stop.locator(".journey-globe")).toHaveCount(0)
  await expect(stop.getByRole("radio")).toHaveCount(0)
  await expect(stop.getByRole("button", { name: "Zoom in" })).toHaveCount(0)
  await expect(stop.locator(".journey-legend")).toBeVisible()
  // The control centred above the map
  const open = page.getByRole("button", { name: "Open the map full screen" })
  const map = (await stop.locator(".journey-flat").boundingBox())!, ctl = (await open.boundingBox())!
  expect(ctl.y + ctl.height).toBeLessThanOrEqual(map.y + 1)
  expect(Math.abs(ctl.x + ctl.width / 2 - (map.x + map.width / 2))).toBeLessThan(2)
  await page.waitForTimeout(1500)
  expect(three).toEqual([])

  await open.click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("radio", { name: "Globe" })).toBeChecked()
  await expect(dialog.locator(".journey-globe canvas")).toHaveCount(1, { timeout: 30_000 })
  await expect(dialog.locator(".journey-globe")).toHaveAttribute("data-ready", "true")
  await expect(dialog.locator(".globe-pin")).toContainText("Kyoto, 15 Oct 2027")
  expect(three.length).toBeGreaterThan(0)
  await expect(dialog.getByRole("button", { name: "Zoom in" })).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Zoom out" })).toBeVisible()
  await expect(dialog.locator(".journey-legend")).toBeVisible()
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
  await expect(dialog.locator(".journey-flat .chapter-pin")).toHaveCount(await stop.locator(".chapter-pin").count())
  // Escape closes it, focus back on the control, the story where it was
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(open).toBeFocused()
  await expect(page.getByRole("button", { name: /next chapter/i })).toBeDisabled()
})

test("a chapter's pin goes to its stop", async ({ page }) => {
  await toEnd(page)
  await page.getByRole("button", { name: "Open the map full screen" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radio", { name: "Map" }).click()
  const pin = dialog.getByRole("button", { name: /Became friends/ })
  await expect(pin).toBeVisible()
  await pin.click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator(".story-slide:not([inert]) h2")).toHaveText("Became friends")
  await expect(page.locator(".story-track")).toBeFocused()
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
