// node scripts/paper-export.mjs — the paper (run 26): the same sheet the site used to make in the browser
// (src/lib/paper-live.ts, Paper's PaperTexture shader, the PAPER preset), made once here at the sizes screens show it
// and saved as AVIF (macOS sips) in public/paper/, so a phone downloads a small file it can
// preload instead of running a WebGL shader after the page has settled. Two shapes, two sizes each (CSS px x pixel
// density): portrait for phones (800 and 1200 wide, 390 x 844's shape) and landscape for laptops (1600 and 2400 wide,
// 16:10). Writes each theme's most extreme pixel (what text contrast has to survive) to src/data/paper-sheets.json.
// AVIF at 22 (sips): the grain shows at 14 to 20% strength, so this is as small as it goes before it blocks up (run 26:
// p1200 is 627 KB at 50, 70 KB at 22, blocky at 15). No WebP: Chromium's encoder needs 540 KB for the same sheet,
// and a browser without AVIF (none the guests are likely to use by 2027) just keeps the plain paper.
// Needs Playwright's Chromium with software WebGL; starts its own Vite dev server on PORT (default 5272).
import { chromium } from "@playwright/test"
import { execFileSync, spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const PORT = Number(process.env.PORT ?? 5272)
export const SIZES = [["p", 800, 1732], ["p", 1200, 2598], ["l", 1600, 1000], ["l", 2400, 1500]]
const OUT = "public/paper", tmp = fs.mkdtempSync(path.join(os.tmpdir(), "paper-"))
fs.mkdirSync(OUT, { recursive: true })
const srv = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], { stdio: "ignore", detached: true })
await new Promise((r) => setTimeout(r, 4000))
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const extremes = { autumn: [], lantern: [] }
try {
  for (const theme of ["autumn", "lantern"]) for (const [shape, W, H] of SIZES) {
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
    await p.goto(`http://localhost:${PORT}/wedding/faqs`)
    const r = await p.evaluate(async ({ night, W, H }) => {
      const { draw } = await import("/wedding/src/lib/paper-live.ts")
      const { PAPER } = await import("/wedding/src/lib/paper.ts")
      const { url } = await draw(PAPER, night, W, H, 1)
      const img = new Image(); img.src = url; await img.decode()
      const c = document.createElement("canvas"); c.width = W; c.height = H
      c.getContext("2d").drawImage(img, 0, 0)
      return c.toDataURL("image/png")
    }, { night: theme === "lantern", W, H })
    const name = `paper-${theme}-${shape}${W}`
    const png = path.join(tmp, `${name}.png`)
    fs.writeFileSync(png, Buffer.from(r.split(",")[1], "base64"))
    execFileSync("sips", ["-s", "format", "avif", "-s", "formatOptions", "22", png, "--out", `${OUT}/${name}.avif`], { stdio: "ignore" })
    // The extreme of what will actually be shown: the AVIF decoded, sampled at a quarter (as the live sheet was)
    const extreme = await p.evaluate(async ({ src, night, W, H }) => {
      const back = new Image(); back.src = src; await back.decode()
      const q = document.createElement("canvas"); q.width = Math.round(W / 4); q.height = Math.round(H / 4)
      const x = q.getContext("2d", { willReadFrequently: true }); x.drawImage(back, 0, 0, q.width, q.height)
      const d = x.getImageData(0, 0, q.width, q.height).data
      let e = night ? 0 : 255
      for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; e = night ? Math.max(e, v) : Math.min(e, v) }
      return e / 255
    }, { src: `data:image/avif;base64,${fs.readFileSync(`${OUT}/${name}.avif`).toString("base64")}`, night: theme === "lantern", W, H })
    extremes[theme].push(extreme)
    console.log(`${name}: ${W}x${H}, ${Math.round(fs.statSync(`${OUT}/${name}.avif`).size / 1024)} KB, extreme ${extreme.toFixed(3)}`)
    await p.close()
  }
} finally { await b.close(); try { process.kill(-srv.pid) } catch { /* gone */ } }
// The worst across sizes: the darkest by day, the lightest at night
const json = { autumn: +Math.min(...extremes.autumn).toFixed(3), lantern: +Math.max(...extremes.lantern).toFixed(3) }
fs.writeFileSync("src/data/paper-sheets.json", JSON.stringify(json) + "\n")
console.log(json)
