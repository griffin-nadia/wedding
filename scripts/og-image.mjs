// node scripts/og-image.mjs: the link preview (public/og-image.png, 1200x630). Run 20: only the names in Nadia's
// lettering, the date, and her envelope, on the site's paper. Nothing else (no address, no guest names).
import { chromium } from "@playwright/test"
import fs from "node:fs"

const b64 = (f) => fs.readFileSync(f).toString("base64")
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: O; src: url(data:font/woff2;base64,${b64("node_modules/@fontsource/oranienbaum/files/oranienbaum-latin-400-normal.woff2")}) }
body { margin: 0; width: 1200px; height: 630px; background: #f3e7d3; display: grid; grid-template-columns: 1fr 420px; align-items: center; font-family: O; color: #421a05 }
.l { padding-left: 110px }
.names { position: relative; width: 600px; aspect-ratio: 3.8023 }
.names i { position: absolute; inset: 0; background: #421a05; -webkit-mask: url(data:image/webp;base64,${b64("public/art/names/names-mask-1040.webp")}) left center / contain no-repeat }
.names i + i { background: #5b6b3a; -webkit-mask-image: url(data:image/webp;base64,${b64("public/art/names/amp-mask-1040.webp")}) }
.date { margin-top: 34px; font-size: 40px; color: #6b4a33 }
img { width: 340px; filter: drop-shadow(0 18px 22px rgb(60 30 10 / 0.25)) }
</style><div class="l"><div class="names" role="img" aria-label="Griffin & Nadia"><i></i><i></i></div><div class="date">15 October 2027, Kyoto</div></div><img src="data:image/webp;base64,${b64("public/art/envelope/envelope-closed-820.webp")}">`
const br = await chromium.launch(), p = await br.newPage({ viewport: { width: 1200, height: 630 } })
await p.setContent(html); await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: "public/og-image.png" })
await br.close()
console.log("public/og-image.png")
