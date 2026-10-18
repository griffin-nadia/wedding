import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"

/**
 * The globe's picture, painted on this device (final run), as a 2:1 map for a sphere: a pale wash for the sea, the
 * land as soft washes with darker pooled edges (where watercolour gathers as it dries), a few blooms inside, and
 * paper grain over it all. No wireframe. Natural Earth 1:110m land (world-atlas). Seeded, so it paints the same each
 * time. One slot for Nadia's painted land later: if ART.globeLand points to a 2:1 painting, the globe uses that instead.
 */
type Colours = { sea: string; seaDeep: string; land: string; landEdge: string; bloom: string; grain: number }
let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)

export async function paintGlobe(colours: Colours, width = 2048): Promise<HTMLCanvasElement> {
  const topo = (await import("world-atlas/land-110m.json")).default as unknown as Topology<{ land: GeometryCollection }>
  const land = feature(topo, topo.objects.land) as unknown as { features: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }[] }
  const W = width, H = width / 2
  const c = document.createElement("canvas"); c.width = W; c.height = H
  const g = c.getContext("2d")!
  seed = 11
  // Sea: a pale wash, a touch deeper towards the poles
  const sea = g.createLinearGradient(0, 0, 0, H)
  sea.addColorStop(0, colours.seaDeep); sea.addColorStop(0.5, colours.sea); sea.addColorStop(1, colours.seaDeep)
  g.fillStyle = sea; g.fillRect(0, 0, W, H)
  // The land as one path, its rings broken where they cross the date line
  const path = new Path2D()
  const X = (lon: number) => ((lon + 180) / 360) * W, Y = (lat: number) => ((90 - lat) / 180) * H
  for (const f of land.features) {
    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][]
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
  g.save()
  g.fillStyle = colours.land; g.globalAlpha = 0.85; g.fill(path)
  g.clip(path)
  // Blooms: soft, uneven patches of a slightly different wash
  for (let i = 0; i < 140; i++) {
    const x = rnd() * W, y = rnd() * H, r = (0.02 + rnd() * 0.06) * W
    const b = g.createRadialGradient(x, y, 0, x, y, r)
    b.addColorStop(0, colours.bloom); b.addColorStop(1, "transparent")
    g.globalAlpha = 0.18 + rnd() * 0.22; g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // Pooled edges: a darker line along every coast, blurred inward (the clip keeps it on the land)
  g.globalAlpha = 0.55; g.strokeStyle = colours.landEdge; g.lineWidth = W / 300; g.filter = `blur(${W / 700}px)`; g.stroke(path)
  g.globalAlpha = 0.35; g.lineWidth = W / 120; g.filter = `blur(${W / 260}px)`; g.stroke(path)
  g.restore()
  // Paper grain over everything
  const img = g.getImageData(0, 0, W, H), d = img.data
  for (let i = 0; i < d.length; i += 4) { const n = (rnd() - 0.5) * colours.grain; d[i] += n; d[i + 1] += n; d[i + 2] += n }
  g.putImageData(img, 0, 0)
  return c
}
