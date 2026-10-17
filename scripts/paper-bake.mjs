// node scripts/paper-bake.mjs — bakes the paper (18f): Paper's PaperTexture with the preset in src/lib/paper.ts,
// rendered once per tone (light, lantern, bright) at 2x the tile, made seamless (crossfaded with itself shifted half
// a tile, so every edge shows the tile's own middle) and saved as an opaque WebP. Guests only ever get the image.
// Run it again after changing the preset.
import { chromium } from "@playwright/test"
import { createServer } from "vite"
import react from "@vitejs/plugin-react"
import fs from "node:fs"

const server = await createServer({ root: "scripts/paper-bake", base: "/", configFile: false, plugins: [react()], server: { port: 5179, strictPort: true },
  resolve: { alias: { "@": new URL("../src", import.meta.url).pathname } }, logLevel: "error" })
await server.listen()
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const p = await b.newPage({ viewport: { width: 480, height: 480 }, deviceScaleFactor: 2 })
p.on("pageerror", (e) => console.error(e.message))
// node scripts/paper-bake.mjs --try '{"crumples":0}' out-dir  writes trial tiles there instead (to compare)
const [flag, extra = "{}", dir] = process.argv.slice(2)
const trying = flag === "--try"
for (const tone of trying ? ["light", "lantern"] : ["light", "lantern", "bright"]) {
  await p.goto(`http://localhost:5179/?tone=${tone}&p=${encodeURIComponent(trying ? extra : "{}")}`)
  await p.locator("#t canvas").waitFor()
  await p.waitForTimeout(800)
  const png = (await p.locator("#t").screenshot({ animations: "disabled" })).toString("base64")
  const webp = await p.evaluate(async (png) => {
    const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode()
    const N = img.width, h = N / 2
    const c = new OffscreenCanvas(N, N), x = c.getContext("2d", { willReadFrequently: true })
    x.drawImage(img, 0, 0); const a = x.getImageData(0, 0, N, N)
    const o = x.createImageData(N, N)
    for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
      const w = Math.min(Math.min(xx, N - 1 - xx), Math.min(yy, N - 1 - yy)) / h, k = Math.min(1, w * 2.2)
      const i = (yy * N + xx) * 4, j = ((((yy + h) % N) * N) + ((xx + h) % N)) * 4
      for (let ch = 0; ch < 3; ch++) o.data[i + ch] = Math.round(a.data[i + ch] * k + a.data[j + ch] * (1 - k))
      o.data[i + 3] = 255
    }
    x.putImageData(o, 0, 0)
    const blob = await c.convertToBlob({ type: "image/webp", quality: 0.72 })
    const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (const v of u8) s += String.fromCharCode(v)
    return btoa(s)
  }, png)
  const out = trying ? `${dir}/paper-${tone}.webp` : `src/assets/paper-${tone}.webp`
  fs.writeFileSync(out, Buffer.from(webp, "base64"))
  console.log(out, Math.round(fs.statSync(out).size / 1024), "kB")
}
await b.close(); await server.close()
