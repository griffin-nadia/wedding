import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import NUMERIC from "@/data/country-numeric.json"

/**
 * The globe's picture (and the flat map's), painted on this device, as a 2:1 map for a sphere. Run 19: see-through.
 * The sea is a pale wash at half strength and every country is a soft wash of its own (Natural Earth 1:110m,
 * world-atlas), so on the globe the far side's land shows faintly through the near side as it turns. Countries with
 * guests are a touch stronger; Australia, Canada, Japan, New Zealand and every guest's country also get organic
 * painted edges (a darker pooled line along the coast, blurred inward, painted twice a hair apart, the way
 * watercolour gathers as it dries). A few blooms inside the land, paper grain over it all. Seeded, so it paints the
 * same each time; one painting per look, shared by the globe and the flat map. One slot for Nadia's painted land
 * later: if ART.globeLand points to a 2:1 painting, the globe uses that instead.
 */
type Colours = { sea: string; seaDeep: string; land: string; landEdge: string; bloom: string; grain: number }
type Geometry = { type: string; coordinates: number[][][] | number[][][][] }
let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

/** The four home countries, always painted with edges */
export const HOME_COUNTRIES = ["AU", "CA", "JP", "NZ"]
const numeric = NUMERIC as Record<string, string>

const painted = new Map<string, Promise<HTMLCanvasElement>>()
/** One painting per look (colours, size and which countries have guests): switching Globe and Flat paints nothing new */
export function paintGlobe(colours: Colours, width = 2048, guestCountries: string[] = []): Promise<HTMLCanvasElement> {
  const key = JSON.stringify([colours, width, [...new Set(guestCountries)].sort()])
  if (!painted.has(key)) painted.set(key, paint(colours, width, guestCountries))
  return painted.get(key)!
}

async function paint(colours: Colours, width: number, guestCountries: string[]): Promise<HTMLCanvasElement> {
  const topo = (await import("world-atlas/countries-110m.json")).default as unknown as Topology<{ countries: GeometryCollection }>
  const countries = (feature(topo, topo.objects.countries) as unknown as { features: { id?: string; geometry: Geometry | null }[] }).features
  const guests = new Set(guestCountries.map((c) => numeric[c]).filter(Boolean))
  const edged = new Set([...HOME_COUNTRIES.map((c) => numeric[c]), ...guests])
  const W = width, H = width / 2
  const c = document.createElement("canvas"); c.width = W; c.height = H
  const g = c.getContext("2d")!
  seed = 11
  // Sea: a pale wash at half strength, a touch deeper towards the poles
  const sea = g.createLinearGradient(0, 0, 0, H)
  sea.addColorStop(0, colours.seaDeep); sea.addColorStop(0.5, colours.sea); sea.addColorStop(1, colours.seaDeep)
  // Run 25: a little more see-through (0.5 to 0.42, land 0.62 to 0.48), so the card's paper shows through both views
  g.globalAlpha = 0.42; g.fillStyle = sea; g.fillRect(0, 0, W, H); g.globalAlpha = 1
  // Each country as a path, its rings broken where they cross the date line
  const X = (lon: number) => ((lon + 180) / 360) * W, Y = (lat: number) => ((90 - lat) / 180) * H
  const trace = (path: Path2D, geo: Geometry) => {
    const polys = (geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates) as number[][][][]
    for (const poly of polys) for (const ring of poly) {
      let last: number | null = null
      ring.forEach(([lon, lat], i) => {
        const jump = last !== null && Math.abs(lon - last) > 180
        if (i === 0 || jump) path.moveTo(X(lon), Y(lat)); else path.lineTo(X(lon), Y(lat))
        last = lon
      })
      path.closePath()
    }
  }
  const all = new Path2D(), strong = new Path2D(), edges = new Path2D(), each: Path2D[] = []
  for (const f of countries) {
    if (!f.geometry) continue
    const p = new Path2D(); trace(p, f.geometry); each.push(p)
    all.addPath(p)
    if (f.id && guests.has(f.id)) strong.addPath(p)
    if (f.id && edged.has(f.id)) edges.addPath(p)
  }
  // Every country a soft wash; the ones with guests (and the home four) a touch stronger
  g.fillStyle = colours.land
  g.globalAlpha = 0.48; g.fill(all)
  g.globalAlpha = 0.2; g.fill(edges); g.fill(strong)
  // Blooms: soft, uneven patches of a slightly different wash, on the land only
  g.save(); g.clip(all)
  for (let i = 0; i < 140; i++) {
    const x = rnd() * W, y = rnd() * H, r = (0.02 + rnd() * 0.06) * W
    const b = g.createRadialGradient(x, y, 0, x, y, r)
    b.addColorStop(0, colours.bloom); b.addColorStop(1, "transparent")
    g.globalAlpha = 0.14 + rnd() * 0.18; g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  g.restore()
  // Every border, faint, so each country reads as its own wash
  g.globalAlpha = 0.22; g.strokeStyle = colours.landEdge; g.lineWidth = W / 1600
  for (const p of each) g.stroke(p)
  // Organic painted edges on the highlighted countries: pooled inward (the clip keeps it on the land), twice a hair
  // apart so the line wanders like a brush rather than a pen
  g.save(); g.clip(edges); g.strokeStyle = colours.landEdge
  for (const [dx, dy, a, lw, blur] of [[0, 0, 0.55, W / 300, W / 700], [W / 1400, -W / 1800, 0.3, W / 520, W / 1100], [0, 0, 0.32, W / 120, W / 260]]) {
    g.setTransform(1, 0, 0, 1, dx, dy)
    g.globalAlpha = a; g.lineWidth = lw; g.filter = `blur(${blur}px)`; g.stroke(edges)
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = "none"
  g.restore()
  // Paper grain over everything (colour only; the see-through stays as painted)
  const img = g.getImageData(0, 0, W, H), d = img.data
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * colours.grain; d[i] += n; d[i + 1] += n; d[i + 2] += n }
  g.putImageData(img, 0, 0)
  return c
}

/** The look for each theme (the globe and the flat map share it) */
export const GLOBE_LOOK = {
  night: { sea: "#3a3a36", seaDeep: "#2c2b27", land: "#76744f", landEdge: "#26241a", bloom: "#8a7a52", grain: 10 },
  day: { sea: "#e6e6dc", seaDeep: "#d8dbd2", land: "#c4bb90", landEdge: "#6f673f", bloom: "#b5a77a", grain: 12 },
}
