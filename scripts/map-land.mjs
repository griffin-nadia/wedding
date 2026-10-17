// node scripts/map-land.mjs — the guest maps' land (18f): the real outlines of Australia, New Zealand, Japan and
// Canada from world-atlas (Natural Earth 1:110m, public domain), each placed in its own spot on the 400 × 320 map at
// its own scale (honestly "not to scale" between them, true to shape within each). Kyoto lands exactly on the map's
// Kyoto. Writes src/lib/map-land.ts: the paths, and each region's projection so cities can be placed on it.
import fs from "node:fs"
import { feature } from "topojson-client"

const world = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"))
const all = feature(world, world.objects.countries).features
// Each region: the country, and the box it fills on the map (x, y, width, height); Japan is pinned at Kyoto instead
const REGIONS = {
  AU: { id: "036", box: [64, 196, 172, 116] },
  NZ: { id: "554", box: [246, 252, 40, 56] },
  CA: { id: "124", box: [282, 14, 110, 74], minArea: 4 },
  JP: { id: "392", pin: { lon: 135.77, lat: 35.01, x: 132, y: 112 }, scale: 6.2 },
}
const out = {}
for (const [key, r] of Object.entries(REGIONS)) {
  const f = all.find((x) => x.id === r.id)
  const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates)
  // Drop the smallest islands (degrees²), so the shape reads at this size
  const area = (ring) => Math.abs(ring.reduce((a, [x1, y1], i) => { const [x2, y2] = ring[(i + 1) % ring.length]; return a + x1 * y2 - x2 * y1 }, 0) / 2)
  const kept = polys.filter((p) => area(p[0]) >= (r.minArea ?? 0.3))
  const pts = kept.flatMap((p) => p[0])
  const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1])
  const [w, e, s, n] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)]
  const k = Math.cos((((s + n) / 2) * Math.PI) / 180)
  let proj
  if (r.pin) proj = { lon0: r.pin.lon, lat0: r.pin.lat, x0: r.pin.x, y0: r.pin.y, k, s: r.scale }
  else {
    const [bx, by, bw, bh] = r.box
    const sc = Math.min(bw / ((e - w) * k), bh / (n - s))
    const dw = (e - w) * k * sc, dh = (n - s) * sc
    proj = { lon0: w, lat0: n, x0: bx + (bw - dw) / 2, y0: by + (bh - dh) / 2, k, s: sc }
  }
  const P = ([lon, lat]) => [proj.x0 + (lon - proj.lon0) * proj.k * proj.s, proj.y0 - (lat - proj.lat0) * proj.s]
  const d = kept.map((p) => {
    let last = null
    const xs = p[0].map(P).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]).filter(([x, y]) => { const keep = !last || Math.hypot(x - last[0], y - last[1]) >= 0.8; if (keep) last = [x, y]; return keep })
    return "M" + xs.map(([x, y]) => `${x} ${y}`).join("L") + "Z"
  }).join("")
  out[key] = { d, proj: Object.fromEntries(Object.entries(proj).map(([a, v]) => [a, Math.round(v * 10000) / 10000])) }
}
const ts = `// Made by scripts/map-land.mjs from world-atlas (Natural Earth 1:110m). Don't edit by hand.
export type Region = keyof typeof LAND
export const LAND = ${JSON.stringify(out, null, 2)} as const
/** A place on the guest map: its region's projection (each region at its own scale, not to scale between them) */
export function onMap(region: Region, lat: number, lon: number): [number, number] {
  const p = LAND[region].proj
  return [Math.round(p.x0 + (lon - p.lon0) * p.k * p.s), Math.round(p.y0 - (lat - p.lat0) * p.s)]
}
`
fs.writeFileSync("src/lib/map-land.ts", ts)
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.d.length])))
