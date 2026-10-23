import { GlobeLab, type Look } from "../globes24/kit"
import { around, breathe, grain, land, latY, lonX, seeded, sheet } from "../globes24/kit-paint"

/**
 * Run 26, blueprint (a cyanotype): the world as an engineer's sheet. Prussian blue with the blotchy exposure of a
 * sun print, a white graticule every 10° (heavier every 30°), the land hatched at 45° inside a traced coast, and a
 * title block in the Southern Ocean. The lines are white drafting lines and white paper planes fly them.
 */
const look: Look = {
  line: "stitch",
  icon: "plane",
  shade: 0.3,
  rim: 1.2,
  inks: (night) => ({ nadia: "#ffc2a6", griffin: "#cdeeb0", guest: night ? "#b9cbe6" : "#e9f1ff", you: "#ffd866", ink: night ? "#06101f" : "#0b2547", paper: "#f4f8ff" }),
  back: (night) => (night ? "#0c1d36" : "#1f4e8c"),
  paint: async ({ night, width: W }) => {
    const [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(41)
    const white = night ? "rgba(200, 220, 250, " : "rgba(255, 255, 255, "
    g.fillStyle = night ? "#0c1d36" : "#1f4e8c"; g.fillRect(0, 0, W, H)
    // The sun print's uneven exposure
    for (let i = 0; i < 50; i++) {
      const cx = rnd() * W, cy = rnd() * H, r = (0.05 + rnd() * 0.12) * W, tone = rnd() > 0.5 ? "rgba(90, 140, 210, 0.16)" : "rgba(5, 20, 50, 0.22)"
      around(cx, r, W, (x) => { const b = g.createRadialGradient(x, cy, 0, x, cy, r); b.addColorStop(0, tone); b.addColorStop(1, "transparent"); g.fillStyle = b; g.fillRect(x - r, cy - r, r * 2, r * 2) })
    }
    await breathe(g)
    // The graticule
    for (let lon = -180; lon <= 180; lon += 10) { g.strokeStyle = `${white}${lon % 30 ? 0.16 : 0.34})`; g.lineWidth = (lon % 30 ? 0.8 : 1.4) * u; g.beginPath(); g.moveTo(lonX(lon, W), 0); g.lineTo(lonX(lon, W), H); g.stroke() }
    for (let lat = -80; lat <= 80; lat += 10) { g.strokeStyle = `${white}${lat % 30 ? 0.16 : 0.34})`; g.lineWidth = (lat % 30 ? 0.8 : 1.4) * u; g.beginPath(); g.moveTo(0, latY(lat, W)); g.lineTo(W, latY(lat, W)); g.stroke() }
    g.setLineDash([10 * u, 6 * u]); g.strokeStyle = `${white}0.5)`; g.lineWidth = 1.2 * u
    for (const lat of [23.44, -23.44, 0]) { g.beginPath(); g.moveTo(0, latY(lat, W)); g.lineTo(W, latY(lat, W)); g.stroke() }
    g.setLineDash([])
    await breathe(g)
    // The land: 45° hatching inside the coast, the coast traced twice
    const { all } = await land(W)
    g.save(); g.clip(all); g.fillStyle = `${white}0.07)`; g.fillRect(0, 0, W, H)
    g.strokeStyle = `${white}0.42)`; g.lineWidth = 1 * u; g.beginPath()
    for (let x = -H; x < W; x += 7 * u) { g.moveTo(x, H); g.lineTo(x + H, 0) }
    g.stroke(); g.restore()
    await breathe(g)
    g.lineJoin = "round"; g.strokeStyle = `${white}0.95)`; g.lineWidth = 1.7 * u; g.stroke(all)
    g.save(); g.translate(1.6 * u, 1.2 * u); g.strokeStyle = `${white}0.35)`; g.lineWidth = 0.9 * u; g.stroke(all); g.restore()
    await breathe(g)
    // The title block, in the Southern Ocean south of Australia
    const x0 = lonX(95, W), y0 = latY(-47, W), bw = lonX(175, W) - x0, bh = latY(-60, W) - y0
    g.strokeStyle = `${white}0.85)`; g.lineWidth = 1.6 * u; g.strokeRect(x0, y0, bw, bh)
    g.beginPath(); g.moveTo(x0, y0 + bh * 0.5); g.lineTo(x0 + bw, y0 + bh * 0.5); g.moveTo(x0 + bw * 0.62, y0 + bh * 0.5); g.lineTo(x0 + bw * 0.62, y0 + bh); g.stroke()
    g.fillStyle = `${white}0.9)`; g.textBaseline = "middle"
    g.font = `600 ${bh * 0.26}px ui-monospace, Menlo, monospace`; g.fillText("KYOTO 京都", x0 + 10 * u, y0 + bh * 0.25)
    g.font = `500 ${bh * 0.18}px ui-monospace, Menlo, monospace`
    g.fillText("15 OCT 2027", x0 + 10 * u, y0 + bh * 0.75); g.fillText("NOT TO SCALE", x0 + bw * 0.62 + 10 * u, y0 + bh * 0.75)
    await breathe(g)
    grain(g, night ? 0.08 : 0.12, 41)
    return c
  },
}

export default function GlobeBlueprint() {
  return <GlobeLab look={look} />
}
