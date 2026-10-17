// node scripts/art-export.mjs — Nadia's art (private/nadia-art-17oct, full res, transparent) to web versions in public/art:
// trimmed to the drawing, sized for where each shows (1x and 2x), WebP from Chromium and AVIF from macOS sips. The
// originals are never copied or committed; only these exports are. Prints each export's size and aspect ratio.
// The open envelope has a stray beige block above its flap (the paper above the envelope's top edge); it's cut away
// along the top edge (where the side folds start) and the outline redrawn along the cut, until Nadia re-exports it.
import { chromium } from "@playwright/test"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const SRC = "private/nadia-art-17oct"
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "art-"))
const JOBS = [
  // name, source, out folder, widths (CSS px at 1x, then 2x)
  ["envelope-closed", "envelope-closed.png", "envelope", [410, 820]],
  ["envelope-open", "envelope-open.png", "envelope", [410, 820], "cut-top"],
  ["wax-seal", "wax-seal.png", "seal", [64, 128, 256]],
  ["gum-leaves", "gum-leaves.png", "leaves", [160, 320]],
  ["lettering-brown", "lettering-brown.png", "names", [520, 1040]],
  ["lettering-cream", "lettering-cream.png", "names", [520, 1040]],
]
const b = await chromium.launch(), p = await b.newPage()
const ratios = {}
for (const [name, file, dir, widths, fix] of JOBS) {
  fs.mkdirSync(`public/art/${dir}`, { recursive: true })
  const out = await p.evaluate(async ([d, widths, fix]) => {
    const i = new Image(); i.src = "data:image/png;base64," + d; await i.decode()
    let W = i.width, H = i.height, c = new OffscreenCanvas(W, H), x = c.getContext("2d", { willReadFrequently: true })
    x.drawImage(i, 0, 0)
    if (fix === "cut-top") {
      // The envelope's top edge: from where the left side fold starts (y 2170) to where the right one does (y 2110),
      // measured on the 5000px original. Everything above goes, then the outline is drawn along the cut.
      const s = W / 5000, yl = 2168 * s, yr = 2108 * s, xl = 601 * s, xr = 4424 * s // the outer edges at those heights
      x.globalCompositeOperation = "destination-out"
      x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, yr - 6 * s); x.lineTo(0, yl - 6 * s); x.closePath(); x.fill()
      x.globalCompositeOperation = "source-over"
      x.strokeStyle = "rgb(182 161 138)"; x.lineWidth = 30 * s; x.lineCap = "round"
      x.beginPath(); x.moveTo(xl + 15 * s, yl + 8 * s); x.lineTo(xr - 15 * s, yr + 8 * s); x.stroke()
    }
    // Trim to the drawing (alpha over 8), with 1% of air
    const px = x.getImageData(0, 0, W, H).data
    let x0 = W, y0 = H, x1 = 0, y1 = 0
    for (let y = 0; y < H; y += 2) for (let X = 0; X < W; X += 2) if (px[(y * W + X) * 4 + 3] > 8) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (y < y0) y0 = y; if (y > y1) y1 = y }
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.01)
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad)
    const cw = x1 - x0, ch = y1 - y0
    const files = []
    for (const w of widths) {
      const h = Math.round((w * ch) / cw), o = new OffscreenCanvas(w, h), ox = o.getContext("2d")
      ox.imageSmoothingQuality = "high"; ox.drawImage(c, x0, y0, cw, ch, 0, 0, w, h)
      const enc = async (type, q) => { const blob = await o.convertToBlob({ type, quality: q }); const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (const v of u8) s += String.fromCharCode(v); return btoa(s) }
      files.push([w, await enc("image/webp", 0.82), await enc("image/png")])
    }
    return { ratio: cw / ch, files }
  }, [fs.readFileSync(path.join(SRC, file)).toString("base64"), widths, fix ?? ""])
  ratios[name] = +out.ratio.toFixed(4)
  for (const [w, webp, png] of out.files) {
    const base = `public/art/${dir}/${name}-${w}`
    fs.writeFileSync(`${base}.webp`, Buffer.from(webp, "base64"))
    const pngPath = path.join(tmp, `${name}-${w}.png`)
    fs.writeFileSync(pngPath, Buffer.from(png, "base64"))
    execFileSync("sips", ["-s", "format", "avif", "-s", "formatOptions", "55", pngPath, "--out", `${base}.avif`], { stdio: "ignore" })
    console.log(`${base}  webp ${Math.round(fs.statSync(`${base}.webp`).size / 1024)} kB  avif ${Math.round(fs.statSync(`${base}.avif`).size / 1024)} kB`)
  }
}
await b.close()
fs.rmSync(tmp, { recursive: true, force: true })
console.log("ratios", JSON.stringify(ratios))
