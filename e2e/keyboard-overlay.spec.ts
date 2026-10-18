import { test, expect, devices, type Page } from "@playwright/test"

// 18g: a phone keyboard overlays the page and nothing shrinks. Android Chrome (overlays-content, the VirtualKeyboard
// API) and an iPhone (the visual viewport shrinks, the page doesn't), at 390: with the keyboard up the card's (or the
// sheet's) top, width and corner radius and the photo's size are what they were with it down, and the focused field
// with its helper or error sits fully above the keyboard (and above Back / Next). Headless browsers have no keyboard,
// so each one is stood in for: the VirtualKeyboard API's rectangle, or the visual viewport's height.
const KB = 300
// Chromium in both (WebKit isn't installed here); the iPhone's user agent, touch and size
const phone = (d: (typeof devices)[string]) => { const { defaultBrowserType, ...rest } = d; void defaultBrowserType; return { ...rest, viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } }
const PROFILES = { android: phone(devices["Pixel 7"]), iphone: phone(devices["iPhone 13"]) }
test.describe.configure({ timeout: 120_000 })

async function setup(page: Page, kind: "android" | "iphone") {
  await page.addInitScript((kind) => {
    localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off")
    const w = window as unknown as { __kb: (h: number) => void }
    if (kind === "android") {
      let rect = new DOMRect(0, innerHeight, innerWidth, 0)
      const ls = new Set<() => void>()
      Object.defineProperty(navigator, "virtualKeyboard", { value: { overlaysContent: false, get boundingRect() { return rect }, addEventListener: (_: string, f: () => void) => ls.add(f), removeEventListener: (_: string, f: () => void) => ls.delete(f) } })
      w.__kb = (h) => { rect = new DOMRect(0, innerHeight - h, innerWidth, h); ls.forEach((f) => f()) }
    } else {
      let h = 0
      Object.defineProperty(visualViewport, "height", { get: () => innerHeight - h })
      w.__kb = (n) => { h = n; visualViewport!.dispatchEvent(new Event("resize")) }
    }
  }, kind)
}
const keyboard = async (page: Page, h: number) => { await page.evaluate((h) => (window as unknown as { __kb: (h: number) => void }).__kb(h), h); await page.waitForTimeout(450) }
/** The frame that must not move: the sheet if one is open, else the card; and the photo behind */
const frame = (page: Page) => page.evaluate(() => {
  const el = document.querySelector(".sheet") ?? document.querySelector(".letter")!
  const r = el.getBoundingClientRect(), sc = document.querySelector(".scene")?.getBoundingClientRect()
  return { top: Math.round(r.top), width: Math.round(r.width), radius: getComputedStyle(el).borderTopLeftRadius, photo: sc ? `${Math.round(sc.width)}x${Math.round(sc.height)}` : "" }
})
/** The focused field with its helper or error: fully above the keyboard, and above Back / Next where there are */
const clear = (page: Page, kb: number) => page.evaluate((kb) => {
  const f = document.activeElement as HTMLElement
  const box = (f.closest(".form-field, .combo-field, .inline-submit") ?? f).getBoundingClientRect()
  const footer = f.closest(".sheet")?.querySelector(".rsvp-actions")?.getBoundingClientRect()
  const limit = Math.min(innerHeight - kb, footer ? footer.top : Infinity)
  const s = (f.closest(".sheet-body, .letter-scroll") as HTMLElement).getBoundingClientRect()
  return { above: box.bottom <= limit + 1, inView: box.top >= s.top - 1, footerAbove: footer ? footer.bottom <= innerHeight - kb + 1 : true }
}, kb)

async function check(page: Page, focus: () => Promise<void>, name: string) {
  const before = await frame(page)
  await focus()
  await keyboard(page, KB)
  expect(await frame(page), `${name}: nothing moved or shrank`).toEqual(before)
  expect(await clear(page, KB), `${name}: the field is clear of the keyboard`).toEqual({ above: true, inView: true, footerAbove: true })
  await keyboard(page, 0)
  expect(await frame(page), `${name}: back where it was`).toEqual(before)
}

for (const kind of ["android", "iphone"] as const) test.describe(kind, () => {
  test.use(PROFILES[kind])
  test("the reply, every step, then flying from", async ({ page }) => {
    await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
    await setup(page, kind)
    await page.goto("?h=sample")
    await page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()
    const d = page.getByRole("dialog")
    await d.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
    await d.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
    await d.getByText("Bringing someone?").click()
    const next = async () => { await page.evaluate(() => (document.activeElement as HTMLElement)?.blur()); await d.getByRole("button", { name: /^Next$/ }).click() }
    await check(page, () => d.getByLabel("Their name").focus(), "who: their name"); await next()
    await d.getByRole("group").first().getByRole("button", { name: "Other" }).click()
    await check(page, () => d.getByLabel(/Tell us more/).first().focus(), "food: tell us more"); await next()
    await check(page, () => d.getByRole("searchbox").focus(), "song: search"); await next()
    await check(page, () => d.getByLabel(/Anything else/).focus(), "travel: anything else"); await next()
    await d.getByRole("button", { name: /^Send our reply$/ }).click()
    await expect(d.getByText(/^(Sent|Updated)\./)).toBeVisible() // "Sending…" becomes two lines once sent
    await check(page, () => d.getByRole("combobox", { name: /Where are you flying from\?|Or type your city/ }).focus(), "flying from")
  })
  test("can't find your invite", async ({ page }) => {
    await setup(page, kind)
    await page.goto("")
    await page.getByLabel("Your email").waitFor()
    await page.waitForTimeout(500)
    await check(page, () => page.getByLabel("Your email").focus(), "your email")
  })
})
