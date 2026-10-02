// Printable QR cards, one per household, made on your own computer.
//
//   1. In the site data sheet: File > Download > CSV (on the Guests tab). Save it OUTSIDE this repo.
//   2. npm run qr-cards -- ~/Downloads/Guests.csv
//   3. Open private/qr-cards.html and print (A4, 8 cards a page).
//
// The output folder is gitignored. Never commit guest names, tokens or links.
import fs from "node:fs"
import path from "node:path"
import qrcode from "qrcode-generator"

const file = process.argv[2]
if (!file) { console.error("Usage: npm run qr-cards -- path/to/Guests.csv"); process.exit(1) }

function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let q = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') q = false; else cell += ch }
    else if (ch === '"') q = true
    else if (ch === ",") { row.push(cell); cell = "" }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = "" }
    else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

const [head, ...rows] = parseCsv(fs.readFileSync(file, "utf8"))
const col = (name) => head.findIndex((h) => h.trim() === name)
const [H, L] = [col("Household"), col("Link")]
if (H < 0 || L < 0) { console.error('The CSV needs "Household" and "Link" columns (run "Make tokens + links" first).'); process.exit(1) }

const seen = new Map()
for (const r of rows) if (r[L] && r[H] && !seen.has(r[L])) seen.set(r[L], r[H])

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const svg = (text) => {
  const qr = qrcode(0, "M"); qr.addData(text); qr.make()
  const n = qr.getModuleCount(); let d = ""
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
  return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><path d="${d}" fill="#421a05"/></svg>`
}

const cards = [...seen].map(([link, name]) => `<div class="card"><p class="eyebrow">Nadia &amp; Griffin · Kyoto · Fri 15 Oct 2027</p><h2>${esc(name)}</h2>${svg(link)}<p class="note">Scan to open your invite and RSVP</p></div>`).join("\n")
const html = `<!doctype html><meta charset="utf-8"><title>QR cards</title><style>
@page{size:A4;margin:10mm}body{margin:0;font-family:Georgia,serif;color:#421a05}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.card{border:1px solid #e5d0a8;border-radius:5mm;padding:6mm;break-inside:avoid;text-align:center;height:62mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm}
.card svg{width:32mm;height:32mm}.eyebrow{font-size:8pt;color:#a43108;margin:0}h2{font-weight:400;font-size:14pt;margin:0}.note{font-size:9pt;color:#754b38;margin:0}
</style><div class="grid">${cards}</div>`
const out = path.resolve("private"); fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, "qr-cards.html"), html)
console.log(`Wrote ${seen.size} cards to private/qr-cards.html`)
