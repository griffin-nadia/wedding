// node scripts/bake-textures.mjs — renders the letter's paper grain and mottle (the SVG feTurbulence in tokens.css and
// polish.css) to small WebPs once, so a phone draws a bitmap instead of running the noise filter for every tile of
// both letters during a page turn (about three quarters of the raster work). Each is flattened onto the colour its
// blend leaves untouched (white for Light's multiply, 50% grey for Lantern's soft-light), so it blends as the SVG did.
// Needs Playwright's Chromium, which also does the WebP encoding. Run it again only if the SVGs change.
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
await b.close()
