import { test, expect } from "@playwright/test"

// FAQs in the order guests ask (docs/quality.md). Run 19 regrouped them the way a guest wonders, reading the invite:
// who's invited and what kind of day it is, then getting ready (dress, food, gifts), the trip (visas), the site (their
// details), and who made the site last. In Japanese the same order.
test("the questions come in the order guests ask them", async ({ page }) => {
  for (const [lang, qs] of [
    ["en", ["Can I bring someone?", "Is it a traditional Japanese wedding?", "What should I wear?", "What about food?", "Gifts?", "Do I need a visa?", "What happens to my details?", "Who made this site?"]],
    ["ja", ["同伴者を連れていけますか？", "日本の伝統的な結婚式ですか？", "服装は？", "お食事は？", "ご祝儀やプレゼントは？", "ビザは必要ですか？", "個人情報はどうなりますか？", "このサイトはどなたが作ったのですか？"]],
  ] as const) {
    await page.addInitScript((l) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-lang", l) }, lang)
    await page.goto("faqs?h=sample")
    await page.locator("#letter [data-slot=accordion-trigger]").first().waitFor()
    const shown = await page.locator("#letter [data-slot=accordion-trigger]").evaluateAll((els) => els.map((e) => e.textContent!.replace(/^[\d\s.]+/, "").trim()))
    expect(shown).toEqual(qs)
  }
})

// 18e journey map: where the words say "message us", there's a way to (final run: Ask us, the sheet, not an email link)
test("the end of FAQs has a way to ask Griffin and Nadia", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ng-opened", "1"))
  await page.goto("faqs?h=sample")
  await expect(page.locator("#letter")).toContainText("Can't see your question here? Ask us and we'll get back to you.")
  await expect(page.locator("#letter").getByRole("button", { name: "Ask us", exact: true })).toBeVisible()
})
