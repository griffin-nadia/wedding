import type { Look } from "../globes24/kit-view"
import { breathe, grain, land, latY, lonX, seeded, sheet } from "../globes24/kit-paint"

/**
 * Run 26, airmail (航空便): the whole world as an airmail envelope. The sea is thin blue airmail paper with its laid
 * lines, the land the envelope's cream, and the poles wear the red and blue chevron border, so on the globe they're
 * striped caps and on the map a border top and bottom. Postmarks are stamped across the oceans and PAR AVION runs
 * over the Pacific. Paper planes fly every line.
 */
const COL = {
  day: { sea: "#c9dbea", laid: "rgba(255, 255, 255, 0.45)", land: "#f6eedb", coast: "#1d3c78", red: "#c8312b", blue: "#1d3c78", gap: "#f6eedb", stamp: "rgba(29, 60, 120, 0.55)" },
  night: { sea: "#15233f", laid: "rgba(255, 255, 255, 0.05)", land: "#2c3550", coast: "#c9d5ee", red: "#a8322c", blue: "#5d79b8", gap: "#d8cfb8", stamp: "rgba(232, 222, 196, 0.45)" },
}

/** A postmark: two rings, the town and date inside, wavy cancel lines trailing to the right */
function postmark(g: CanvasRenderingContext2D, x: number, y: number, r: number, ink: string, u: number, lines: [string, string]) {
  g.save(); g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 2.2 * u
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke()
  g.lineWidth = 1.2 * u; g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); g.stroke()
  g.textAlign = "center"; g.textBaseline = "middle"
  g.font = `600 ${r * 0.34}px Georgia, serif`; g.fillText(lines[0], x, y - r * 0.2)
  g.font = `500 ${r * 0.26}px ui-monospace, Menlo, monospace`; g.fillText(lines[1], x, y + r * 0.25)
  g.lineWidth = 2 * u
  for (let i = 0; i < 5; i++) {
    const yy = y - r * 0.6 + i * r * 0.3
    g.beginPath(); g.moveTo(x + r * 1.15, yy)
    for (let k = 0; k <= 24; k++) g.lineTo(x + r * 1.15 + k * r * 0.12, yy + Math.sin(k * 0.9) * r * 0.08)
    g.stroke()
  }
  g.restore()
}

export const look: Look = {
  line: "stitch",
  icon: "plane",
  shade: 0.25,
  rim: 1,
  inks: (night) => (night
    ? { nadia: "#ec6a5c", griffin: "#a9c0ee", guest: "#e8dcc2", ink: "#0d1830", paper: "#f6eedb" }
    : { nadia: "#c8312b", griffin: "#1d3c78", guest: "#3b3550", ink: "#1d2440", paper: "#fffaf0" }),
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(23)
    // Airmail paper: thin blue with laid lines
    g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
    g.fillStyle = k.laid
    for (let y = 0; y < H; y += 5 * u) g.fillRect(0, y, W, 1 * u)
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255, 255, 255, ${0.04 + rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, (20 + rnd() * 80) * u, 1.2 * u) }
    await breathe(g)
    // The land, the envelope's cream with a navy coast
    const { all } = await land(W)
    g.fillStyle = k.land; g.fill(all)
    g.strokeStyle = k.coast; g.lineWidth = 1.3 * u; g.lineJoin = "round"; g.stroke(all)
    await breathe(g)
    // The chevron border round both poles: red, paper, blue, paper, slanted
    const band = (y0: number, y1: number) => {
      g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip()
      const S = 46 * u, slant = (y1 - y0) * 0.9
      g.fillStyle = k.gap; g.fillRect(0, y0, W, y1 - y0)
      for (let x = -slant, i = 0; x < W + slant; x += S, i++) {
        g.fillStyle = i % 2 ? k.blue : k.red
        g.beginPath(); g.moveTo(x, y1); g.lineTo(x + S * 0.6, y1); g.lineTo(x + S * 0.6 + slant, y0); g.lineTo(x + slant, y0); g.closePath(); g.fill()
      }
      g.restore()
    }
    band(0, latY(64, W)); band(latY(-60, W), H)
    await breathe(g)
    // Postmarks over the oceans and PAR AVION over the Pacific
    const r = 54 * u
    postmark(g, lonX(-150, W), latY(18, W), r, k.stamp, u, ["KYOTO", "15 X 2027"])
    postmark(g, lonX(75, W), latY(-22, W), r * 0.9, k.stamp, u, ["BRISBANE", "AIR MAIL"])
    postmark(g, lonX(-38, W), latY(32, W), r * 0.85, k.stamp, u, ["VICTORIA", "BY AIR"])
    g.save(); g.fillStyle = k.coast; g.globalAlpha = 0.6; g.font = `italic 700 ${44 * u}px Georgia, serif`; g.textAlign = "center"
    g.translate(lonX(-130, W), latY(-18, W)); g.rotate(-0.08); g.fillText("PAR AVION · 航空便", 0, 0); g.restore()
    await breathe(g)
    grain(g, night ? 0.06 : 0.09, 23)
    return c
  },
}
