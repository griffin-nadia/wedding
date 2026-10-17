import { test, expect, type Page } from "@playwright/test"

// The reply form (docs/quality.md). Every step can be finished with every mix of answers, with the keyboard down or
// up (a phone keyboard is a shorter screen with a field in focus), and Back / Next never sit on the keyboard. Who's
// coming is a real radio group. The song search only searches when asked, puts the keyboard away, and offers what
// was typed. The sample household: Sam, Alex and a possible plus one. Nothing is sent anywhere (no back end).
test.describe.configure({ timeout: 180_000 })

async function openForm(page: Page) {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("?h=sample")
  await page.waitForLoadState("networkidle")
  await page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
}
/** The Next or Send that can be pressed right now: the footer's, or with the keyboard up the inline pair's */
async function press(page: Page, name: RegExp) {
  const button = page.getByRole("dialog").getByRole("button", { name }).filter({ visible: true })
  await expect(button).toHaveCount(1)
  await button.scrollIntoViewIfNeeded()
  await button.click()
}
/** A phone keyboard: the screen gets shorter while a field has focus (Android resizes the page like this) */
async function keyboard(page: Page, up: boolean) {
  const { width } = page.viewportSize()!
  await page.setViewportSize({ width, height: up ? 480 : 844 })
  await page.waitForTimeout(150)
}

const DIETS = ["none", "other", "other+words", "chip+other"] as const
for (const sam of ["yes", "no"] as const) for (const alex of ["yes", "no"] as const) for (const plus of [false, true]) {
  test(`every step completes: Sam ${sam}, Alex ${alex}, plus one ${plus ? "yes" : "no"}`, async ({ page }, info) => {
    const phone = info.project.name === "phone"
    const diets = sam === "yes" || alex === "yes" ? DIETS : (["none"] as const)
    for (const diet of diets) for (const typing of phone ? [false, true] : [false]) {
      await openForm(page)
      const dialog = page.getByRole("dialog")
      await dialog.getByRole("radiogroup", { name: "Sam" }).getByText(sam === "yes" ? "Coming" : "Can't make it").click()
      await dialog.getByRole("radiogroup", { name: "Alex" }).getByText(alex === "yes" ? "Coming" : "Can't make it").click()
      if (plus) {
        await dialog.getByText("Bringing someone?").click()
        const name = dialog.getByLabel("Their name")
        await name.fill("Jo")
        if (typing) await keyboard(page, true)
      }
      await press(page, /^Next$/)
      if (typing) await keyboard(page, false)
      // Step 2: dietary for the first person coming, then the keyboard up in the last field touched
      if (diet !== "none") {
        const group = dialog.getByRole("group").first()
        if (diet === "chip+other") await group.getByRole("button", { name: "Vegetarian" }).click()
        await group.getByRole("button", { name: "Other" }).click()
        const more = dialog.getByLabel(/Tell us more/).first()
        await expect(more).toBeVisible()
        if (diet === "other+words") await more.fill("No kiwi")
        if (typing) await more.focus()
      } else if (typing) await dialog.getByLabel(/Anything else/).focus()
      if (typing) {
        await keyboard(page, true)
        // Never on the keyboard: the sticky footer has stepped aside, the inline pair is at the end of the form
        await expect(dialog.locator(".rsvp-actions")).toBeHidden()
        await expect(dialog.locator(".rsvp-actions-inline")).toBeVisible()
      }
      await press(page, /^Next$/)
      if (typing) await keyboard(page, false)
      // Step 3: the check, and the review shows the Other words
      if (diet === "other+words") await expect(dialog.getByText(/Other: No kiwi/)).toBeVisible()
      await press(page, /^Send our reply$/)
      await expect(dialog.getByRole("heading", { name: /all set|letting us know|got it/ })).toBeVisible()
      await page.evaluate(() => localStorage.clear())
    }
  })
}

