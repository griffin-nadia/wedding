import { test, expect, type Page } from "@playwright/test"

// Final run: Our story's last stop is the painted globe (the flat map with no WebGL), with a Full screen control above
// it that opens a dialog with Globe / Map in a fixed spot, + and −, Escape and the X back to the story.
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

// Run 27: the antique globe (journey-look.tsx, the looks picker's own view): one box whose paper curls between the globe
// and a map you drag round the world. The stop shows just the globe (no key, no count); full screen adds Globe / Map,
// + and − (0.6x to 3x), the key and the count.
test("the stop shows the globe; Full screen opens it with Globe / Map, and closes back to the story", async ({ page }) => {
  await toEnd(page)
  test.skip(!(await webgl(page)), "no WebGL here")
  const stop = page.locator(".story-slide-map")
  const box = stop.locator(".journey-look .x-g24-box")
  await expect(box).toBeVisible({ timeout: 30_000 })
  await expect(box.locator(".x-g24-wait")).toHaveCount(0, { timeout: 30_000 }) // painted
  await expect(box.locator("canvas")).toHaveCount(2) // the paper and the lines
  // Kyoto's seal with its date; N at Brisbane and G at Victoria; one view, no switch, no zoom, no key on the stop
  await expect(box.locator(".x-g24-kyoto")).toContainText("Kyoto, 15 Oct 2027")
  await expect(box.locator(".x-g24-badge")).toHaveText(["N", "G"])
  await expect(stop.getByRole("radio")).toHaveCount(0)
  await expect(stop.getByRole("button", { name: "Zoom in" })).toHaveCount(0)
  await expect(stop.locator(".journey-legend")).toHaveCount(0)
  // The control centred above the globe
  const open = page.getByRole("button", { name: "Open the map full screen" })
  const map = (await box.boundingBox())!, ctl = (await open.boundingBox())!
  expect(ctl.y + ctl.height).toBeLessThanOrEqual(map.y + 1)
  expect(Math.abs(ctl.x + ctl.width / 2 - (map.x + map.width / 2))).toBeLessThan(2)
  // Dragging sideways turns the globe (Kyoto's seal moves), never the story
  const kyoto = () => box.locator(".x-g24-mark").first().evaluate((e) => (e as HTMLElement).style.transform)
  const before = await kyoto()
  await page.mouse.move(map.x + map.width * 0.7, map.y + map.height / 2); await page.mouse.down()
  for (let i = 1; i <= 8; i++) await page.mouse.move(map.x + map.width * (0.7 - i * 0.04), map.y + map.height / 2)
  await page.mouse.up()
  await expect.poll(kyoto).not.toBe(before)
  await expect(page.getByRole("button", { name: /next chapter/i })).toBeDisabled()

  await open.click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("radio", { name: "Globe" })).toBeChecked()
  const full = dialog.locator(".journey-look .x-g24-box")
  await expect(full.locator(".x-g24-wait")).toHaveCount(0, { timeout: 30_000 })
  await expect(dialog.getByRole("button", { name: "Zoom in" })).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Zoom out" })).toBeVisible()
  await expect(dialog.locator(".journey-legend")).toBeVisible()
  await expect(dialog.locator(".chapter-pin")).toHaveCount(0)
  // The sample's 8 cities: Australia's 4 are one bundle, so 5 guest dots, each a button named for where it is
  await expect(full.locator(".x-g24-dot")).toHaveCount(5)
  // + magnifies (the seal moves away from the middle), − goes below where it opened
  const seal = () => full.locator(".x-g24-mark").first().evaluate((e) => { const m = new DOMMatrix(getComputedStyle(e).transform); return [m.e, m.f] })
  const box0 = (await full.boundingBox())!, mid = [box0.width / 2, box0.height / 2]
  const dist = async () => { const [x, y] = await seal(); return Math.hypot(x - mid[0], y - mid[1]) }
  const d0 = await dist()
  await dialog.getByRole("button", { name: "Zoom in" }).click(); await page.waitForTimeout(300)
  expect(await dist()).toBeGreaterThan(d0 * 1.2)
  for (let i = 0; i < 4; i++) await dialog.getByRole("button", { name: "Zoom out" }).click()
  await page.waitForTimeout(300)
  expect(await dist()).toBeLessThan(d0)
  // Globe / Map in one fixed spot; Map opens the same paper out flat
  const toggle = (await dialog.locator(".journey-mode").boundingBox())!
  await dialog.getByRole("radio", { name: "Map" }).click()
  await expect(full).toHaveAttribute("data-mode", "flat")
  expect(await dialog.locator(".journey-mode").boundingBox()).toEqual(toggle)
  // No paper planes under reduced motion (the lines are already drawn)
  await expect(dialog.locator(".journey-plane")).toHaveCount(0)
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
