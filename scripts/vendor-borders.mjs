// node scripts/vendor-borders.mjs — writes src/lab/data/borders-110m.json for the lab's line-drawn globe: every country
// border and coastline from Natural Earth 1:110m (public domain, via the world-atlas package), as [lon, lat] lines
// rounded to 0.1°. Vendored so the lab never fetches it at runtime. Run again only to refresh the data.
import fs from "node:fs"
import { mesh } from "topojson-client"
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"))
const m = mesh(topo, topo.objects.countries)
const r = (n) => Math.round(n * 10) / 10
const lines = m.coordinates.map((l) => l.map(([x, y]) => [r(x), r(y)])).filter((l) => l.length > 1)
fs.writeFileSync("src/lab/data/borders-110m.json", JSON.stringify({ source: "Natural Earth 1:110m via world-atlas 2.0.2 (public domain)", lines }))
console.log(lines.length, "lines", lines.reduce((n, l) => n + l.length, 0), "points")
