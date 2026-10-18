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
  await page.getByRole("radio", { name: "Flat map" }).click()
  await expect(page.locator(".story-slide-map .journey-mini")).toBeVisible()
  await expect(page.locator(".journey-globe canvas")).toHaveCount(0)
  await toEnd(page)
  await expect(page.getByRole("radio", { name: "Flat map" })).toBeChecked()
})

test("no WebGL: it starts on the flat map", async ({ page }) => {
  await page.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, k: string, ...a: unknown[]) { return /webgl/.test(k) ? null : (o as (...x: unknown[]) => unknown).call(this, k, ...a) } as typeof o })
  await toEnd(page)
  await expect(page.getByRole("radio", { name: "Flat map" })).toBeChecked()
  await expect(page.locator(".story-slide-map .journey-mini")).toBeVisible()
})
