import type { Look } from "./kit-view"
import { around, breathe, grain, land, latY, lonX, seeded, sheet } from "./kit-paint"

/**
 * Look 4, an antique paper globe: printed as twelve gores (the lens-shaped strips a globe maker pasted round a ball,
 * each 30° wide, each a slightly different sheet) with polar caps, so the seams show as meridians. Sepia land with
 * the old engraver's water-lining round every coast, a faint graticule, the oceans lettered by hand, foxing on the
 * paper, and a little compass rose in the corner. The lines are inked travel routes. Flat, it's the printed sheet of
 * gores before it was pasted; the toggle pastes it round the ball.
 */
const COL = {
  day: { paper: "#ecdcb8", sea: "#e2d4ae", land: "#c9a46c", coast: "#6e4f2c", text: "#5b3f22" },
  night: { paper: "#33281c", sea: "#2c2318", land: "#6f5534", coast: "#d2b98c", text: "#dcc79e" },
}

const css = `
.x-gan-rose { position: absolute; left: 4%; bottom: 4%; width: clamp(44px, 12%, 72px); height: auto; color: var(--ink); opacity: .75; pointer-events: none; }
`
const rose = (
  <svg className="x-gan-rose" viewBox="-50 -50 100 100" aria-hidden>
    <circle r="30" fill="none" stroke="currentColor" strokeWidth="1" />
    <circle r="26" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 2" />
    <path d="M0 -44L6 -6L0 0L-6 -6Z" fill="currentColor" />
    <path d="M0 44L6 6L0 0L-6 6Z" fill="none" stroke="currentColor" strokeWidth="1" />
    <path d="M44 0L6 6L0 0L6 -6Z" fill="none" stroke="currentColor" strokeWidth="1" />
    <path d="M-44 0L-6 6L0 0L-6 -6Z" fill="currentColor" />
    <path d="M22 -22L4 -4M-22 22L-4 4M22 22L4 4M-22 -22L-4 -4" stroke="currentColor" strokeWidth="1" />
    <text y="-46" textAnchor="middle" fontSize="11" fontStyle="italic" fill="currentColor" fontFamily="var(--font-display)">N</text>
  </svg>
)

export const look: Look = {
  line: "ink",
  shade: 0.3,
  rim: 1.2,
  // Run 27 (Jehan): see-through, so a line going round the back still shows faintly through the paper
  seeThrough: 0.3,
  farLines: 0.4,
  // Run 27 (Jehan): the routes stronger against the faded paper, each mode its own (3:1 or more on the sea and the land,
  // the household's gold too; tokens.css --journey-* keep the key the same)
  inks: (night) => night
    ? { nadia: "#f08c5c", griffin: "#b3cf8f", guest: "#e3cfa2", you: "#f4c55a", ink: "#efdfbf" }
    : { nadia: "#a23a1c", griffin: "#3e5a2a", guest: "#5b4126", you: "#8f5800", ink: "#3d2a18" },
  weight: 1.15,
  decor: rose,
  css,
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(19)
    g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
    // Each gore its own sheet: a slightly different tone
    for (let i = 0; i < 12; i++) { g.fillStyle = rnd() > 0.5 ? `rgba(255, 240, 210, ${0.04 + rnd() * 0.08})` : `rgba(90, 60, 30, ${0.03 + rnd() * 0.06})`; g.fillRect((i * W) / 12, 0, W / 12, H) }
    const { all } = await land(W)
    await breathe(g)
    // Water-lining: rings round every coast, fainter as they go out to sea
    g.save()
    const sea = new Path2D(); sea.rect(0, 0, W, H); sea.addPath(all)
    g.clip(sea, "evenodd")
    g.strokeStyle = k.coast; g.lineJoin = "round"
    for (const [lw, a] of [[14, 0.08], [9, 0.12], [5, 0.18]]) { g.globalAlpha = a; g.lineWidth = lw * u; g.stroke(all); await breathe(g) }
    g.restore()
    await breathe(g)
    // The land in sepia, a soft shadow inside the coast, then the engraved coast
    g.fillStyle = k.land; g.fill(all)
    g.save(); g.clip(all); g.strokeStyle = k.coast
    for (const [lw, a] of [[10, 0.08], [6, 0.1], [3, 0.14]]) { g.globalAlpha = a; g.lineWidth = lw * u; g.stroke(all); await breathe(g) }
    g.restore()
    g.strokeStyle = k.coast; g.lineWidth = 1.4 * u; g.stroke(all)
    await breathe(g)
    // The graticule every 15°, the equator a little stronger
    g.strokeStyle = k.coast; g.lineWidth = 0.8 * u
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
    g.fillStyle = k.text; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `italic ${size}px ${face}`
    g.globalAlpha = 0.85
    for (const [name, lon, lat] of [["Pacific Ocean", -150, 8], ["Pacific Ocean", 165, -12], ["Indian Ocean", 78, -22], ["Atlantic Ocean", -35, 18], ["Southern Ocean", 110, -55]] as const) {
      if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${4 * u}px`
      around(lonX(lon, W), g.measureText(name).width / 2, W, (x) => g.fillText(name, x, latY(lat, W)))
    }
    g.globalAlpha = 1
    // Foxing: a few soft brown spots on the paper
    for (let i = 0; i < 26; i++) {
      const x0 = rnd() * W, y = rnd() * H, r = (0.004 + rnd() * 0.018) * W
      around(x0, r, W, (x) => {
        const b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, night ? "rgba(0,0,0,0.18)" : "rgba(120, 75, 30, 0.14)"); b.addColorStop(1, "transparent")
        g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2)
      })
    }
    grain(g, night ? 0.08 : 0.12, 19)
    return c
  },
}
