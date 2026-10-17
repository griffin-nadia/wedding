// node scripts/bake-textures.mjs — renders the letter's paper grain and mottle (the SVG feTurbulence in tokens.css and
// polish.css) to small WebPs once, so a phone draws a bitmap instead of running the noise filter for every tile of
// both letters during a page turn (about three quarters of the raster work). Each is flattened onto the colour its
// blend leaves untouched (white for Light's multiply, 50% grey for Lantern's soft-light), so it blends as the SVG did.
// Needs Playwright's Chromium, which also does the WebP encoding. Run it again only if the SVGs change. It also draws
// the washi fibres and the hanko's ink (below).
import { chromium } from "@playwright/test"
import fs from "node:fs"

const css = fs.readFileSync("src/styles/tokens.css", "utf8") + fs.readFileSync("src/styles/polish.css", "utf8")
const svg = (name) => decodeURIComponent(css.match(new RegExp(`--texture-${name}: url\\("data:image/svg\\+xml,([^"]+)"\\)`))[1])
const b = await chromium.launch(), p = await b.newPage()
for (const [name, file, px] of [["paper", "grain", 256], ["mottle", "mottle", 480]]) for (const [theme, under] of [["light", 255], ["lantern", 128]]) {
  const url = await p.evaluate(async ([src, px, under]) => {
    const img = new Image(); img.src = src; await img.decode()
    const c = document.createElement("canvas"); c.width = c.height = px
    const x = c.getContext("2d"); x.fillStyle = `rgb(${under} ${under} ${under})`; x.fillRect(0, 0, px, px); x.drawImage(img, 0, 0, px, px)
    return c.toDataURL("image/webp", 0.7)
  }, [`data:image/svg+xml,${encodeURIComponent(svg(name))}`, px, under])
  const out = `src/assets/texture-${file}-${theme}.webp`
  fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"))
  console.log(out, Math.round(fs.statSync(out).size / 1024), "kB")
}
// (The washi fibres that were drawn here became Nadia's crosshatch, scripts/paper-tile.mjs, 18e.) The hanko's ink (an alpha mask: full ink with small dry specks and a gentle unevenness). Seeded, so a re-run gives
// the same files. Drawn wrapped at the edges, so each tiles without a seam.
for (const [file, px, kind] of [["ink", 192, "ink"]]) {
  const url = await p.evaluate(([px, kind]) => {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const c = document.createElement("canvas"); c.width = c.height = px
    const x = c.getContext("2d")
    const wrap = (draw) => { for (const dx of [-px, 0, px]) for (const dy of [-px, 0, px]) { x.save(); x.translate(dx, dy); draw(); x.restore() } }
    if (kind === "ink") {
      x.fillStyle = "#000"; x.fillRect(0, 0, px, px)
      x.globalCompositeOperation = "destination-out"
      for (let i = 0; i < 14; i++) { const cx = rnd() * px, cy = rnd() * px, r = 20 + rnd() * 50, a = 0.06 + rnd() * 0.1
        wrap(() => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2) }) }
      for (let i = 0; i < 260; i++) { const cx = rnd() * px, cy = rnd() * px, r = 0.4 + rnd() ** 3 * 2.2, a = 0.35 + rnd() * 0.6
        wrap(() => { x.fillStyle = `rgba(0,0,0,${a})`; x.beginPath(); x.ellipse(cx, cy, r, r * (0.5 + rnd() * 0.8), rnd() * Math.PI, 0, Math.PI * 2); x.fill() }) }
      return c.toDataURL("image/webp", 0.6)
    }
    const dark = kind === "light"
    for (let i = 0; i < 200; i++) {
      const len = 8 + rnd() ** 2 * 70, ang = rnd() * Math.PI * 2, cx = rnd() * px, cy = rnd() * px
      const pale = rnd() < 0.3, w = 0.35 + rnd() * (pale ? 1.6 : 0.9)
      const col = dark ? (pale ? `rgba(255,252,244,${0.35 + rnd() * 0.3})` : `rgba(110,74,40,${0.05 + rnd() * 0.1})`) : (pale ? `rgba(255,236,210,${0.04 + rnd() * 0.06})` : `rgba(0,0,0,${0.08 + rnd() * 0.1})`)
      const bend = (rnd() - 0.5) * len * 0.6
      wrap(() => {
        x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; x.beginPath()
        const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2
        x.moveTo(cx - dx, cy - dy); x.quadraticCurveTo(cx + Math.sin(ang) * bend, cy - Math.cos(ang) * bend, cx + dx, cy + dy); x.stroke()
      })
    }
    // A few flecks of bark (kozo), as in real washi
    for (let i = 0; i < 26; i++) { const cx = rnd() * px, cy = rnd() * px, r = 0.5 + rnd() * 1.1
      wrap(() => { x.fillStyle = dark ? `rgba(90,60,30,${0.12 + rnd() * 0.12})` : `rgba(255,236,210,${0.05 + rnd() * 0.05})`; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill() }) }
    return c.toDataURL("image/webp", 0.6)
  }, [px, kind])
  const out = `src/assets/texture-${file}.webp`
  fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"))
  console.log(out, Math.round(fs.statSync(out).size / 1024), "kB")
}
await b.close()
