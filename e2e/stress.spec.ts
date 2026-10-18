import { test, expect, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

// The stress test (18e §10), the parts the sample household can show. The back-end ones (a household of 6, long
// names, slow or lost connections, a double Send, a bad link, two tabs) are in scripts/stress-api.mjs, against mocks.
const PAGES = ["", "the-day", "travel", "our-story", "faqs"]
const go = async (page: Page, path: string, lang = "en") => {
  await page.addInitScript((l) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-lang", l) }, lang)
  await page.goto(`${path}?h=sample`)
  await page.waitForLoadState("networkidle")
}
/** Nothing sticks out sideways: not the page, not anything inside the card */
const overflow = (page: Page) => page.evaluate(() => {
  const wide = document.scrollingElement!.scrollWidth > innerWidth + 1
  const card = document.getElementById("letter")!.getBoundingClientRect()
  const out = [...document.querySelectorAll("#letter *")].filter((e) => {
    const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === "hidden") return false
    if (e.closest(".jump-links ul, .story-track, .letter-scroll [style*='overflow'], .scroll-x")) return false // strips that scroll sideways on purpose
    return r.right > card.right + 1 || r.left < card.left - 1
  }).map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]}`)
  return { wide, out: [...new Set(out)].slice(0, 5) }
})

for (const lang of ["en", "ja"]) test(`320 wide, ${lang}: no page scrolls sideways or spills out of the card`, async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phones")
  await page.setViewportSize({ width: 320, height: 568 })
  for (const p of PAGES) { await go(page, p, lang); expect(await overflow(page), p || "home").toEqual({ wide: false, out: [] }) }
})

test("a phone on its side: the frame fits, the words still scroll, the page doesn't", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phones")
  await page.setViewportSize({ width: 844, height: 390 })
  for (const p of ["the-day", "travel"]) {
    await go(page, p)
    const m = await page.evaluate(() => { const s = document.querySelector(".letter-scroll")!, l = document.getElementById("letter")!.getBoundingClientRect(); s.scrollTop = 200; return { h: Math.round(l.height), scrolls: s.scrollTop > 0, page: document.scrollingElement!.scrollHeight <= innerHeight } })
    expect(m.h).toBeGreaterThan(120); expect(m.scrolls).toBe(true); expect(m.page).toBe(true)
  }
})

test("200% zoom on a laptop (720 wide): nothing spills, every page still reads", async ({ page }, info) => {
  test.skip(info.project.name !== "laptop", "laptops")
  await page.setViewportSize({ width: 720, height: 450 })
  for (const p of PAGES) { await go(page, p); expect(await overflow(page), p || "home").toEqual({ wide: false, out: [] }) }
})

test("after Fri 30 Apr 2027: no reply means a closed note with a way to ask them, no RSVP button", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2027-05-02T01:00:00Z"))
  await go(page, "")
  await expect(page.locator("#letter")).toContainText("Replies are closed now")
  await expect(page.locator("#letter").getByRole("button", { name: "Ask Griffin & Nadia" })).toBeVisible()
  await expect(page.locator("#letter").getByRole("button", { name: /RSVP by/ })).toHaveCount(0)
})

test("back and forward walk the tabs, each starting at its top", async ({ page }) => {
  await go(page, "")
  for (const p of ["the-day", "travel", "faqs"]) { await page.locator(`.site-nav a[href$='/${p}']`).click(); await expect(page).toHaveURL(new RegExp(`/${p}`)) }
  await page.evaluate(() => document.querySelector(".letter-scroll")!.scrollTo(0, 600))
  await page.goBack(); await expect(page).toHaveURL(/\/travel/)
  await page.goBack(); await expect(page).toHaveURL(/\/the-day/)
  await expect.poll(() => page.evaluate(() => document.querySelector(".letter-scroll")!.scrollTop)).toBe(0)
  await page.goForward(); await expect(page).toHaveURL(/\/travel/)
  await expect(page.locator("#letter h1")).toHaveText("Travel")
})

test("the reply form by keyboard alone, with every step clean in axe", async ({ page }, info) => {
  test.skip(info.project.name !== "laptop", "a keyboard: laptops")
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await go(page, "")
  await page.locator("#letter").getByRole("button", { name: /RSVP by/ }).focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  const axe = async (step: string) => {
    const r = await new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).include("[role=dialog]").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`), step).toEqual([])
  }
  await axe("who")
  // Tab to each person's choice and pick Coming with Space (a radio group: Tab in, arrows between, Space picks)
  const tabTo = async (test: string) => { for (let i = 0; i < 80; i++) { if (await page.evaluate(new Function(`return (${test})(document.activeElement)`) as () => boolean)) return; await page.keyboard.press("Tab") } throw new Error(`never reached ${test}`) }
  for (const [i, who] of ["Sam", "Alex"].entries()) {
    await tabTo(`(e) => e?.closest?.("[role=radiogroup]") === document.querySelectorAll("[role=dialog] [role=radiogroup]")[${i}]`)
    await page.keyboard.press("Space")
    await expect(dialog.getByRole("radiogroup", { name: who }).getByRole("radio", { checked: true })).toHaveCount(1)
  }
  for (const step of ["food", "song", "travel", "check"]) {
    await tabTo(`(e) => e?.textContent?.trim() === "Next" && e.offsetParent !== null`)
    await page.keyboard.press("Enter")
    await page.waitForTimeout(400)
    await axe(step)
  }
  await tabTo(`(e) => e?.textContent?.trim() === "Send our reply" && e.offsetParent !== null`)
  await page.keyboard.press("Enter")
  await expect(dialog.getByRole("button", { name: "Draw one" })).toBeVisible()
  await axe("sent")
})
