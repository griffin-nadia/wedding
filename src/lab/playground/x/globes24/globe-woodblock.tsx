import type { Look } from "./kit-view"
import { around, breathe, grain, land, seeded, sheet } from "./kit-paint"

/**
 * Look 3, woodblock print (ukiyo-e): the sea in seigaiha (青海波), overlapping fans of waves, deepening to Prussian blue
 * towards the poles (bokashi, the printer's wiped gradient); the land one flat colour from its own block, printed a
 * hair off the key block's ink outline (misregistration), and the grain of the wood and the paper over it all.
 */
const COL = {
  day: { paper: "#efe3c8", sea: "#b9cdc8", wave: "#3a6378", deep: "#2b4f68", land: "#a3b56b", land2: "#869c55", key: "#2a2420" },
  night: { paper: "#211c18", sea: "#1d2c38", wave: "#6d8ea2", deep: "#0f1a24", land: "#55703f", land2: "#475f35", key: "#0c0a08" },
}

/** One seigaiha tile: rows of fans, each fan a filled circle with three rings, the lower rows over the upper */
function seigaiha(T: number, sea: string, wave: string, lw: number) {
  const t = document.createElement("canvas"); t.width = T; t.height = T / 2
  const g = t.getContext("2d")!, R = T / 2
  g.fillStyle = sea; g.fillRect(0, 0, T, T / 2)
  for (const [cx, cy] of [[0, 0], [T, 0], [T / 2, T / 4], [0, T / 2], [T, T / 2]]) {
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fillStyle = sea; g.fill()
    g.strokeStyle = wave; g.lineWidth = lw
    for (const k of [0.94, 0.7, 0.46, 0.22]) { g.beginPath(); g.arc(cx, cy, R * k, 0, Math.PI * 2); g.stroke() }
  }
  return t
}

export const look: Look = {
  line: "dots",
  shade: 0.25,
  rim: 1.5,
  inks: (night) => ({ guest: night ? "#c9b48a" : "#4a3a2c", ink: night ? "#e9dcc0" : "#2a2420" }),
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(3)
    // The sea: seigaiha, then the bokashi towards the poles
    g.fillStyle = g.createPattern(seigaiha(W / 64, k.sea, k.wave, Math.max(1, 1.3 * u)), "repeat")!
    g.fillRect(0, 0, W, H)
    for (const [y0, y1] of [[0, H * 0.3], [H, H * 0.7]]) {
      const b = g.createLinearGradient(0, y0, 0, y1); b.addColorStop(0, k.deep); b.addColorStop(1, "transparent")
      g.fillStyle = b; g.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0))
    }
    const { all, countries } = await land(W)
    await breathe(g)
    // The colour block, a hair off the key block: a little up and to the right
    const dx = 3.2 * u, dy = -2.2 * u
    // (twice, a world apart, so the shift leaves no gap at the date line). A second, darker block for every third
    // country, so neighbours read apart in flat colour
    for (const wrapX of [0, -W]) {
      g.save(); g.translate(dx + wrapX, dy)
      g.fillStyle = k.land; g.fill(all)
      g.fillStyle = k.land2
      countries.forEach((x, i) => { if (i % 3 === 0) g.fill(x.path) })
      g.restore()
    }
    await breathe(g)
    // The key block: the outline in ink, a touch heavier on the coast than between countries
    g.strokeStyle = k.key; g.lineJoin = "round"
    g.globalAlpha = 0.5; g.lineWidth = 1.1 * u; for (const x of countries) g.stroke(x.path)
    g.globalAlpha = 1; g.lineWidth = 2.4 * u; g.stroke(all)
    await breathe(g)
    // The wood's grain: long faint streaks across, then the paper's
    g.strokeStyle = night ? "rgba(255,255,255,0.05)" : "rgba(60,40,20,0.06)"
    for (let i = 0; i < 260; i++) {
      const y = rnd() * H, x = rnd() * W, len = (0.05 + rnd() * 0.3) * W
      const a = (rnd() - 0.5) * 6 * u, b = (rnd() - 0.5) * 6 * u
      g.lineWidth = (0.6 + rnd() * 1.6) * u
      around(x + len / 2, len / 2, W, (cx) => { const x0 = cx - len / 2; g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + len / 3, y + a, x0 + (2 * len) / 3, y + b, x0 + len, y); g.stroke() })
    }
    grain(g, night ? 0.08 : 0.12, 3)
    return c
  },
}
