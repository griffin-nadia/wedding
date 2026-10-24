import type { Look } from "../globes24/kit-view"
import { breathe, land, seeded, sheet } from "../globes24/kit-paint"

/**
 * Run 27, black and white: ink on paper, nothing else. The sea is engraved, close black lines across white paper
 * (a grey at a glance), thickening off the coasts, and the land is the bare paper cut out of it with a bold coast. Every line is
 * black ink; only the household's own line has a colour, the site's gold. Lantern: the print in reverse, white engraving on
 * black, the land solid black.
 */
const COL = {
  day: { paper: "#fbfaf6", ink: "#111111", hatch: "rgba(17, 17, 17, 0.62)", land: "#fbfaf6" },
  night: { paper: "#0f0f0f", ink: "#f2f0ea", hatch: "rgba(242, 240, 234, 0.42)", land: "#000000" },
}

export const look: Look = {
  line: "ink",
  icon: "plane",
  shade: 0.2,
  weight: 1.25,
  rim: 1.6,
  inks: (night) => (night
    ? { nadia: "#ffffff", griffin: "#cfcfcf", guest: "#9a9a9a", you: "#e2ab3e", ink: "#000000", paper: "#ffffff" }
    : { nadia: "#000000", griffin: "#3c3c3c", guest: "#6e6e6e", you: "#d39a22", ink: "#000000", paper: "#ffffff" }),
  rimColour: (night) => (night ? "#f2f0ea" : "#111111"),
  back: (night) => (night ? COL.night.paper : COL.day.paper),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(5)
    g.fillStyle = k.paper; g.fillRect(0, 0, W, H)
    // The engraving: fine lines across the sea, a hair wavy
    g.strokeStyle = k.hatch; g.lineWidth = 2 * u; g.beginPath()
    for (let y = 0; y < H; y += 4.5 * u) { g.moveTo(0, y); for (let x = 0; x <= W; x += 32 * u) g.lineTo(x, y + Math.sin(x / (90 * u) + y) * 0.8 * u) }
    g.stroke()
    await breathe(g)
    const { all } = await land(W)
    // Water-lining off the coasts, heavier near the land
    g.strokeStyle = k.ink; g.lineJoin = "round"
    for (const [lw, a] of [[22, 0.1], [12, 0.18]] as const) { g.globalAlpha = a; g.lineWidth = lw * u; g.stroke(all) }
    g.globalAlpha = 1
    await breathe(g)
    // The land: bare paper, cut out of the sea, with a bold coast
    g.fillStyle = k.land; g.fill(all)
    g.lineWidth = 3 * u; g.stroke(all)
    await breathe(g)
    // A few ink specks on the paper, as a print has
    g.fillStyle = k.ink
    for (let i = 0; i < 160; i++) { g.globalAlpha = 0.15 + rnd() * 0.3; g.beginPath(); g.arc(rnd() * W, rnd() * H, (0.6 + rnd() * 1.4) * u, 0, Math.PI * 2); g.fill() }
    g.globalAlpha = 1
    return c
  },
}
