import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"

/**
 * Painting helpers for the looks (globes24 kit). A look's picture is a 2:1 map for a sphere: longitude -180° to 180°
 * left to right, latitude 90° to -90° top to bottom (the same as src/lib/paint-globe.ts). Paint in steps and await
 * breathe(g) between them, so no step holds the phone for more than 50 ms.
 */
type Geometry = { type: string; coordinates: number[][][] | number[][][][] }
export type Land = { all: Path2D; countries: { id: string; path: Path2D }[] }

/** A pause between painting steps, so the page stays responsive. Pass the canvas's context: the browser records
 *  drawing and only paints it when it must, so this makes it paint the step now, in the step's own task. */
export const breathe = (g?: CanvasRenderingContext2D | null) => {
  g?.getImageData(0, 0, 1, 1)
  return new Promise<void>((r) => setTimeout(r, 0))
}

/** A seeded random (the same picture every time) */
export function seeded(seed = 11) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

/** Draws something at x, and again a world away if it spills over the date line, so the picture has no seam there
 *  (patterns tile cleanly too when their tile divides W) */
export function around(x: number, r: number, W: number, draw: (x: number) => void) {
  draw(x)
  if (x - r < 0) draw(x + W)
  if (x + r > W) draw(x - W)
}

/** A canvas W wide and W / 2 tall, and its 2D context. Paint every look on one of these. */
export function sheet(W: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas"); c.width = W; c.height = W / 2
  // Painted on the CPU: each step's cost lands in its own task (a GPU canvas defers it all to one flush), and the
  // upload to the globe's texture needs no read back from the GPU
  return [c, c.getContext("2d", { willReadFrequently: true })!]
}

/** x and y on the picture for a longitude and latitude */
export const lonX = (lon: number, W: number) => ((lon + 180) / 360) * W
export const latY = (lat: number, W: number) => ((90 - lat) / 180) * (W / 2)

let world: Promise<{ id?: string; geometry: Geometry | null }[]> | null = null
const lands = new Map<number, Promise<Land>>()
/** Every country's outline at this width (Natural Earth 1:110m, world-atlas), whole across the date line.
 *  `all` is every country in one path; `countries` each with its ISO numeric id. */
export function land(W: number): Promise<Land> {
  world ??= import("world-atlas/countries-110m.json").then((m) => {
    const topo = m.default as unknown as Topology<{ countries: GeometryCollection }>
    return (feature(topo, topo.objects.countries) as unknown as { features: { id?: string; geometry: Geometry | null }[] }).features
  })
  if (!lands.has(W)) lands.set(W, world.then(async (features) => {
    await breathe()
    const all = new Path2D(), countries: Land["countries"] = []
    for (const f of features) {
      if (!f.geometry) continue
      const p = new Path2D()
      const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][]
      for (const poly of polys) for (const ring of poly) {
        // Unwrapped, so a ring over the date line stays whole: drawn again a world over to fill the other edge; a ring
        // round a pole (Antarctica) is closed along the pole instead
        const lons = [ring[0][0]]
        for (let i = 1; i < ring.length; i++) { const d = ring[i][0] - ring[i - 1][0]; lons.push(lons[i - 1] + d - 360 * Math.round(d / 360)) }
        const first = lons[0], last = lons[lons.length - 1], lo = Math.min(...lons), hi = Math.max(...lons)
        const trace = (shift: number) => { ring.forEach(([, lat], i) => (i ? p.lineTo : p.moveTo).call(p, lonX(lons[i] + shift, W), latY(lat, W))) }
        if (Math.abs(last - first) > 180) {
          const pole = ring.reduce((s, [, lat]) => s + lat, 0) < 0 ? -90 : 90
          trace(0); p.lineTo(lonX(last, W), latY(pole, W)); p.lineTo(lonX(first, W), latY(pole, W)); p.closePath()
        } else {
          trace(0); p.closePath()
          if (hi > 180) { trace(-360); p.closePath() }
          if (lo < -180) { trace(360); p.closePath() }
        }
      }
      all.addPath(p); countries.push({ id: f.id ?? "", path: p })
    }
    return { all, countries }
  }))
  return lands.get(W)!
}

/** Paper grain over the whole picture: a small noise tile laid over it (cheap, unlike a pixel loop) */
export function grain(g: CanvasRenderingContext2D, amount = 0.08, seed = 7) {
  const T = 128, t = document.createElement("canvas"); t.width = t.height = T
  const x = t.getContext("2d")!, img = x.createImageData(T, T), rnd = seeded(seed)
  for (let i = 0; i < img.data.length; i += 4) { const v = rnd() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255 }
  x.putImageData(img, 0, 0)
  g.save(); g.globalAlpha = amount; g.globalCompositeOperation = "overlay"
  g.fillStyle = g.createPattern(t, "repeat")!; g.fillRect(0, 0, g.canvas.width, g.canvas.height)
  g.restore()
}

/** A site colour (any CSS colour, oklch included) as #rrggbb, read from an element's custom property */
export function cssHex(el: Element, name: string, fallback: string) {
  const x = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
  x.fillStyle = fallback; x.fillStyle = getComputedStyle(el).getPropertyValue(name).trim() || fallback; x.fillRect(0, 0, 1, 1)
  const [r, g, b] = x.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`
}
