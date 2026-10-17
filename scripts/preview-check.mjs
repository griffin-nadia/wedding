// node scripts/preview-check.mjs lab|preview — after npm run build with no back end: lays out cf-out/ for Cloudflare
// Pages (the site under /wedding, a root page that goes to the lab or the sample invite, and _headers that mark
// every response noindex), and fails if the output holds anything it mustn't: a file from private/, a back-end
// address, or a guest-data file. Used by docs/ci/previews.yml.
import fs from "node:fs"
import path from "node:path"

const kind = process.argv[2] === "lab" ? "lab" : "preview"
const lab = fs.readFileSync("vite.config.ts", "utf8").match(/LAB_PATH = "([^"]+)"/)[1]
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const files = walk("dist")
const priv = fs.existsSync("private") ? walk("private").map((f) => fs.readFileSync(f)) : []
const problems = []
for (const f of files) {
  const buf = fs.readFileSync(f)
  if (priv.some((p) => p.length === buf.length && p.equals(buf))) problems.push(`a file from private/: ${f}`)
  if (/\.(csv|xlsx?|tsv)$/i.test(f) || /guest|rsvp/i.test(path.basename(f)) && /\.json$/.test(f)) problems.push(`looks like guest data: ${f}`)
  if (/\.(js|html|json)$/.test(f) && /script\.google\.com\/macros\/s\//.test(buf.toString("utf8"))) problems.push(`a back-end address: ${f}`)
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1) }
fs.rmSync("cf-out", { recursive: true, force: true })
fs.cpSync("dist", "cf-out/wedding", { recursive: true })
const to = kind === "lab" ? `/wedding/${lab}/` : "/wedding/?h=sample"
fs.writeFileSync("cf-out/index.html", `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><meta http-equiv="refresh" content="0; url=${to}"><a href="${to}">Open</a>`)
fs.writeFileSync("cf-out/_headers", "/*\n  X-Robots-Tag: noindex, nofollow\n")
fs.writeFileSync("cf-out/_redirects", `/wedding/* /wedding/404.html 404\n`)
console.log(`cf-out ready for ${kind}: ${files.length} files checked, root goes to ${to}`)
