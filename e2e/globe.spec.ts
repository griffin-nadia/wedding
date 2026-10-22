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
  // Kyoto pinned with its date. Run 24: Brisbane and Victoria always named; the Globe / Flat control centred above the
  // map (and in the same spot on the flat map, below); the key under both; + and − to zoom
  await expect(page.locator(".globe-pin")).toContainText("Kyoto, 15 Oct 2027")
  await expect(page.locator(".globe-pin")).toHaveAttribute("data-side", /left|right/)
  await expect(page.locator(".globe-place")).toHaveText(["Brisbane", "Victoria"])
  const map = (await page.locator(".journey-globe").boundingBox())!, mode = (await page.locator(".journey-mode").boundingBox())!
  expect(mode.y + mode.height).toBeLessThanOrEqual(map.y + 1)
  expect(Math.abs(mode.x + mode.width / 2 - (map.x + map.width / 2))).toBeLessThan(2)
  await expect(page.locator(".story-slide-map .journey-legend")).toBeVisible()
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible()
  // Dragging sideways turns the globe, never the story
  const art = (await page.locator(".journey-globe-art").boundingBox())!
  await page.mouse.move(art.x + art.width * 0.7, art.y + art.height / 2); await page.mouse.down()
  for (let i = 1; i <= 8; i++) await page.mouse.move(art.x + art.width * (0.7 - i * 0.06), art.y + art.height / 2)
  await page.mouse.up()
  await expect(page.getByRole("button", { name: /next chapter/i })).toBeDisabled()
  await expect(page.locator(".story-slide-map")).not.toHaveAttribute("inert")
  await page.getByRole("radio", { name: "Flat map" }).click()
  await expect(page.locator(".story-slide-map .journey-flat")).toBeVisible()
  expect(await page.locator(".journey-mode").boundingBox()).toEqual(mode) // the switch didn't move
  await expect(page.locator(".story-slide-map .journey-legend")).toBeVisible()
  // The sample's 8 cities: Australia's 4 are one bundle, so 5 lines
  await expect(page.locator(".journey-flat .journey-guest")).toHaveCount(5)
  await expect(page.locator(".journey-flat .journey-guest-bundle")).toHaveCount(1)
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
