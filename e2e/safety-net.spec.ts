import { test, expect, type Page } from "@playwright/test"

// Run 19: the safety net against a blank page. Old or corrupt saved data is cleared, not read; a file that fails to
// load reloads the page once, past the cache, never in a loop; past that, a plain paper card says what to do.
// The same on both sizes, so laptop only (the suite is near its time limit).
test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== "laptop", "one size is enough")
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
})

const errors = (page: Page) => { const e: string[] = []; page.on("pageerror", (x) => e.push(x.message)); return e }
const documents = (page: Page) => { const d: string[] = []; page.on("request", (r) => { if (r.resourceType() === "document") d.push(r.url()) }); return d }

test("corrupt saved data: every page still opens", async ({ page }) => {
  const seen = errors(page)
  await page.addInitScript(() => {
    const bad: Record<string, string> = {
      "ng-store": "0", "ng-theme": "neon", "ng-lang": "fr", "ng-household": '{"token":"sample"}', "ng-draft-sample": '{"at":9e15,"form":1}',
      "ng-flying:sample": "{broken", "ng-tune": '{"overrides":{"all":"x"},"notes":5}', "ng-song-art": "[1]", "ng-fly-sample": "null",
    }
    for (const [k, v] of Object.entries(bad)) localStorage.setItem(k, v)
    sessionStorage.setItem("ng-content", '{"story":"x"}')
  })
  await page.goto("?h=sample&rsvp=1")
  await expect(page.getByRole("dialog")).toBeVisible()
  for (const path of ["travel?h=sample", "our-story?h=sample", "faqs?h=sample"]) {
    await page.goto(path)
    await expect(page.locator("#letter h1, #letter h2").first()).toBeVisible()
  }
  await expect(page.locator("#crash")).toHaveCount(0)
  expect(seen).toEqual([])
})

test("a missing page file: one reload past the cache, then the card, never a loop", async ({ page }) => {
  const docs = documents(page)
  await page.route(/\/assets\/travel-[^/]+\.js$/, (r) => r.fulfill({ status: 404, body: "" }))
  await page.goto("travel?h=sample")
  const card = page.locator("#crash")
  await expect(card.getByRole("heading", { name: "Something went wrong, try refreshing" })).toBeFocused()
  await expect(card.getByRole("link", { name: "Ask Griffin & Nadia" })).toHaveAttribute("href", "mailto:griffinandnadia@gmail.com")
  await expect(card.getByRole("button", { name: "Refresh" })).toBeVisible()
  await page.waitForTimeout(500)
  expect(docs).toHaveLength(2)
  expect(docs[1]).toMatch(/[?&]fresh=/)
})

test("a stale index file: it reloads once and the site opens", async ({ page }) => {
  const docs = documents(page)
  await page.route("**/assets/index-gone.js", (r) => r.fulfill({ status: 404, body: "" }))
  await page.route(/\/wedding\/(\?.*)?$/, async (r) => {
    if (r.request().url().includes("fresh=")) return r.continue()
    const res = await r.fetch()
    await r.fulfill({ response: res, body: (await res.text()).replace(/\/assets\/index-[^"]+\.js/, "/assets/index-gone.js") })
  })
  await page.goto("?h=sample")
  await expect(page.locator("#letter")).toBeVisible()
  await expect(page.locator("#crash")).toHaveCount(0)
  expect(docs).toHaveLength(2)
})

test("no WebGL: the paper stays plain and every page opens", async ({ page }) => {
  const seen = errors(page)
  await page.addInitScript(() => {
    localStorage.setItem("ng-paper", "on")
    const o = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, k: string, ...a: unknown[]) { return /webgl/.test(k) ? null : (o as (...x: unknown[]) => unknown).call(this, k, ...a) } as typeof o
  })
  await page.goto("?h=sample")
  await page.mouse.click(4, 4) // the first input makes the paper
  await page.waitForTimeout(600)
  await page.goto("our-story?h=sample")
  await expect(page.locator("#letter")).toBeVisible()
  await expect(page.locator("#crash")).toHaveCount(0)
  expect(seen).toEqual([])
})
