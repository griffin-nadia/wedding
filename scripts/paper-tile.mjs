// node scripts/paper-tile.mjs — the paper tile (18e): Nadia's crosshatch, sampled from a plain patch of the closed
// envelope's bottom flap (private/nadia-art-17oct, 768px square at x 1620, y 2420 of the 4000px original), turned
// into strokes only (how much darker each pixel is than the paper around it, as alpha), shrunk to 512 and made
// seamless (crossfaded with itself shifted half a tile, so every edge shows the tile's own middle). Two opaque WebPs:
// warm strokes on white for light paper (multiply), pale ones on black for Lantern (screen). Replaces the washi fibres.
import { chromium } from "@playwright/test"
import fs from "node:fs"

const src = "data:image/png;base64," + fs.readFileSync("private/nadia-art-17oct/envelope-closed.png").toString("base64")
const b = await chromium.launch(), p = await b.newPage()
const out = await p.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode()
  const N = 512, S = 660, X = 320, Y = 1580
  const c = new OffscreenCanvas(N, N), x = c.getContext("2d", { willReadFrequently: true })
  x.imageSmoothingQuality = "high"; x.drawImage(img, X, Y, S, S, 0, 0, N, N)
  const sharp = x.getImageData(0, 0, N, N).data
  // The paper around each pixel: the same patch, blurred (drawn with a margin so the blur has real paper at the edges)
  const m = new OffscreenCanvas(N, N), mx = m.getContext("2d", { willReadFrequently: true })
  mx.filter = "blur(10px)"; mx.drawImage(img, X - 96, Y - 96, S + 192, S + 192, -64, -64, N + 128, N + 128)
  const mean = mx.getImageData(0, 0, N, N).data
  const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
  const a = new Float32Array(N * N)
  for (let i = 0; i < N * N; i++) a[i] = Math.max(0, lum(mean, i * 4) - lum(sharp, i * 4))
  // Seamless: crossfade with the tile shifted by half, weighted by distance from the edge
  const t = new Float32Array(N * N), h = N / 2
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
    const w = Math.min(Math.min(xx, N - 1 - xx), Math.min(yy, N - 1 - yy)) / h // 0 at the edges, 1 in the middle
    const k = Math.min(1, w * 2.2)
    t[yy * N + xx] = a[yy * N + xx] * k + a[((yy + h) % N) * N + (xx + h) % N] * (1 - k)
  }
  let max = 0; for (const v of t) if (v > max) max = v
  const files = {}
  // Opaque, so it compresses (a WebP's alpha is lossless): the strokes at STRENGTH over white for light paper (drawn
  // with multiply) and over black for Lantern (drawn with screen), so the paper colour shows through untouched
  const STRENGTH = { light: 0.16, lantern: 0.12 }
  for (const [name, rgb, under] of [["light", [96, 66, 40], 255], ["lantern", [246, 232, 210], 0]]) {
    const o = new OffscreenCanvas(N, N), ox = o.getContext("2d"), d = ox.createImageData(N, N)
    for (let i = 0; i < N * N; i++) {
      // The faintest specks go (a calmer sheet)
      const k = STRENGTH[name] * Math.min(1, Math.max(0, t[i] - max * 0.1) / (max * 0.5))
      for (let ch = 0; ch < 3; ch++) d.data[i * 4 + ch] = Math.round(under + (rgb[ch] - under) * k)
      d.data[i * 4 + 3] = 255
    }
    ox.putImageData(d, 0, 0)
    const blob = await o.convertToBlob({ type: "image/webp", quality: 0.7 })
    const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (const v of u8) s += String.fromCharCode(v)
    files[name] = btoa(s)
  }
  return files
}, src)
for (const [name, data] of Object.entries(out)) {
  const f = `src/assets/texture-hatch-${name}.webp`
  fs.writeFileSync(f, Buffer.from(data, "base64"))
  console.log(f, Math.round(fs.statSync(f).size / 1024), "kB")
}
await b.close()
