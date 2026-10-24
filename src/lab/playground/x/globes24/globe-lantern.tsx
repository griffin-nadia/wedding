import type { Look } from "./kit-view"
import { around, breathe, grain, land, seeded, sheet } from "./kit-paint"

/**
 * Look 6, Lantern night (made for the Lantern theme first): the world at night, a deep indigo sea and the land a
 * shade lighter, its coasts caught in a little moonlight. Warm lantern glows sit under Kyoto, Brisbane, Victoria and
 * every guest's city, and their lines are strings of tiny lanterns: the dotted arc with a soft glow round every lamp.
 * All of it still (no flicker, no shimmer). In the light theme it's dusk (run 27, so it reads apart from the pale
 * looks): a blue evening sea, paper land, the lanterns just lit.
 */
const COL = {
  night: { top: "#0b1222", sea: "#111a30", bottom: "#0a0f1c", land: "#252a45", coast: "rgba(214, 196, 160, 0.45)", haze: "rgba(255, 190, 110, 0.05)" },
  day: { top: "#3f4f86", sea: "#54679c", bottom: "#46578c", land: "#e9dcbf", coast: "rgba(255, 214, 150, 0.6)", haze: "rgba(255, 190, 110, 0.06)" },
}

export const look: Look = {
  line: "dots",
  shade: 0.45,
  rim: 1,
  inks: (night) => night
    ? { nadia: "#ff9a6b", griffin: "#ffd27a", guest: "#f7c98c", you: "#fff0b0", ink: "#f4e6c8", paper: "#2a2438" }
    : { nadia: "#ff8a5c", griffin: "#ffd27a", guest: "#ffe2b8", you: "#fff0b0", ink: "#2a2438", paper: "#fff6e0" },
  glow: (night) => night
    ? { colour: "rgba(255, 176, 92, 0.55)", blend: "lighter", size: 44, line: 0.22 }
    : { colour: "rgba(255, 176, 92, 0.45)", blend: "lighter", size: 40, line: 0.18 },
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(29)
    // The sea: deeper towards the poles
    const s = g.createLinearGradient(0, 0, 0, H)
    s.addColorStop(0, k.top); s.addColorStop(0.5, k.sea); s.addColorStop(1, k.bottom)
    g.fillStyle = s; g.fillRect(0, 0, W, H)
    // A faint haze of warmth over the sea, uneven, like light off far-off towns
    for (let i = 0; i < 40; i++) {
      const cx = rnd() * W, cy = H * (0.2 + rnd() * 0.6), r = (0.05 + rnd() * 0.12) * W
      around(cx, r, W, (x) => {
        const b = g.createRadialGradient(x, cy, 0, x, cy, r); b.addColorStop(0, k.haze); b.addColorStop(1, "transparent")
        g.fillStyle = b; g.fillRect(x - r, cy - r, r * 2, r * 2)
      })
    }
    const { all } = await land(W)
    await breathe(g)
    // The land, a shade off the sea, and moonlight along the coast: a soft wide edge and a fine bright one
    g.fillStyle = k.land; g.fill(all)
    g.save(); g.clip(all); g.strokeStyle = k.coast; g.globalAlpha = 0.25; g.lineWidth = 7 * u; g.stroke(all); g.restore()
    await breathe(g)
    g.strokeStyle = k.coast; g.lineWidth = 1.1 * u; g.lineJoin = "round"; g.stroke(all)
    await breathe(g)
    // Night only: a few faint stars of light scattered over the land (towns), still, never twinkling
    if (night) {
      g.save(); g.clip(all); g.fillStyle = "rgba(255, 205, 140, 0.5)"; g.beginPath()
      for (let i = 0; i < 900; i++) { const x = rnd() * W, y = H * (0.12 + rnd() * 0.6), r = (0.5 + rnd()) * u; g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2) }
      g.fill(); g.restore()
      await breathe(g)
    }
    grain(g, night ? 0.05 : 0.08, 29)
    return c
  },
}
