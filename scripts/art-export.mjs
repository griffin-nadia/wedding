// node scripts/art-export.mjs — Nadia's art (private/nadia-art-17oct, full res, transparent) to web versions in public/art:
// trimmed to the drawing, sized for where each shows (1x and 2x), WebP from Chromium and AVIF from macOS sips. The
// originals are never copied or committed; only these exports are. Prints each export's size and aspect ratio.
// The open envelope has a stray beige block above its flap (the paper above the envelope's top edge); it's cut away
// along the top edge (where the side folds start) and the outline redrawn along the cut, until Nadia re-exports it.
// The lettering goes out as two masks on the same frame (its ink is set by the theme in CSS): the names without the
// "&", and the "&" alone. Final run P: the words are pulled in so the gap either side of the "&" is the "&"'s own ink
// width, then split in the middle of each gap.
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
  // The open envelope is two layers since 18 Oct: scripts/envelope-layers.mjs
  ["wax-seal", "wax-seal.png", "seal", [64, 128, 256]],
  ["gum-leaves", "gum-leaves.png", "leaves", [160, 320]],
  // 18 Oct: the lettering from lettering-dark-ink.png (2500px), as masks at 1x and 2x; the cream file isn't needed
  // (the theme fills the mask, so its grey speckling on "Nadia" never shows)
  ["names-mask", "../nadia-art-18oct/lettering-dark-ink.png", "names", [520, 1040], "no-amp"],
  ["amp-mask", "../nadia-art-18oct/lettering-dark-ink.png", "names", [520, 1040], "amp"],
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
    let cut = null
    if (fix === "amp" || fix === "no-amp") {
      // Final run P: Griffin and Nadia pulled in to the "&", the same gap both sides, the width of the "&"'s own ink,
      // measured on the ink (alpha over 8), not the image box. Each word moves as one piece; the "&" stays put.
      const a0 = 1106 * W / 2500, a1 = 1376 * W / 2500, px0 = x.getImageData(0, 0, W, H).data
      const inkX = (from, to) => { let l = W, r = -1; for (let y = 0; y < H; y += 2) for (let X = Math.round(from); X < Math.round(to); X++) if (px0[(y * W + X) * 4 + 3] > 8) { if (X < l) l = X; if (X > r) r = X } return [l, r] }
      const [, gR] = inkX(0, a0), [aL, aR] = inkX(a0, a1), [nL] = inkX(a1, W), gap = aR - aL
      const moved = new OffscreenCanvas(W, H), m = moved.getContext("2d", { willReadFrequently: true })
      m.drawImage(c, 0, 0, a0, H, aL - gap - gR, 0, a0, H) // Griffin: its last ink one "&" before the "&"
      m.drawImage(c, a0, 0, a1 - a0, H, a0, 0, a1 - a0, H) // the "&"
      m.drawImage(c, a1, 0, W - a1, H, a1 + aR + gap - nL, 0, W - a1, H) // Nadia: its first ink one "&" after it
      console.log(`names: gap ${gR < aL ? aL - gR : 0}px / ${nL - aR}px on the ink → ${gap}px both sides (the "&" is ${gap}px)`)
      c = moved; x = m
      cut = [aL - gap / 2, aR + gap / 2] // the middle of each new gap
    }
    // Trim to the drawing (alpha over 8), with 1% of air
    const px = x.getImageData(0, 0, W, H).data
    let x0 = W, y0 = H, x1 = 0, y1 = 0
    for (let y = 0; y < H; y += 2) for (let X = 0; X < W; X += 2) if (px[(y * W + X) * 4 + 3] > 8) { if (X < x0) x0 = X; if (X > x1) x1 = X; if (y < y0) y0 = y; if (y > y1) y1 = y }
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.01)
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad)
    const cw = x1 - x0, ch = y1 - y0
    if (cut) {
      // Trimmed first, so both masks keep the same frame; then the "&" alone, or everything but it
      x.globalCompositeOperation = "destination-out"
      if (fix === "amp") { x.fillRect(0, 0, cut[0], H); x.fillRect(cut[1], 0, W - cut[1], H) } else x.fillRect(cut[0], 0, cut[1] - cut[0], H)
      x.globalCompositeOperation = "source-over"
    }
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
    // Masks are WebP only (a CSS mask has no srcset to fall back through)
    if (name.endsWith("-mask")) { console.log(`${base}  webp ${Math.round(fs.statSync(`${base}.webp`).size / 1024)} kB`); continue }
    execFileSync("sips", ["-s", "format", "avif", "-s", "formatOptions", "55", pngPath, "--out", `${base}.avif`], { stdio: "ignore" })
    console.log(`${base}  webp ${Math.round(fs.statSync(`${base}.webp`).size / 1024)} kB  avif ${Math.round(fs.statSync(`${base}.avif`).size / 1024)} kB`)
  }
}
await b.close()
fs.rmSync(tmp, { recursive: true, force: true })
console.log("ratios", JSON.stringify(ratios))
