import { test, expect, type Page } from "@playwright/test"

// The reply form (docs/quality.md). Five steps of one question each (18f): who's coming, food, a song, travel dates
// and anything else, then the check; nobody coming goes straight to a note. Every step can be finished with every
// mix of answers, with the keyboard down or up (a phone keyboard is a shorter screen with a field in focus): Back /
// Next stay on screen just above it, and the focused field sits above them. Enter in a field only moves to the next
// field. Who's coming is a real radio group. The song search searches as you type, and picking a song closes the
// list. The sample household: Sam, Alex and a possible plus one. Nothing is sent anywhere (no back end).
test.describe.configure({ timeout: 180_000 })

async function openForm(page: Page) {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  await page.goto("?h=sample")
  await page.waitForLoadState("networkidle")
  await page.locator("#letter").getByRole("button", { name: /RSVP/ }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
}
/** The Next or Send that can be pressed right now */
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
  await page.waitForTimeout(450)
}
/** Next until the check step */
async function toCheck(page: Page) {
  const send = page.getByRole("dialog").getByRole("button", { name: /^Send our reply$/ })
  for (let i = 0; i < 5 && !(await send.isVisible()); i++) await press(page, /^Next$/)
}
/** With the keyboard up: Back / Next on screen, and the field fully above them */
async function aboveKeyboard(page: Page) {
  const dialog = page.getByRole("dialog")
  const bar = await dialog.locator(".rsvp-actions").boundingBox()
  expect(bar).not.toBeNull()
  expect(bar!.y + bar!.height).toBeLessThanOrEqual(480)
  const field = await page.evaluate(() => document.activeElement!.getBoundingClientRect().bottom)
  expect(field).toBeLessThanOrEqual(bar!.y + 1)
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
      const anyone = sam === "yes" || alex === "yes" || plus
      await expect(dialog.getByText(`Step 2 of ${anyone ? 5 : 3}`)).toBeVisible()
      // Food: dietary for the first person coming, then the keyboard up in the field touched
      if (anyone) {
        await expect(dialog.getByRole("heading", { name: "Any dietary needs?" })).toBeVisible()
        if (diet !== "none") {
          const group = dialog.getByRole("group").first()
          if (diet === "chip+other") await group.getByRole("button", { name: "Vegetarian" }).click()
          await group.getByRole("button", { name: "Other" }).click()
          const more = dialog.getByLabel(/Tell us more/).first()
          await expect(more).toBeVisible()
          if (diet === "other+words") await more.fill("No kiwi")
          if (typing) { await more.focus(); await keyboard(page, true); await aboveKeyboard(page); await keyboard(page, false) }
        }
        await press(page, /^Next$/)
        await expect(dialog.getByRole("heading", { name: /song for the dance floor/ })).toBeVisible()
        await press(page, /^Next$/)
        await expect(dialog.getByText("Arriving")).toBeVisible()
      }
      // Anything else (with the dates, or on its own when nobody's coming)
      if (typing) { await dialog.getByLabel(/Anything else/).focus(); await keyboard(page, true); await aboveKeyboard(page) }
      await press(page, /^Next$/)
      if (typing) await keyboard(page, false)
      // The check, and the review shows the Other words
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

test("the song search: as you type, pick one and the list closes, up to two, artwork kept", async ({ page }) => {
  let calls = 0
  await page.route("https://itunes.apple.com/**", (r) => { calls++; return r.fulfill({ json: { results: [
    { trackName: "September", artistName: "Earth, Wind & Fire", trackViewUrl: "", artworkUrl100: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" },
    { trackName: "September (Live)", artistName: "Earth, Wind & Fire", trackViewUrl: "" },
  ] } }) })
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await press(page, /^Next$/); await press(page, /^Next$/)
  const field = dialog.getByRole("searchbox", { name: "Search for a song" })
  await field.fill("S")
  await page.waitForTimeout(600)
  expect(calls).toBe(0) // one letter never searches
  await field.fill("Septem")
  const row = dialog.getByRole("button", { name: /September/ }).first()
  await expect(row).toBeVisible() // 300 ms after the last key
  expect(calls).toBe(1)
  await expect(field).toBeFocused() // typing keeps the keyboard
  // "Use what I typed" is the last row
  await expect(dialog.locator(".song-results li").last()).toContainText("Use what I typed")
  const top = await field.evaluate((e) => e.getBoundingClientRect().top)
  await row.click()
  // The list closes, the field empties, the song is a row with its artwork, and nothing jumped
  await expect(dialog.locator(".song-results")).toHaveCount(0)
  await expect(field).toHaveValue("")
  expect(await field.evaluate((e) => e.getBoundingClientRect().top)).toBe(top)
  const card = dialog.getByRole("list", { name: "Your songs" }).getByRole("listitem")
  await expect(card).toHaveCount(1)
  await expect(card.locator("img.song-art")).toHaveCount(1)
  // The button searches too, and what was typed can be used as it is: two songs, then the field goes
  await field.fill("Our own song")
  await dialog.getByRole("button", { name: "Search", exact: true }).click()
  await expect(field).not.toBeFocused() // the button puts the keyboard away
  await dialog.getByRole("button", { name: /Use what I typed/ }).click()
  await expect(card).toHaveCount(2)
  await expect(dialog.getByText("2 songs added. Remove one to change it.")).toBeVisible()
  // Reset: remove one and the search is back
  await card.getByRole("button", { name: "Remove Our own song" }).click()
  await expect(card).toHaveCount(1)
  await expect(field).toBeVisible()
  // Sent, closed and opened again (a new form, as after a reload): the saved song keeps its artwork from this device
  await press(page, /^Next$/); await toCheck(page); await press(page, /^Send our reply$/)
  await page.keyboard.press("Escape")
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ng-song-art") ?? "{}")))).toContain("September, Earth, Wind & Fire")
  await page.locator("#letter").getByRole("button", { name: /Change my reply/ }).first().click()
  await press(page, /^Next$/); await press(page, /^Next$/)
  await expect(dialog.getByRole("list", { name: "Your songs" }).locator("img.song-art")).toHaveCount(1)
})

test("Enter in a field goes to the next field, never the next step", async ({ page }) => {
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await press(page, /^Next$/)
  for (const i of [0, 1]) await dialog.getByRole("group").nth(i).getByRole("button", { name: "Other" }).click()
  const [a, b] = [dialog.getByLabel(/Tell us more/).nth(0), dialog.getByLabel(/Tell us more/).nth(1)]
  await a.fill("No kiwi"); await a.press("Enter")
  await expect(b).toBeFocused()
  await expect(dialog.getByText("Step 2 of 5")).toBeVisible()
  await b.press("Enter")
  await expect(b).not.toBeFocused() // the last field: the keyboard goes
  await expect(dialog.getByText("Step 2 of 5")).toBeVisible()
  // The note: Enter is a new line, and it grows to four lines, then scrolls inside
  await press(page, /^Next$/); await press(page, /^Next$/)
  const note = dialog.getByLabel(/Anything else/)
  const h0 = await note.evaluate((e) => e.getBoundingClientRect().height)
  await note.fill("one"); for (const w of ["two", "three", "four", "five", "six"]) { await note.press("Enter"); await note.pressSequentially(w) }
  await expect(note).toHaveValue("one\ntwo\nthree\nfour\nfive\nsix")
  const [h, sh] = await note.evaluate((e) => [e.getBoundingClientRect().height, e.scrollHeight])
  expect(h).toBeGreaterThan(h0)
  expect(h).toBeLessThanOrEqual(121)
  expect(sh).toBeGreaterThan(h)
  await expect(dialog.getByText("Step 4 of 5")).toBeVisible()
})

test("where are you flying from: type to filter, pick, and the map line follows", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await toCheck(page); await press(page, /^Send our reply$/)
  const city = dialog.getByRole("combobox", { name: "Where are you flying from?" })
  await city.fill("mel")
  await expect(dialog.getByRole("option")).toHaveText(["Melbourne"])
  await city.press("ArrowDown"); await city.press("Enter")
  await expect(city).toHaveValue("Melbourne")
  await expect(dialog.getByText("From Melbourne")).toBeVisible()
  await expect(dialog.locator(".journey-end .journey-you")).toHaveCount(1)
  await city.fill("zzz")
  await expect(dialog.locator(".combo-note")).toHaveText("Nothing matches. Try Somewhere else.")
  // Words that match nothing keep the last real choice (never another place)
  await city.press("Enter")
  await expect(city).toHaveValue("Melbourne")
  await expect(dialog.getByText("From Melbourne")).toBeVisible()
  // Typos and suburbs find the city, and the field shows it
  for (const [typed, shown] of [["Noeth Melb", "Melbourne"], ["Brunswick", "Melbourne"], ["Bondi", "Sydney"], ["Brisbne", "Brisbane"]]) {
    await city.fill(typed)
    await expect(dialog.getByRole("option").first()).toHaveText(shown)
    await city.press("Enter")
    await expect(city).toHaveValue(shown)
    await expect(dialog.getByText(`From ${shown}`)).toBeVisible()
  }
  // Leaving the field with a typo picks the best match too
  await city.fill("North Melbourne"); await city.blur()
  await expect(city).toHaveValue("Melbourne")
  // No "Elsewhere in Australia" row any more
  await city.fill("")
  await expect(dialog.getByRole("option", { name: /Elsewhere/ })).toHaveCount(0)
})

test("the sent letter: plain paper on the guest site for now (the made paper is lab only), no canvas, the hanko's ink", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await toCheck(page); await press(page, /^Send our reply$/)
  await dialog.getByRole("button", { name: "Draw one" }).click()
  await expect(dialog.locator(".omikuji-slip")).toBeVisible()
  await page.waitForTimeout(1500)
  const paper = await page.evaluate(() => ({
    canvases: document.querySelectorAll("canvas").length,
    live: document.documentElement.style.getPropertyValue("--paper-live"),
    ink: (() => { const h = getComputedStyle(document.querySelector(".hanko")!); return [h.filter.includes("ink-bleed"), (h.maskImage || h.webkitMaskImage).includes("texture-ink")] })(),
  }))
  expect(paper).toEqual({ canvases: 0, live: "", ink: [true, true] })
})

// 18e: once replied, Home shows one next step: travel dates if there are none yet (opening the dates step), else
// Plan your trip (Travel)
test("after a reply, Home's next step is the travel dates, then the trip", async ({ page }) => {
  await page.route("**/itunes.apple.com/**", (r) => r.fulfill({ json: { results: [] } }))
  await openForm(page)
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("radiogroup", { name: "Sam" }).getByText("Coming").click()
  await dialog.getByRole("radiogroup", { name: "Alex" }).getByText("Coming").click()
  await toCheck(page); await press(page, /^Send our reply$/)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  const next = page.locator("#letter .next-step")
  await expect(next.getByRole("button", { name: "Add your travel dates" })).toBeVisible()
  await next.getByRole("button", { name: "Add your travel dates" }).click()
  await expect(page.getByRole("dialog")).toContainText(/arriv|dates/i)
})