test("Who's coming is a radio group: Tab lands on it, the arrow keys choose", async ({ page }) => {
  await openForm(page)
  const sam = page.getByRole("radiogroup", { name: "Sam" })
  await expect(sam.getByRole("radio")).toHaveCount(2)
  await sam.getByRole("radio", { name: "Coming" }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(sam.getByRole("radio", { name: "Can't make it" })).toBeChecked()
  await page.keyboard.press("ArrowLeft")
  await expect(sam.getByRole("radio", { name: "Coming" })).toBeChecked()
  // Each half is a 44px target or more
  for (const box of await sam.locator(".radio-option").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(box).toBeGreaterThanOrEqual(44)
  // Next with Alex unanswered moves focus to Alex's choice
  await page.getByRole("dialog").getByRole("button", { name: "Next" }).click()
  await expect(page.getByRole("radiogroup", { name: "Alex" }).getByRole("radio").first()).toBeFocused()
})

test("the song search searches only when asked, then puts the keyboard away", async ({ page }) => {
  let calls = 0
  await page.route("https://itunes.apple.com/**", (r) => { calls++; return r.fulfill({ json: { results: [
    { trackName: "September", artistName: "Earth, Wind & Fire", trackViewUrl: "", artworkUrl100: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
    { trackName: "September (Live)", artistName: "Earth, Wind & Fire", trackViewUrl: "" },
  ] } }) })
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await dialog.getByRole("button", { name: "Next" }).click()
  const field = dialog.getByRole("searchbox", { name: /song for the dance floor/ })
  await field.fill("Septem")
  await page.waitForTimeout(800)
  expect(calls).toBe(0) // typing alone never searches
  await field.press("Enter")
  const row = dialog.getByRole("button", { name: /September/ }).first()
  await expect(row).toBeVisible()
  expect(calls).toBe(1)
  await expect(field).not.toBeFocused() // the keyboard has gone
  await expect(dialog.getByRole("button", { name: /Use what I typed/ })).toBeVisible()
  await row.click()
  await expect(row).toHaveAttribute("aria-pressed", "true")
  const card = dialog.getByRole("list", { name: "Your songs" }).getByRole("listitem")
  await expect(card).toHaveCount(1)
  // Change puts it back into the search
  await card.getByRole("button", { name: /^Change/ }).click()
  await expect(card).toHaveCount(0)
  await expect(field).toHaveValue("September")
  await expect(field).toBeFocused()
  // The search button searches too, and what was typed can be used as it is
  await field.fill("Our own song")
  await dialog.getByRole("button", { name: "Search", exact: true }).click()
  await dialog.getByRole("button", { name: /Use what I typed/ }).click()
  await expect(dialog.getByRole("list", { name: "Your songs" }).getByRole("button", { name: "Change Our own song" })).toBeVisible()
})

test("where are you flying from: type to filter, pick, and the map line follows", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await press(page, /^Next$/); await press(page, /^Next$/); await press(page, /^Send our reply$/)
  const city = dialog.getByRole("combobox", { name: "Where are you flying from?" })
  await city.fill("mel")
  await expect(dialog.getByRole("option")).toHaveText(["Melbourne"])
  await city.press("ArrowDown"); await city.press("Enter")
  await expect(city).toHaveValue("Melbourne")
  await expect(dialog.getByText("From Melbourne")).toBeVisible()
  await expect(dialog.locator(".journey-end .journey-you")).toHaveCount(1)
  await city.fill("zzz")
  await expect(dialog.locator(".combo-note")).toHaveText("Nothing matches. Try Somewhere else.")
})

test("the sent letter is paper you could hold, from images only (no canvas or shader on the guest site)", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await press(page, /^Next$/); await press(page, /^Next$/); await press(page, /^Send our reply$/)
  await dialog.getByRole("button", { name: "Draw one" }).click()
  await expect(dialog.locator(".omikuji-slip")).toBeVisible()
  const paper = await page.evaluate(() => ({
    canvases: document.querySelectorAll("canvas").length,
    paper: [".omikuji-slip", ".journey-end", ".rsvp-done"].map((s) => getComputedStyle(document.querySelector(s)!).backgroundImage.includes("paper-")),
    ink: (() => { const h = getComputedStyle(document.querySelector(".hanko")!); return [h.filter.includes("ink-bleed"), (h.maskImage || h.webkitMaskImage).includes("texture-ink")] })(),
  }))
  expect(paper).toEqual({ canvases: 0, paper: [true, true, true], ink: [true, true] })
})

// 18e: once replied, Home shows one next step: travel dates if there are none yet (opening the dates step), else
// Plan your trip (Travel)
test("after a reply, Home's next step is the travel dates, then the trip", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await press(page, /^Next$/); await press(page, /^Next$/); await press(page, /^Send our reply$/)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  const next = page.locator("#letter .next-step")
  await expect(next.getByRole("button", { name: "Add your travel dates" })).toBeVisible()
  await next.getByRole("button", { name: "Add your travel dates" }).click()
  await expect(page.getByRole("dialog")).toContainText(/arriv|dates/i)
})
