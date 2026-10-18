// node scripts/lab-thumbs.mjs [port] [id...]: the lab's thumbnails, each experiment (and each of its takes) at phone
// size after it has settled, plus the Reference cards (the live pages), saved small as src/lab/thumbs/<id>.webp and
// <id>--<take>.webp. Needs the lab running (npm run lab) on the port (5173 by default). Local only, like the lab: the
// thumbnails are only ever imported by the lab. Name ids to redo only those.
import { chromium, devices } from "@playwright/test"
import fs from "node:fs"

const [port = "5173", ...only] = process.argv.slice(2)
const base = `http://localhost:${port}/wedding/`
fs.mkdirSync("src/lab/thumbs", { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ ...devices["Pixel 7"], viewport: { width: 390, height: 520 }, deviceScaleFactor: 1 })
await ctx.addInitScript(() => { localStorage.setItem("ng-music", "off"); if (!location.search.includes("arrival=1")) localStorage.setItem("ng-opened", "1"); else localStorage.removeItem("ng-opened") })
// Held on screen for the picture (the loading screen is gone in a moment otherwise)
const EXTRA = { "loading-preload": "&k.hold=10" }
const p = await ctx.newPage()
await p.goto(`${base}lab.html`)
const { entries, reference } = await p.evaluate(() => window.__labIndex)
const shots = [
  ...entries.flatMap((e) => (e.takes ?? [null]).map((t) => ({ name: t ? `${e.id}--${t}` : e.id, id: e.id, url: `${base}lab-play.html?x=${e.id}${t ? `&take=${t}` : ""}${EXTRA[e.id] ?? ""}` }))),
  ...reference.map((r) => ({ name: r.id, id: r.id, url: `${base}${r.path.replace(/^\//, "")}${r.path.includes("?") ? "&" : "?"}h=sample${r.arrival ? "&arrival=1" : ""}` })),
].filter((s) => !only.length || only.includes(s.id))
for (const s of shots) {
  await p.goto(s.url)
  await p.addStyleTag({ content: ".lab-controls { display: none !important; }" })
  await p.waitForTimeout(3600) // most openings and first animations are done by then
  const png = (await p.screenshot()).toString("base64")
  const webp = await p.evaluate(async (d) => {
    const i = new Image(); i.src = `data:image/png;base64,${d}`; await i.decode()
    const c = document.createElement("canvas"); c.width = 260; c.height = Math.round((260 * i.height) / i.width)
    c.getContext("2d").drawImage(i, 0, 0, c.width, c.height)
    return c.toDataURL("image/webp", 0.72)
  }, png)
  fs.writeFileSync(`src/lab/thumbs/${s.name}.webp`, Buffer.from(webp.split(",")[1], "base64"))
  console.log(s.name)
}
await b.close()
