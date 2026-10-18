import { test, expect } from "@playwright/test"

// Final run: Ask us replaces every "email Griffin & Nadia". The FAQs end with it; as they type, up to three FAQs show
// under "Is this it?" (tapping one opens it); sending is one tap. Without an invite it asks for a name and an email.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") }) })

test("from the FAQs: matches as you type, one opens its FAQ, or send", async ({ page }) => {
  await page.goto("faqs?h=sample")
  await page.getByRole("button", { name: "Ask us", exact: true }).click()
  const d = page.getByRole("dialog")
  await expect(d.getByRole("heading", { name: "Ask Griffin & Nadia" })).toBeVisible()
  await expect(d.getByLabel("Your name")).toHaveCount(0) // the invite says who
  const q = d.getByLabel("Your question")
  await q.fill("what shoes should I wear")
  await expect(d.getByRole("heading", { name: "Is this it?" })).toBeVisible()
  const first = d.locator(".ask-match").first()
  const faq = await first.textContent()
  await first.click()
  await expect(page.getByRole("dialog")).toBeHidden()
  await expect(page.locator("#letter").getByRole("button", { name: new RegExp(faq!.replace(/[?]/g, "\\?")) })).toHaveAttribute("aria-expanded", "true")
  // Sending is still there
  await page.getByRole("button", { name: "Ask us", exact: true }).click()
  await page.getByRole("dialog").getByLabel("Your question").fill("Is there a bus from the hotel?")
  await page.getByRole("dialog").getByRole("button", { name: "Send" }).click()
  await expect(page.getByRole("dialog").getByText("Sent. We'll get back to you soon.")).toBeVisible()
})

test("no invite: a name and an email come with the question", async ({ page }) => {
  await page.goto("")
  await page.getByRole("button", { name: "Ask Griffin & Nadia" }).click()
  const d = page.getByRole("dialog")
  await d.getByLabel("Your question").fill("I lost my link")
  await d.getByRole("button", { name: "Send" }).click()
  await expect(d.getByRole("alert")).toContainText("doesn't look like an email")
  await d.getByLabel("Your name").fill("Sam")
  await d.getByLabel("Your email").fill("sam@example.com")
  await d.getByRole("button", { name: "Send" }).click()
  await expect(d.getByText("Sent. We'll get back to you soon.")).toBeVisible()
  await expect(page.locator('a[href^="mailto:"]').filter({ visible: true })).toHaveCount(0) // no email link unless the back end's down
})
