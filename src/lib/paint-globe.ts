import { feature } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"

/**
 * The globe's picture (and the flat map's), painted on this device, as a 2:1 map for a sphere: longitude -180° to
 * 180° left to right, latitude 90° to -90° top to bottom. Run 27: the antique globe Griffin and Nadia chose on the
 * looks picker. Printed paper gores (twelve strips, 30° each, each a slightly different sheet, with their seams and the
 * polar caps), the engraver's water-lining round every coast, sepia land at 88% so the paper shows through, a faint
 * graticule, the oceans lettered by hand, foxing and paper grain. The sea is solid. Autumn paints it by day, Lantern
 * by night. Seeded, so it paints the same each time; one painting per theme and size, shared by the globe and the flat
 * map. Painted in steps (breathe between them), so no step holds a phone for long. One slot for Nadia's painted land
 * later: if ART.globeLand points to a 2:1 painting, the globe uses that instead.
 */
type Geometry = { type: string; coordinates: number[][][] | number[][][][] }
type Colours = { sea: string; land: string; coast: string; text: string; tint: [string, string]; fox: string; grain: number }

/** The look for each theme (the globe and the flat map share it); `sea` is also the flat map's ground */
export const GLOBE_LOOK = {
  day: { sea: "#e2d4ae", land: "#c9a46c", coast: "#6e4f2c", text: "#5b3f22", tint: ["rgba(255, 240, 210, 1)", "rgba(90, 60, 30, 1)"], fox: "rgba(120, 75, 30, 0.14)", grain: 0.12 },
  night: { sea: "#2c2318", land: "#6f5534", coast: "#d2b98c", text: "#dcc79e", tint: ["rgba(255, 240, 210, 1)", "rgba(90, 60, 30, 1)"], fox: "rgba(0, 0, 0, 0.18)", grain: 0.08 },
} satisfies Record<string, Colours>
/** The land's strength over the paper (Griffin and Nadia: 85 to 90%) */
const LAND_ALPHA = 0.88

const lonX = (lon: number, W: number) => ((lon + 180) / 360) * W
const latY = (lat: number, W: number) => ((90 - lat) / 180) * (W / 2)
/** A pause between steps; reading a pixel makes the canvas draw the step now, in its own task */
const breathe = (g: CanvasRenderingContext2D) => { g.getImageData(0, 0, 1, 1); return new Promise<void>((r) => setTimeout(r, 0)) }
const seeded = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647) }
/** Draws at x, and again a world away if it spills over the date line, so the picture has no seam there */
const around = (x: number, r: number, W: number, draw: (x: number) => void) => { draw(x); if (x - r < 0) draw(x + W); if (x + r > W) draw(x - W) }

/** Every country in one path (Natural Earth 1:110m, world-atlas), whole across the date line */
async function land(W: number) {
  const topo = (await import("world-atlas/countries-110m.json")).default as unknown as Topology<{ countries: GeometryCollection }>
  const features = (feature(topo, topo.objects.countries) as unknown as { features: { geometry: Geometry | null }[] }).features
  const all = new Path2D()
  for (const f of features) {
    if (!f.geometry) continue
    const polys = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][]
    for (const poly of polys) for (const ring of poly) {
      // Unwrapped, so a ring over the date line stays whole: drawn again a world over to fill the other edge; a ring
      // round a pole (Antarctica) is closed along the pole instead
      const lons = [ring[0][0]]
      for (let i = 1; i < ring.length; i++) { const d = ring[i][0] - ring[i - 1][0]; lons.push(lons[i - 1] + d - 360 * Math.round(d / 360)) }
      const first = lons[0], last = lons[lons.length - 1], lo = Math.min(...lons), hi = Math.max(...lons)
      const trace = (shift: number) => ring.forEach(([, lat], i) => (i ? all.lineTo : all.moveTo).call(all, lonX(lons[i] + shift, W), latY(lat, W)))
      if (Math.abs(last - first) > 180) {
        const pole = ring.reduce((s, [, lat]) => s + lat, 0) < 0 ? -90 : 90
        trace(0); all.lineTo(lonX(last, W), latY(pole, W)); all.lineTo(lonX(first, W), latY(pole, W)); all.closePath()
      } else {
        trace(0); all.closePath()
        if (hi > 180) { trace(-360); all.closePath() }
        if (lo < -180) { trace(360); all.closePath() }
      }
    }
  }
  return all
}

const painted = new Map<string, Promise<HTMLCanvasElement>>()
/** One painting per theme and size: switching Globe and Map paints nothing new */
export function paintGlobe(night: boolean, width = 2048): Promise<HTMLCanvasElement> {
  const key = `${night}:${width}`
  if (!painted.has(key)) painted.set(key, paint(night ? GLOBE_LOOK.night : GLOBE_LOOK.day, width))
  return painted.get(key)!
}

