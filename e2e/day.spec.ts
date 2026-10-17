import { test, expect } from "@playwright/test"

// The day's timeline (docs/quality.md): every row has its time on the left and what happens on the right, with its
// icon centred on the one line. In English and Japanese.
for (const lang of ["en", "ja"]) test(`timeline rows: time left, icon on the line, event right (${lang})`, async ({ page }) => {
  await page.addInitScript((l) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-lang", l) }, lang)
  await page.goto("the-day?h=sample")
  await page.waitForLoadState("networkidle")
  const rows = await page.evaluate(() => {
    const line = document.querySelector(".timeline-line")!.getBoundingClientRect(), mid = line.left + line.width / 2
    return [...document.querySelectorAll(".timeline-row")].map((r) => {
      const t = r.querySelector(".timeline-time")!, i = r.querySelector(".timeline-icon")!.getBoundingClientRect(), x = r.querySelector(".timeline-text")!.getBoundingClientRect()
      const range = document.createRange(); range.selectNodeContents(t); const tt = range.getBoundingClientRect()
      return { timeLeft: tt.right <= i.left, textRight: x.left >= i.right, onLine: Math.abs(i.left + i.width / 2 - mid) < 1.5 }
    })
  })
  expect(rows.length).toBeGreaterThan(2)
  for (const r of rows) expect(r).toEqual({ timeLeft: true, textRight: true, onLine: true })
})

// 18e: a time never breaks across lines ("3:30" / "pm"), nor does "until 3:30 pm", at the narrowest phone
test("times stay on one line at 320", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.addInitScript(() => localStorage.setItem("ng-opened", "1"))
  await page.goto("the-day?h=sample")
  await expect(page.locator(".timeline-text span.whitespace-nowrap").first()).toBeVisible()
  const broken = await page.evaluate(() => [...document.querySelectorAll(".timeline-time, .timeline-text span.whitespace-nowrap")].filter((e) => e.getClientRects().length > 1 || e.getBoundingClientRect().height > parseFloat(getComputedStyle(e).lineHeight) * 1.5).map((e) => e.textContent))
  expect(broken).toEqual([])
  expect(await page.locator(".timeline-text span.whitespace-nowrap").count()).toBeGreaterThan(0)
})
