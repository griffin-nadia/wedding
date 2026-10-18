import { test, expect } from "@playwright/test"

// FAQs in the order guests ask (docs/quality.md): dress, travel and visas, plus-ones, gifts, food, the day, their
// details, and who made the site last. In Japanese the same order.
test("the questions come in the order guests ask them", async ({ page }) => {
  for (const [lang, qs] of [
    ["en", ["What should I wear?", "Do I need a visa?", "Can I bring someone?", "Gifts?", "What about food?", "Is it a traditional Japanese wedding?", "What happens to my details?", "Who made this site?"]],
    ["ja", ["服装は？", "ビザは必要ですか？", "同伴者を連れていけますか？", "ご祝儀やプレゼントは？", "お食事は？", "日本の伝統的な結婚式ですか？", "個人情報はどうなりますか？", "このサイトはどなたが作ったのですか？"]],
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
  await expect(page.locator("#letter").getByRole("button", { name: "Still wondering? Ask Griffin & Nadia" })).toBeVisible()
})
