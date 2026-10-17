// node scripts/lab-thumbs.mjs [port]: the lab index's thumbnails: each playground experiment at phone size, after it
// has settled, saved small as src/lab/thumbs/<id>.webp. Needs the dev server running (npm run lab, or npx vite) on the
// port (5173 by default). Local only, like the lab: the thumbnails are only ever imported by the lab.
import { chromium, devices } from "@playwright/test"
import fs from "node:fs"

const port = process.argv[2] ?? "5173"
const base = `http://localhost:${port}/wedding/`
const ids = [...fs.readdirSync("src/lab/playground/x", { withFileTypes: true })].filter((d) => d.isDirectory())
  .flatMap((d) => [...fs.readFileSync(`src/lab/playground/x/${d.name}/index.ts`, "utf8").matchAll(/id: "([a-z0-9-]+)"/g)].map((m) => m[1]))
fs.mkdirSync("src/lab/thumbs", { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ ...devices["Pixel 7"], viewport: { width: 390, height: 520 }, deviceScaleFactor: 1 })
await ctx.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
const p = await ctx.newPage()
for (const id of ids) {
  await p.goto(`${base}lab-play.html?x=${id}&h=sample`)
  await p.waitForTimeout(3200) // most openings and first animations are done by then
  const png = (await p.screenshot()).toString("base64")
  const webp = await p.evaluate(async (d) => {
    const i = new Image(); i.src = `data:image/png;base64,${d}`; await i.decode()
    const c = document.createElement("canvas"); c.width = 260; c.height = Math.round((260 * i.height) / i.width)
    c.getContext("2d").drawImage(i, 0, 0, c.width, c.height)
    return c.toDataURL("image/webp", 0.72)
  }, png)
  fs.writeFileSync(`src/lab/thumbs/${id}.webp`, Buffer.from(webp.split(",")[1], "base64"))
  console.log(id)
}
await b.close()
