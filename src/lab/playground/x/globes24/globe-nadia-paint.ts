import { breathe, grain, land, latY, lonX, seeded, sheet } from "./kit-paint"

/**
 * Look 11's pictures (globe-nadia.tsx): her painting when it's there, the stand-in in her venue map's colours until
 * then, and the blank template she paints on (the same template is saved for her in .brief/docs, made by this code).
 */

/** Her venue map's palette (sampled by eye from venue-map-v2: only these colours, never her pixels) */
export const VENUE = {
  paper: "#edeee1", road: "#d1d4c1", river: "#9fe3e6", green: "#80b059", tree: "#63935b", treeDark: "#3a5d34",
  maple: "#e48759", mapleDeep: "#c96a3d", rail: "#b46931", dot: "#bc5633", brown: "#725349",
}
/** Lantern: her colours under a warm dusk (multiplied), so the painting keeps its hues but sits in the dark */
const DUSK = "#7d7468"

/** The sea under her land when her painting leaves it clear: the river's blue, or the dusk over it */
export const seaOf = (night: boolean) => (night ? "#3f5d66" : VENUE.river)

const dusk = (g: CanvasRenderingContext2D, W: number) => {
  g.save(); g.globalCompositeOperation = "multiply"; g.fillStyle = DUSK; g.fillRect(0, 0, W, W / 2); g.restore()
}

/** Her painting (2:1, any size), resized off the main thread; the sea painted under it if she left it clear */
export async function paintHers(src: string, o: { night: boolean; W: number; sea: boolean }) {
  const res = await fetch(src)
  if (!res.ok) throw new Error("no painting yet")
  const H = o.W / 2, bmp = await createImageBitmap(await res.blob(), { resizeWidth: o.W, resizeHeight: H, resizeQuality: "high" })
  const [c, g] = sheet(o.W)
  if (!o.sea) { g.fillStyle = seaOf(false); g.fillRect(0, 0, o.W, H) }
  g.drawImage(bmp, 0, 0); bmp.close()
  await breathe(g)
  if (o.night) dusk(g, o.W)
  return c
}

/** The stand-in: the world painted the way her venue map is (sage paper land with brushed streaks, soft road-grey
 *  coasts, the river's blue for the sea, little tree clumps, and maple patches where the autumn is) */
export async function paintStandIn({ night, W }: { night: boolean; W: number }) {
  const [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(41)
  g.fillStyle = VENUE.river; g.fillRect(0, 0, W, H)
  // The sea's brush: long soft strokes, as her river is painted
  const streaks = (n: number, colour: string, len: number, lw: number) => {
    g.strokeStyle = colour; g.lineWidth = lw * u; g.lineCap = "round"; g.beginPath()
    for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * H, l = (0.4 + rnd() * 0.6) * len * u; g.moveTo(x, y); g.lineTo(x + l, y - l * 0.45) }
    g.stroke()
  }
  streaks(500, "rgba(255, 255, 255, 0.22)", 60, 2.2)
  streaks(300, "rgba(40, 140, 150, 0.1)", 50, 2)
  const { all } = await land(W)
  await breathe(g)
  // The coast in her road grey-green, soft and wide, then the paper land over it
  g.strokeStyle = VENUE.road; g.lineJoin = "round"; g.lineWidth = 7 * u; g.stroke(all)
  g.fillStyle = VENUE.paper; g.fill(all)
  await breathe(g)
  // Her paper's brushed streaks, on the land only
  g.save(); g.clip(all)
  streaks(900, "rgba(255, 255, 255, 0.55)", 70, 1.6)
  streaks(500, "rgba(150, 155, 130, 0.16)", 60, 1.4)
  g.restore()
  await breathe(g)
  // Where the land is, from a small mask, for placing trees and maples without a test against the whole coastline
  const MW = 512, mask = document.createElement("canvas"); mask.width = MW; mask.height = MW / 2
  const m = mask.getContext("2d", { willReadFrequently: true })!
  m.scale(MW / W, MW / W); m.fill(all)
  const px = m.getImageData(0, 0, MW, MW / 2).data
  const onLand = (x: number, y: number) => px[((Math.floor((y / H) * (MW / 2)) * MW + Math.floor((x / W) * MW)) * 4) + 3] > 200
  await breathe(g)
  // Maple patches where the autumn turns: Japan, and Canada's east and west
  g.save(); g.clip(all)
  for (const [lon, lat, r] of [[136, 36, 46], [140, 39, 34], [131, 33, 28], [-72, 46, 60], [-123, 49, 40], [-80, 44, 44]]) {
    for (let i = 0; i < 6; i++) {
      const x = lonX(lon + (rnd() - 0.5) * 6, W), y = latY(lat + (rnd() - 0.5) * 4, W), rr = r * u * (0.5 + rnd() * 0.6)
      g.fillStyle = rnd() > 0.5 ? VENUE.maple : VENUE.mapleDeep; g.globalAlpha = 0.55
      g.beginPath(); g.ellipse(x, y, rr, rr * 0.7, rnd() * 3, 0, Math.PI * 2); g.fill()
    }
  }
  g.restore(); g.globalAlpha = 1
  await breathe(g)
  // Tree clumps like hers: three rounded crowns, the light one in front, a darker one behind
  for (let i = 0, placed = 0; i < 1600 && placed < 220; i++) {
    const x = rnd() * W, y = latY(-50 + rnd() * 115, W)
    if (!onLand(x, y)) continue
    placed++
    const s = (2.2 + rnd() * 1.4) * u
    for (const [dx, dy, col] of [[-1.1, 0.2, VENUE.treeDark], [1.1, 0.3, VENUE.tree], [0, -0.4, VENUE.green]] as const) {
      g.fillStyle = col; g.beginPath(); g.ellipse(x + dx * s, y + dy * s, s * 0.9, s * 1.25, 0, 0, Math.PI * 2); g.fill()
    }
    if (placed % 80 === 0) await breathe(g)
  }
  await breathe(g)
  grain(g, 0.06, 41)
  if (night) dusk(g, W)
  return c
}