async function paint(k: Colours, W: number): Promise<HTMLCanvasElement> {
  const H = W / 2, u = W / 2048, rnd = seeded(19)
  const c = document.createElement("canvas"); c.width = W; c.height = H
  const g = c.getContext("2d", { willReadFrequently: true })!
  g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
  // Each gore its own sheet: a slightly different tone
  for (let i = 0; i < 12; i++) { const light = rnd() > 0.5; g.globalAlpha = light ? 0.04 + rnd() * 0.08 : 0.03 + rnd() * 0.06; g.fillStyle = k.tint[light ? 0 : 1]; g.fillRect((i * W) / 12, 0, W / 12, H) }
  g.globalAlpha = 1
  const all = await land(W)
  await breathe(g)
  // Water-lining: rings round every coast, fainter as they go out to sea
  g.save()
  const sea = new Path2D(); sea.rect(0, 0, W, H); sea.addPath(all)
  g.clip(sea, "evenodd"); g.strokeStyle = k.coast; g.lineJoin = "round"
  for (const [lw, a] of [[14, 0.08], [9, 0.12], [5, 0.18]]) { g.globalAlpha = a; g.lineWidth = lw * u; g.stroke(all) }
  g.restore()
  await breathe(g)
  // The land in sepia (the paper a little through it), a soft shadow inside the coast, then the engraved coast
  g.globalAlpha = LAND_ALPHA; g.fillStyle = k.land; g.fill(all); g.globalAlpha = 1
  g.save(); g.clip(all); g.strokeStyle = k.coast
  for (const [lw, a] of [[10, 0.08], [6, 0.1], [3, 0.14]]) { g.globalAlpha = a; g.lineWidth = lw * u; g.stroke(all) }
  g.restore()
  g.strokeStyle = k.coast; g.lineWidth = 1.4 * u; g.stroke(all)
  await breathe(g)
  // The graticule every 15°, the equator a little stronger
  g.lineWidth = 0.8 * u
  for (let lat = -75; lat <= 75; lat += 15) { g.globalAlpha = lat === 0 ? 0.45 : 0.18; g.beginPath(); g.moveTo(0, latY(lat, W)); g.lineTo(W, latY(lat, W)); g.stroke() }
  g.globalAlpha = 0.18
  for (let lon = -180; lon < 180; lon += 15) { g.beginPath(); g.moveTo(lonX(lon, W), 0); g.lineTo(lonX(lon, W), H); g.stroke() }
  // The seams: each gore's edge (every 30°) and the polar caps at 70°, a fine dark line with the paste's shadow
  g.globalAlpha = 1
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = lonX(lon, W), sh = g.createLinearGradient(x, 0, x + 6 * u, 0)
    sh.addColorStop(0, "rgba(60, 40, 20, 0.22)"); sh.addColorStop(1, "transparent")
    g.fillStyle = sh; g.fillRect(x, 0, 6 * u, H)
    g.fillStyle = "rgba(50, 30, 15, 0.45)"; g.fillRect(x - 0.6 * u, 0, 1.2 * u, H)
  }
  for (const lat of [70, -70]) { g.fillStyle = "rgba(50, 30, 15, 0.4)"; g.fillRect(0, latY(lat, W) - 0.6 * u, W, 1.2 * u) }
  await breathe(g)
  // The oceans, lettered by hand in the site's display face
  const face = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "serif"
  const size = Math.round(30 * u)
  try { await document.fonts.load(`italic ${size}px ${face}`) } catch { /* the fallback face is fine */ }
  g.fillStyle = k.text; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `italic ${size}px ${face}`; g.globalAlpha = 0.85
  if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${4 * u}px`
  for (const [name, lon, lat] of [["Pacific Ocean", -150, 8], ["Pacific Ocean", 165, -12], ["Indian Ocean", 78, -22], ["Atlantic Ocean", -35, 18], ["Southern Ocean", 110, -55]] as const) {
    around(lonX(lon, W), g.measureText(name).width / 2, W, (x) => g.fillText(name, x, latY(lat, W)))
  }
  g.globalAlpha = 1
  // Foxing: a few soft brown spots on the paper
  for (let i = 0; i < 26; i++) {
    const x0 = rnd() * W, y = rnd() * H, r = (0.004 + rnd() * 0.018) * W
    around(x0, r, W, (x) => {
      const b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, k.fox); b.addColorStop(1, "transparent")
      g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2)
    })
  }
  await breathe(g)
  // Paper grain: a small noise tile laid over it
  const T = 128, t = document.createElement("canvas"); t.width = t.height = T
  const x = t.getContext("2d")!, img = x.createImageData(T, T), n = seeded(19)
  for (let i = 0; i < img.data.length; i += 4) { const v = n() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255 }
  x.putImageData(img, 0, 0)
  g.save(); g.globalAlpha = k.grain; g.globalCompositeOperation = "overlay"; g.fillStyle = g.createPattern(t, "repeat")!; g.fillRect(0, 0, W, H); g.restore()
  return c
}
