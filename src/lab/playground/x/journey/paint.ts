import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"

/**
 * The journey area's painter (lab run 19): Natural Earth 1:110m land (world-atlas, already the site's) painted as a
 * 2:1 equirectangular picture in one of three hands, for the globe's texture and the flat map:
 * - watercolour: see-through washes on a clear sea, layered so edges pool darker, a few blooms, grain
 * - ink: pale paper, coastlines drawn twice with a slightly unsteady pen, hatching inside the land, a faint graticule
 * - gouache: flat opaque colour cut from paper: a white cut edge and a soft shadow under each piece
 * Painted in steps with a yield between them, so no single task runs long on a phone. Seeded, so it's the same each time.
 */
export type Style = "watercolour" | "ink" | "gouache"
export type Inks = { paper: string; sea: string; land: string; edge: string; ink: string; bloom: string; night: boolean }

let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const yieldNow = () => new Promise<void>((r) => setTimeout(r, 0))

/** The site's colours (oklch) as hex, which canvas and Three.js both read */
export function cssHex(el: Element, v: string, fallback: string) {
  const x = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
  x.fillStyle = fallback; x.fillStyle = getComputedStyle(el).getPropertyValue(v).trim() || fallback; x.fillRect(0, 0, 1, 1)
  const [r, g, b] = x.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`
}
const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})` }

/** The land as one Path2D on a W × H equirectangular frame, rings broken where they cross the date line */
async function landPath(W: number, H: number, jitter = 0) {
  const topo = (await import("world-atlas/land-110m.json")).default as unknown as Topology<{ land: GeometryCollection }>
  const land = feature(topo, topo.objects.land) as unknown as { features: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }[] }
  const path = new Path2D()
  const X = (lon: number) => ((lon + 180) / 360) * W, Y = (lat: number) => ((90 - lat) / 180) * H
  const j = () => (jitter ? (rnd() - 0.5) * jitter : 0)
  for (const f of land.features) {
    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][]
    for (const poly of polys) for (const ring of poly) {
      let prev: number | null = null
      ring.forEach(([lon, lat], i) => {
        if (i === 0 || (prev !== null && Math.abs(lon - prev) > 180)) path.moveTo(X(lon) + j(), Y(lat) + j())
        else path.lineTo(X(lon) + j(), Y(lat) + j())
        prev = lon
      })
      path.closePath()
    }
  }
  return path
}

function grain(g: CanvasRenderingContext2D, W: number, H: number, n: number, dark: boolean) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = dark ? `rgba(255,255,255,${rnd() * 0.05})` : `rgba(60,40,20,${rnd() * 0.06})`
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 1.5, 1 + rnd() * 1.5)
  }
}

export async function paint(style: Style, c: Inks, W = 2048): Promise<HTMLCanvasElement> {
  const H = W / 2, k = W / 2048
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H
  const g = cv.getContext("2d")!
  seed = 7
  const land = await landPath(W, H)
  await yieldNow()
  if (style === "watercolour") {
    // A clear sea with only a breath of colour, so the far side of the globe shows through
    g.fillStyle = rgba(c.sea, c.night ? 0.22 : 0.16); g.fillRect(0, 0, W, H)
    // Three washes a pixel or two apart: where they overlap the colour deepens, like layered watercolour
    for (const [dx, dy, a] of [[0, 0, 0.42], [1.6 * k, -1.1 * k, 0.24], [-1.2 * k, 1.4 * k, 0.2]] as const) {
      g.save(); g.translate(dx, dy); g.fillStyle = rgba(c.land, a); g.fill(land); g.restore()
    }
    await yieldNow()
    // Pooled edges: a soft dark line just inside the coast
    g.save(); g.clip(land); g.filter = `blur(${2.2 * k}px)`; g.strokeStyle = rgba(c.edge, 0.42); g.lineWidth = 5 * k; g.stroke(land); g.restore()
    await yieldNow()
    // A few blooms inside the land
    g.save(); g.clip(land)
    for (let i = 0; i < 46; i++) {
      const x = rnd() * W, y = H * 0.15 + rnd() * H * 0.7, r = (30 + rnd() * 90) * k
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(c.bloom, 0.18)); gr.addColorStop(1, rgba(c.bloom, 0))
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2)
    }
    g.restore()
  } else if (style === "ink") {
    g.fillStyle = c.paper; g.fillRect(0, 0, W, H)
    g.fillStyle = rgba(c.sea, c.night ? 0.3 : 0.28); g.fillRect(0, 0, W, H) // a wash on the sea, so the globe reads on the card
    // A faint graticule every 30 degrees, dotted, as on an old school map
    g.save(); g.strokeStyle = rgba(c.ink, 0.14); g.lineWidth = 1 * k; g.setLineDash([3 * k, 5 * k])
    for (let lon = -180; lon <= 180; lon += 30) { const x = ((lon + 180) / 360) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke() }
    for (let lat = -60; lat <= 60; lat += 30) { const y = ((90 - lat) / 180) * H; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke() }
    g.restore()
    g.fillStyle = rgba(c.land, 0.32); g.fill(land)
    await yieldNow()
    // Hatching inside the land, at 45 degrees
    g.save(); g.clip(land); g.strokeStyle = rgba(c.ink, 0.2); g.lineWidth = 0.9 * k
    for (let x = -H; x < W; x += 7 * k) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke() }
    g.restore()
    await yieldNow()
    // The coast drawn twice with an unsteady pen
    const wobble = await landPath(W, H, 1.6 * k)
    g.strokeStyle = rgba(c.ink, 0.85); g.lineWidth = 1.5 * k; g.lineJoin = "round"; g.stroke(land)
    g.strokeStyle = rgba(c.ink, 0.45); g.lineWidth = 0.8 * k; g.stroke(wobble)
  } else {
    // Gouache: an opaque sea, then each piece of land cut from paper and laid on it
    g.fillStyle = c.sea; g.fillRect(0, 0, W, H)
    g.save(); g.translate(2.2 * k, 3 * k); g.filter = `blur(${2.4 * k}px)`; g.fillStyle = rgba("#1e140c", c.night ? 0.5 : 0.32); g.fill(land); g.restore()
    await yieldNow()
    g.strokeStyle = c.paper; g.lineWidth = 5 * k; g.lineJoin = "round"; g.stroke(land)
    g.fillStyle = c.land; g.fill(land)
  }
  await yieldNow()
  grain(g, W, H, Math.round(14000 * k * k), c.night)
  return cv
}
