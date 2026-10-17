// node scripts/favicon.mjs — the site's icons from Nadia's wax seal (private/nadia-art-17oct/wax-seal.png): trimmed
// to the seal, then favicon.ico (16, 32, 48), icon-192.png and icon-512.png (transparent), icon-512-maskable.png and
// apple-touch-icon.png (180, on the cream paper; a phone fills transparency with black). At 16 and 32 the seal is
// drawn edge to edge with a little extra contrast so it still reads as a red seal in a browser tab.
import { chromium } from "@playwright/test"
import fs from "node:fs"

const src = "data:image/png;base64," + fs.readFileSync("private/nadia-art-17oct/wax-seal.png").toString("base64")
const JOBS = [
  // name, px, how much of the square the seal fills, background
  ["ico-16", 16, 1, null], ["ico-32", 32, 1, null], ["ico-48", 48, 0.96, null],
  ["icon-192", 192, 0.92, null], ["icon-512", 512, 0.92, null],
  ["icon-512-maskable", 512, 0.62, "#f3e7d3"], ["apple-touch-icon", 180, 0.78, "#f3e7d3"],
]
const b = await chromium.launch(), p = await b.newPage()
const out = await p.evaluate(async ([src, jobs]) => {
  const i = new Image(); i.src = src; await i.decode()
  const c = new OffscreenCanvas(i.width, i.height), x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(i, 0, 0)
  const px = x.getImageData(0, 0, i.width, i.height).data
  let x0 = i.width, y0 = i.height, x1 = 0, y1 = 0
  for (let y = 0; y < i.height; y += 2) for (let X = 0; X < i.width; X += 2) if (px[(y * i.width + X) * 4 + 3] > 24) { x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  const w = x1 - x0, h = y1 - y0, side = Math.max(w, h), cx = x0 + w / 2, cy = y0 + h / 2
  const res = {}
  for (const [name, n, fill, bg] of jobs) {
    // Step down by halves for a clean small version (one big jump to 16px loses the seal's edge)
    let cur = c, sx = cx - side / 2, sy = cy - side / 2, s = side
    while (s / 2 > n * 2) { const h2 = new OffscreenCanvas(Math.ceil(s / 2), Math.ceil(s / 2)), hx = h2.getContext("2d"); hx.imageSmoothingQuality = "high"; hx.drawImage(cur, sx, sy, s, s, 0, 0, s / 2, s / 2); cur = h2; sx = 0; sy = 0; s = s / 2 }
    const o = new OffscreenCanvas(n, n), ox = o.getContext("2d")
    if (bg) { ox.fillStyle = bg; ox.fillRect(0, 0, n, n) }
    if (n <= 32) ox.filter = "contrast(1.25) saturate(1.15)"
    ox.imageSmoothingQuality = "high"
    const d = n * fill
    ox.drawImage(cur, sx, sy, s, s, (n - d) / 2, (n - d) / 2, d, d)
    const blob = await o.convertToBlob({ type: "image/png" })
    const u8 = new Uint8Array(await blob.arrayBuffer()); let str = ""; for (const v of u8) str += String.fromCharCode(v)
    res[name] = btoa(str)
  }
  return res
}, [src, JOBS])
await b.close()
const png = (k) => Buffer.from(out[k], "base64")
for (const k of ["icon-192", "icon-512", "icon-512-maskable", "apple-touch-icon"]) fs.writeFileSync(`public/${k}.png`, png(k))
// An .ico is a small directory of PNGs
const imgs = [16, 32, 48].map((n) => [n, png(`ico-${n}`)])
const head = Buffer.alloc(6 + 16 * imgs.length); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4)
let off = head.length
imgs.forEach(([n, data], k) => {
  const e = 6 + 16 * k
  head.writeUInt8(n, e); head.writeUInt8(n, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3)
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(data.length, e + 8); head.writeUInt32LE(off, e + 12)
  off += data.length
})
fs.writeFileSync("public/favicon.ico", Buffer.concat([head, ...imgs.map(([, d]) => d)]))
for (const f of ["favicon.ico", "icon-192.png", "icon-512.png", "icon-512-maskable.png", "apple-touch-icon.png"]) console.log(f, Math.round(fs.statSync(`public/${f}`).size / 1024), "kB")
fs.mkdirSync("node_modules/.tmp", { recursive: true })
for (const n of [16, 32, 48]) fs.writeFileSync(`node_modules/.tmp/ico-${n}.png`, png(`ico-${n}`))
