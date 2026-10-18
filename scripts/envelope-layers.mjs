// node scripts/envelope-layers.mjs — Nadia's open envelope (private/nadia-art-18oct/envelope-open.png, 5000px, clean)
// as two layers the letter can come out between (docs/art.md):
//   back:  the back panel, its inside and the open flap (the whole drawing; the front covers its pocket)
//   front: the pocket (the left, right and bottom triangles, below the two diagonal edges) and the wax seal
// The front is cut with a polygon traced along the top of each drawn diagonal (so the line stays with the pocket),
// joined under the seal, plus the seal itself (its red, grown a little to keep its outline). Both are trimmed to the
// same frame and exported at 410 and 820 wide as WebP (Chromium) and AVIF (sips). If Nadia's own layers are there
// (envelope-open-back.png and envelope-open-front.png, same 5000px canvas, same position) they're used as they are.
import { chromium } from "@playwright/test"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const DIR = "private/nadia-art-18oct", OUT = "public/art/envelope", WIDTHS = [410, 820]
const read = (f) => (fs.existsSync(path.join(DIR, f)) ? fs.readFileSync(path.join(DIR, f)).toString("base64") : null)
const whole = read("envelope-open.png"), ownBack = read("envelope-open-back.png"), ownFront = read("envelope-open-front.png")
if (!whole && !(ownBack && ownFront)) throw new Error(`no open envelope in ${DIR}`)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "env-"))
const b = await chromium.launch(), p = await b.newPage()
const out = await p.evaluate(async ([whole, ownBack, ownFront, widths]) => {
  const load = async (d) => { const i = new Image(); i.src = "data:image/png;base64," + d; await i.decode(); return i }
  const canvasOf = (img) => { const c = new OffscreenCanvas(img.width, img.height), x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0); return c }
  let back, front, note = "Nadia's own layers"
  if (ownBack && ownFront) { back = canvasOf(await load(ownBack)); front = canvasOf(await load(ownFront)) }
  else {
    note = "cut from the whole drawing"
    const img = await load(whole), W = img.width, H = img.height, s = W / 5000
    back = canvasOf(img)
    const px = back.getContext("2d").getImageData(0, 0, W, H).data
    const at = (x, y) => (Math.round(y) * W + Math.round(x)) * 4
    const isLine = (x, y) => { const k = at(x, y), r = px[k], g = px[k + 1], bl = px[k + 2]; return px[k + 3] > 200 && 0.2126 * r + 0.7152 * g + 0.0722 * bl < 200 && r - bl < 70 }
    // Trace a diagonal's top edge: in each column, the first line pixel near the straight guess between its ends
    const trace = (x0, y0, x1, y1) => {
      const pts = [], n = Math.abs(x1 - x0), dir = Math.sign(x1 - x0)
      for (let i = 0; i <= n; i += 4) {
        const x = x0 + dir * i, guess = y0 + ((y1 - y0) * i) / n
        let y = null
        for (let yy = guess - 90 * s; yy <= guess + 90 * s; yy++) if (isLine(x, yy)) { y = yy; break }
        pts.push([x, y ?? guess])
      }
      // A running median, so a stray mark doesn't bend the cut
      return pts.map(([x], i) => { const w = pts.slice(Math.max(0, i - 4), i + 5).map((q) => q[1]).sort((a, b) => a - b); return [x, w[w.length >> 1] - 3 * s] })
    }
    // Measured on the 5000px drawing: where each diagonal leaves the side, and where it goes under the seal
    const left = trace(625 * s, 2170 * s, 2130 * s, 3410 * s), right = trace(4385 * s, 2085 * s, 2860 * s, 3415 * s)
    // Under the seal, the two edges meet: carry each straight on from its last stretch to where they cross
    const fit = (pts) => { const a = pts[pts.length - 40], z = pts[pts.length - 1]; return [(z[1] - a[1]) / (z[0] - a[0]), z] }
    const [ml, zl] = fit(left), [mr, zr] = fit(right)
    const vx = (zr[1] - zl[1] + ml * zl[0] - mr * zr[0]) / (ml - mr), vy = zl[1] + ml * (vx - zl[0])
    front = new OffscreenCanvas(W, H)
    const f = front.getContext("2d")
    f.beginPath(); f.moveTo(0, left[0][1]); left.forEach(([x, y]) => f.lineTo(x, y)); f.lineTo(vx, vy)
    ;[...right].reverse().forEach(([x, y]) => f.lineTo(x, y)); f.lineTo(W, right[0][1]); f.lineTo(W, H); f.lineTo(0, H); f.closePath()
    f.fillStyle = "#000"; f.fill()
    // The seal: its red (and the darker red of its outline), grown by 14px so the drawn rim comes with it
    const seal = new OffscreenCanvas(W, H), sx = seal.getContext("2d"), m = sx.createImageData(W, H)
    for (let k = 0; k < px.length; k += 4) { const r = px[k], g = px[k + 1], bl = px[k + 2]; if (px[k + 3] > 100 && r > 70 && r - g > 45 && r - bl > 30) m.data[k + 3] = 255 }
    sx.putImageData(m, 0, 0)
    f.filter = `blur(${10 * s}px)`; f.drawImage(seal, 0, 0); f.filter = "none"
    // Hard-edge the grown seal (the blur made it soft), then keep the drawing only where the mask is
    const mm = f.getImageData(0, 0, W, H); for (let k = 3; k < mm.data.length; k += 4) mm.data[k] = mm.data[k] > 40 ? 255 : 0; f.putImageData(mm, 0, 0)
    f.globalCompositeOperation = "source-in"; f.drawImage(img, 0, 0)
  }
  // The same frame for both: the whole drawing's own box, with 1% of air
  const W = back.width, H = back.height, d = back.getContext("2d").getImageData(0, 0, W, H).data
  let x0 = W, y0 = H, x1 = 0, y1 = 0
  for (let y = 0; y < H; y += 2) for (let X = 0; X < W; X += 2) if (d[(y * W + X) * 4 + 3] > 8) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.01)
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad)
  const cw = x1 - x0, ch = y1 - y0, files = []
  for (const [name, c] of [["back", back], ["front", front]]) for (const w of widths) {
    const h = Math.round((w * ch) / cw), o = new OffscreenCanvas(w, h), ox = o.getContext("2d")
    ox.imageSmoothingQuality = "high"; ox.drawImage(c, x0, y0, cw, ch, 0, 0, w, h)
    const enc = async (type, q) => { const blob = await o.convertToBlob({ type, quality: q }); const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (const v of u8) s += String.fromCharCode(v); return btoa(s) }
    files.push([name, w, await enc("image/webp", 0.85), await enc("image/png")])
  }
  return { note, ratio: cw / ch, files }
}, [whole, ownBack, ownFront, WIDTHS])
await b.close()
fs.mkdirSync(OUT, { recursive: true })
for (const [name, w, webp, png] of out.files) {
  const base = `${OUT}/envelope-open-${name}-${w}`
  fs.writeFileSync(`${base}.webp`, Buffer.from(webp, "base64"))
  const pngPath = path.join(tmp, `${name}-${w}.png`)
  fs.writeFileSync(pngPath, Buffer.from(png, "base64"))
  execFileSync("sips", ["-s", "format", "avif", "-s", "formatOptions", "60", pngPath, "--out", `${base}.avif`], { stdio: "ignore" })
  console.log(`${base}  webp ${Math.round(fs.statSync(`${base}.webp`).size / 1024)} kB  avif ${Math.round(fs.statSync(`${base}.avif`).size / 1024)} kB`)
}
fs.rmSync(tmp, { recursive: true, force: true })
console.log(out.note, "ratio", out.ratio.toFixed(4))
