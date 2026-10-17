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
