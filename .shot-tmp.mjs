import { chromium } from "@playwright/test"
const [out, ...pages] = process.argv.slice(2)
const b = await chromium.launch()
for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ["autumn", "lantern"]) {
  const c = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce", deviceScaleFactor: 1 })
  await c.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-theme", t) }, theme)
  const p = await c.newPage()
  for (const pg of pages) { await p.goto(`http://localhost:4173/wedding/${pg}?h=sample`); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${pg || "home"}-${w}-${theme}.png`, fullPage: w < 500 }) }
  await c.close()
}
await b.close()
