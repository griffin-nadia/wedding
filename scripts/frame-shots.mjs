// node scripts/frame-shots.mjs [out-dir] — every tab at the top and the bottom of its scroll, at 390 and 1440, light and
// dark, against the built site on vite preview (npm run build, then npx vite preview --port 4173). Full shots go to
// out-dir (default .brief/shots, gitignored); one contact sheet per width to .brief/docs/runs/18e/. Prints the card's gap
// under the bar and above the dock (or the screen's bottom), and whether the page itself scrolls (it never should).
import { chromium, devices } from "@playwright/test"
import fs from "node:fs"

const out = process.argv[2] ?? ".brief/shots"
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(".brief/docs/runs/18e", { recursive: true })
const PAGES = ["", "the-day", "travel", "our-story", "faqs"]
const b = await chromium.launch()
for (const [name, opts] of [["390", { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }], ["1440", { viewport: { width: 1440, height: 900 } }]]) {
  const shots = []
  for (const theme of ["autumn", "lantern"]) {
    const c = await b.newContext({ ...opts, reducedMotion: "reduce" })
    await c.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-theme", t); localStorage.setItem("ng-music", "off") }, theme)
    const p = await c.newPage()
    for (const pg of PAGES) {
      await p.goto(`http://localhost:4173/wedding/${pg}?h=sample`); await p.waitForTimeout(900)
      for (const at of ["top", "bottom"]) {
        const m = await p.evaluate((at) => {
          const s = document.querySelector(".letter-scroll"); if (at === "bottom") s.scrollTop = s.scrollHeight
          const l = document.getElementById("letter").getBoundingClientRect(), bar = document.querySelector(".site-bar").getBoundingClientRect(), nav = document.querySelector(".site-nav").getBoundingClientRect()
          return `under bar ${Math.round(l.top - bar.bottom)}, above ${innerWidth < 768 ? "dock" : "edge"} ${Math.round((innerWidth < 768 ? nav.top : innerHeight) - l.bottom)}, page scrolls ${document.scrollingElement.scrollHeight > innerHeight}`
        }, at)
        await p.waitForTimeout(300)
        const file = `${out}/${pg || "home"}-${name}-${theme}-${at}.png`
        await p.screenshot({ path: file }); shots.push([`${pg || "home"} ${theme} ${at}`, file])
        console.log(`${pg || "home"} ${name} ${theme} ${at}: ${m}`)
      }
    }
    await c.close()
  }
  // The contact sheet: every shot small, labelled, in one picture
  const w = name === "390" ? 195 : 360, cols = name === "390" ? 10 : 5
  const page = await b.newPage({ viewport: { width: cols * (w + 8) + 8, height: 400 } })
  await page.setContent(`<body style="margin:0;padding:4px;background:#ddd;font:11px sans-serif;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:8px">${shots.map(([l, f]) => `<figure style="margin:0"><img style="width:${w}px;display:block" src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption>${l}</figcaption></figure>`).join("")}</body>`)
  await page.screenshot({ path: `.brief/docs/runs/18e/frame-${name}.jpg`, fullPage: true, type: "jpeg", quality: 70 })
  await page.close()
}
await b.close()
