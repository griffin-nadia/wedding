// node scripts/leak-check.mjs [dir]: run 20, the end of every `npm run build` (so the gates and the deploy). Fails if
// the built site (dist/ by default) carries something private:
// - an email address other than the site's own contact (the wedding account) and the calendar file's id
// - a Google sheet, Drive or script id, other than the back end's own /exec address
// - a test token, or a path into private/
// - photo metadata (EXIF, XMP, GPS), or an image bigger than the site shows (2400 wide, 3200 long side)
// Prints what it found and where, never the whole file.
import fs from "node:fs"
import path from "node:path"

const dir = process.argv[2] ?? "dist"
const ALLOWED_EMAILS = new Set(["griffinandnadia@gmail.com", "nadia-griffin-2027@griffin-nadia.github.io"])
const TEST_TOKENS = ["test6", "testtoken1", "k7x2mq9p4r"]
const MAX_W = 2400, MAX_LONG = 3200
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const problems = []
const say = (f, what) => problems.push(`${path.relative(dir, f)}: ${what}`)

export function textLeaks(text) {
  const out = []
  for (const m of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[a-z]{2,}/g)) if (!ALLOWED_EMAILS.has(m[0].toLowerCase()) && !/^[^@]+@\d/.test(m[0])) out.push(`email ${m[0]}`)
  const exec = /script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g
  const rest = text.replace(exec, "")
  for (const m of rest.matchAll(/docs\.google\.com\/(spreadsheets|document|forms)\/d\/[A-Za-z0-9_-]+|drive\.google\.com\/[^\s"']+|script\.google\.com\/[^\s"']+|\b1[A-Za-z0-9_-]{43}\b/g)) out.push(`Google id ${m[0].slice(0, 30)}…`)
  for (const t of TEST_TOKENS) if (new RegExp(`\\b${t}\\b`).test(text)) out.push(`test token ${t}`)
  if (/(^|[^a-z])private\//.test(text.replace(/__private\//g, "PRIV"))) out.push("a private/ path")
  return out
}

/** Width and height, and whether there's metadata, read from the file's own headers (no image library needed). */
export function imageInfo(buf, ext) {
  const s = buf.toString("latin1")
  let w = 0, h = 0, meta = false
  if (ext === "png") { w = buf.readUInt32BE(16); h = buf.readUInt32BE(20); meta = /eXIf|iTXt|tEXt|zTXt/.test(s.slice(0, 4096 * 4)) && /eXIf|XML:com\.adobe|GPS/.test(s) }
  else if (ext === "jpg" || ext === "jpeg") {
    meta = /Exif\0\0|http:\/\/ns\.adobe\.com\/xap/.test(s)
    for (let i = 2; i + 8 < buf.length;) { if (buf[i] !== 0xff) { i++; continue } const m = buf[i + 1], len = buf.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break } i += 2 + len }
  } else if (ext === "webp") {
    const kind = s.slice(12, 16)
    if (kind === "VP8X") { w = 1 + buf.readUIntLE(24, 3); h = 1 + buf.readUIntLE(27, 3) } else if (kind === "VP8L") { const b = buf.readUInt32LE(21); w = 1 + (b & 0x3fff); h = 1 + ((b >> 14) & 0x3fff) } else if (kind === "VP8 ") { w = buf.readUInt16LE(26) & 0x3fff; h = buf.readUInt16LE(28) & 0x3fff }
    meta = /EXIF|XMP /.test(s.slice(12))
  } else if (ext === "avif") {
    const i = s.indexOf("ispe"); if (i > 0) { w = buf.readUInt32BE(i + 8); h = buf.readUInt32BE(i + 12) }
    meta = /Exif\0\0|\bExif\b/.test(s.slice(0, 8192)) || /mime\0application\/rdf\+xml/.test(s.slice(0, 8192))
  }
  return { w, h, meta }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!fs.existsSync(dir)) { console.error(`✖ ${dir} doesn't exist: build first`); process.exit(1) }
  for (const f of walk(dir)) {
    const ext = path.extname(f).slice(1).toLowerCase()
    if (/^(js|html|css|json|txt|webmanifest|svg|xml|ics)$/.test(ext)) for (const p of textLeaks(fs.readFileSync(f, "utf8"))) say(f, p)
    else if (/^(png|jpe?g|webp|avif)$/.test(ext)) {
      const { w, h, meta } = imageInfo(fs.readFileSync(f), ext)
      if (meta) say(f, "photo metadata (EXIF or XMP)")
      if (w > MAX_W || Math.max(w, h) > MAX_LONG) say(f, `${w}x${h}, bigger than the site shows`)
    } else if (/^(heic|tiff?|psd|raw|dng)$/.test(ext)) say(f, "an original photo format")
  }
  if (problems.length) { for (const p of problems) console.error(`✖ ${p}`); console.error(`Leak check: ${problems.length} problem${problems.length === 1 ? "" : "s"} in ${dir}/`); process.exit(1) }
  console.log(`Leak check: ${dir}/ is clean.`)
}
