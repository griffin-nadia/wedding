// After the lab build (vite build --mode lab): its folder opens on the lab itself (index.html = lab.html), and a check
// that the guest site never links to it. Part of npm run build.
import fs from "node:fs"
const src = fs.readFileSync("vite.config.ts", "utf8")
const lab = src.match(/LAB_PATH = "([^"]+)"/)[1]
fs.copyFileSync(`dist/${lab}/lab.html`, `dist/${lab}/index.html`)
const guest = fs.readdirSync("dist", { recursive: true }).filter((f) => !String(f).startsWith(lab) && /\.(html|js|css|json|txt|webmanifest)$/.test(String(f)))
for (const f of guest) if (fs.readFileSync(`dist/${f}`, "utf8").includes(lab)) throw new Error(`the guest site links to the lab: dist/${f}`)
for (const f of fs.readdirSync(`dist/${lab}`).filter((x) => x.endsWith(".html"))) if (!/noindex, nofollow/.test(fs.readFileSync(`dist/${lab}/${f}`, "utf8"))) throw new Error(`lab page without noindex: ${f}`)
console.log(`lab built at /wedding/${lab}/ (not linked from the site, noindex)`)