/** The template: a clear 2:1 sheet with a faint graticule every 15°, the coastlines, the band the flat map shows and
 *  the three places the lines meet, as a guide layer to paint over and hide */
export async function paintTemplate({ night, W }: { night: boolean; W: number }) {
  const [c, g] = sheet(W), H = W / 2, u = W / 2048
  g.fillStyle = night ? "#2a2a2e" : "#fbfbf8"; g.fillRect(0, 0, W, H)
  const ink = night ? "rgba(230, 230, 240," : "rgba(60, 70, 90,"
  // The graticule: every 15°, the equator, Greenwich and the date line a little stronger
  g.lineWidth = 1 * u
  for (let lat = -75; lat <= 75; lat += 15) { g.strokeStyle = `${ink} ${lat === 0 ? 0.45 : 0.16})`; g.beginPath(); g.moveTo(0, latY(lat, W)); g.lineTo(W, latY(lat, W)); g.stroke() }
  for (let lon = -180; lon <= 180; lon += 15) { g.strokeStyle = `${ink} ${lon % 180 === 0 ? 0.45 : 0.16})`; g.beginPath(); g.moveTo(lonX(lon, W), 0); g.lineTo(lonX(lon, W), H); g.stroke() }
  // The band the flat map shows (72°N to 64°S): keep the detail between these
  g.setLineDash([10 * u, 8 * u]); g.strokeStyle = `${ink} 0.4)`; g.lineWidth = 1.4 * u
  for (const lat of [72, -64]) { g.beginPath(); g.moveTo(0, latY(lat, W)); g.lineTo(W, latY(lat, W)); g.stroke() }
  g.setLineDash([])
  const { all } = await land(W)
  await breathe(g)
  g.strokeStyle = `${ink} 0.55)`; g.lineWidth = 1.3 * u; g.lineJoin = "round"; g.stroke(all)
  await breathe(g)
  // Labels: the degrees along the equator and the left edge, the band, and the three places
  g.fillStyle = `${ink} 0.6)`; g.font = `${Math.round(11 * u)}px system-ui, sans-serif`; g.textBaseline = "top"
  for (let lon = -180; lon < 180; lon += 30) g.fillText(`${lon}°`, lonX(lon, W) + 3 * u, latY(0, W) + 3 * u)
  for (let lat = -75; lat <= 75; lat += 15) if (lat) g.fillText(`${lat}°`, 3 * u, latY(lat, W) + 3 * u)
  g.fillText("72°N: the flat map's top", lonX(-178, W), latY(72, W) + 3 * u)
  g.fillText("64°S: the flat map's bottom", lonX(-178, W), latY(-64, W) + 3 * u)
  g.font = `600 ${Math.round(12 * u)}px system-ui, sans-serif`; g.textBaseline = "middle"
  for (const [name, lat, lon] of [["Kyoto", 35.01, 135.77], ["Brisbane", -27.47, 153.03], ["Victoria", 48.43, -123.37]] as const) {
    const x = lonX(lon, W), y = latY(lat, W)
    g.strokeStyle = night ? "#ff8f70" : "#c0392b"; g.lineWidth = 1.6 * u
    g.beginPath(); g.arc(x, y, 5 * u, 0, Math.PI * 2); g.moveTo(x - 9 * u, y); g.lineTo(x + 9 * u, y); g.moveTo(x, y - 9 * u); g.lineTo(x, y + 9 * u); g.stroke()
    g.fillStyle = night ? "#ff8f70" : "#c0392b"; g.fillText(name, x + 12 * u, y)
  }
  return c
}
