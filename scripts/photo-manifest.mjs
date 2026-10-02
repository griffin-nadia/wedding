// Builds src/content/photos.json (names, sizes, formats, aspect) from photos-private/.
// No image data or location goes in it. family-dinner is never included.
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

const dir = path.resolve("photos-private")
const PRIVATE = new Set(["family-dinner"])
const files = fs.readdirSync(dir).filter((f) => /\.(avif|webp|jpg)$/.test(f))
const out = {}
for (const f of files) {
  const m = /^(.+?)-(lqip|wide-\d+|\d+)\.(avif|webp|jpg)$/.exec(f)
  if (!m) continue
  const [, name, size, ext] = m
  if (PRIVATE.has(name)) continue
  const p = (out[name] ??= { formats: {}, wide: {}, lqip: "" })
  if (size === "lqip") { p.lqip = f; continue }
  const isWide = size.startsWith("wide-")
  const w = Number(size.replace("wide-", ""))
  const bucket = isWide ? p.wide : p.formats
  ;(bucket[ext] ??= []).push(w)
  if (!isWide && (!p.width || w > p.width) && ext !== "avif") {
    const [pw, ph] = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path.join(dir, f)]).toString().match(/\d+/g).slice(-2).map(Number)
    p.width = pw; p.height = ph
  }
}
for (const p of Object.values(out)) for (const b of [p.formats, p.wide]) for (const k of Object.keys(b)) b[k].sort((a, c) => a - c)
fs.writeFileSync("src/content/photos.json", JSON.stringify(out, null, 1) + "\n")
console.log(Object.keys(out).length, "photos:", Object.keys(out).join(", "))
