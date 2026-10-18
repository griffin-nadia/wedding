import { test, expect, type Page } from "@playwright/test"

// Final run: Our story's last stop is the painted globe, with a Globe / Flat map toggle remembered on the device. No
// WebGL starts on the flat map; reduced motion still shows the globe, held facing Kyoto.
test.use({ launchOptions: { args: ["--hide-scrollbars", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } })
test.describe.configure({ timeout: 90_000 })
const toEnd = async (page: Page) => {
  await page.goto("our-story?h=sample")
  const next = page.getByRole("button", { name: /next chapter/i })
  await expect(next).toBeVisible()
  while (await next.isEnabled()) { await next.click(); await page.waitForTimeout(150) }
}
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") }) })

test("the globe, then the flat map, remembered", async ({ page }) => {
  await toEnd(page)
  test.skip(!(await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2")))), "no WebGL here")
  await expect(page.locator(".journey-globe canvas")).toHaveCount(1, { timeout: 30_000 })
  // Run 19: Kyoto pinned with its date; the Globe / Flat control sits inside the map's bottom corner
  await expect(page.locator(".globe-pin")).toContainText("Kyoto, 15 Oct 2027")
  await expect(page.locator(".globe-pin")).toHaveAttribute("data-side", /left|right/)
  const map = (await page.locator(".journey-globe").boundingBox())!, mode = (await page.locator(".journey-mode").boundingBox())!
  expect(mode.x + mode.width).toBeLessThanOrEqual(map.x + map.width + 1); expect(mode.y + mode.height).toBeLessThanOrEqual(map.y + map.height + 1)
  expect(mode.y).toBeGreaterThan(map.y + map.height / 2)
  // Dragging sideways turns the globe, never the story
  const art = (await page.locator(".journey-globe-art").boundingBox())!
  await page.mouse.move(art.x + art.width * 0.7, art.y + art.height / 2); await page.mouse.down()
  for (let i = 1; i <= 8; i++) await page.mouse.move(art.x + art.width * (0.7 - i * 0.06), art.y + art.height / 2)
  await page.mouse.up()
  await expect(page.getByRole("button", { name: /next chapter/i })).toBeDisabled()
  await expect(page.locator(".story-slide-map")).not.toHaveAttribute("inert")
  await page.getByRole("radio", { name: "Flat map" }).click()
  await expect(page.locator(".story-slide-map .journey-flat")).toBeVisible()
  await expect(page.locator(".journey-flat .journey-guest")).toHaveCount(8) // the sample household always shows the sample lines
  await expect(page.locator(".journey-globe canvas")).toHaveCount(0)
  await toEnd(page)
  await expect(page.getByRole("radio", { name: "Flat map" })).toBeChecked()
})

test("no WebGL: it starts on the flat map", async ({ page }) => {
  await page.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, k: string, ...a: unknown[]) { return /webgl/.test(k) ? null : (o as (...x: unknown[]) => unknown).call(this, k, ...a) } as typeof o })
  await toEnd(page)
  await expect(page.getByRole("radio", { name: "Flat map" })).toBeChecked()
  await expect(page.locator(".story-slide-map .journey-flat")).toBeVisible()
})
