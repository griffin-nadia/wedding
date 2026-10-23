import { GlobeLab, type Look } from "./kit"
import { around, breathe, grain, land, seeded, sheet } from "./kit-paint"

/**
 * Look 2, sashiko (刺し子): an indigo cloth globe. The cloth has a fine weave and the uneven dye of hand-dipped indigo;
 * the land is filled with white running stitches in the hitomezashi way (rows across and down, each row's stitches
 * offset from the last) and its coasts sewn round in a longer stitch. Their lines are red thread with a tiny knot
 * where each starts. Lantern: a deeper indigo, the thread a touch warmer and dimmer.
 */
const look: Look = {
  line: "thread",
  shade: 0.4,
  rim: 1,
  inks: (night) => ({ nadia: "#d8452f", griffin: "#b8323b", guest: night ? "#d9ccb0" : "#efe6d2", you: "#e6b450", ink: night ? "#0d1424" : "#1a2440", paper: "#f4efe4" }),
  back: (night) => (night ? "#121a2e" : "#22345a"),
  paint: async ({ night, width: W }) => {
    const [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(5)
    const cloth = night ? "#121a2e" : "#22345a", thread = night ? "rgba(226, 214, 190, 0.62)" : "rgba(246, 241, 230, 0.82)"
    g.fillStyle = cloth; g.fillRect(0, 0, W, H)
    // The weave: a tiny tile of lighter and darker threads
    const t = document.createElement("canvas"); t.width = t.height = 4
    const x = t.getContext("2d")!
    x.fillStyle = "rgba(255,255,255,0.05)"; x.fillRect(0, 0, 4, 1); x.fillRect(0, 2, 4, 1)
    x.fillStyle = "rgba(0,0,0,0.08)"; x.fillRect(1, 0, 1, 4); x.fillRect(3, 0, 1, 4)
    g.fillStyle = g.createPattern(t, "repeat")!; g.fillRect(0, 0, W, H)
    // Uneven dye: soft lighter and darker clouds
    for (let i = 0; i < 60; i++) {
      const cx = rnd() * W, cy = rnd() * H, r = (0.04 + rnd() * 0.1) * W, tone = rnd() > 0.5 ? "rgba(70, 100, 150, 0.16)" : "rgba(5, 10, 25, 0.2)"
      around(cx, r, W, (x) => {
        const b = g.createRadialGradient(x, cy, 0, x, cy, r); b.addColorStop(0, tone); b.addColorStop(1, "transparent")
        g.fillStyle = b; g.fillRect(x - r, cy - r, r * 2, r * 2)
      })
    }
    const { all } = await land(W)
    await breathe(g)
    // Hitomezashi: running stitches across and down, alternate rows offset by one stitch, only on the land
    const S = 12 * u
    g.save(); g.clip(all)
    g.strokeStyle = thread; g.lineWidth = 1.6 * u; g.lineCap = "round"
    g.setLineDash([S * 0.62, S * 0.38])
    for (let y = S / 2, i = 0; y < H; y += S, i++) { g.lineDashOffset = i % 2 ? S : S * 0.5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); if (i % 12 === 11) await breathe(g) }
    await breathe(g)
    for (let xx = S / 2, i = 0; xx < W; xx += S, i++) { g.lineDashOffset = i % 3 ? 0 : S * 0.5; g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, H); g.stroke(); if (i % 24 === 23) await breathe(g) }
    g.restore()
    await breathe(g)
    // The coasts, sewn round in a longer stitch
    g.setLineDash([7 * u, 4 * u]); g.lineDashOffset = 0
    g.strokeStyle = night ? "rgba(236, 226, 204, 0.85)" : "#f6f1e6"; g.lineWidth = 2.4 * u; g.lineCap = "round"; g.stroke(all)
    g.setLineDash([])
    grain(g, night ? 0.06 : 0.08, 5)
    return c
  },
}

export default function GlobeSashiko() {
  return <GlobeLab look={look} />
}
