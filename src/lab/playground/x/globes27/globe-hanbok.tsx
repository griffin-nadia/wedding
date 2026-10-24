import type { Look } from "../globes24/kit-view"
import { around, breathe, grain, land, sheet } from "../globes24/kit-paint"

/**
 * Run 27, hanbok red: the world as a hanbok's silk. The sea is deep red silk with a gold-leaf print of small flowers
 * (geumbak), the land ink black edged in a fine gold line, and both poles wear saekdong, the rainbow-striped sleeve
 * (on the globe, striped caps). Gold lines, gold paper planes. Lantern: the silk deepens to oxblood.
 */
const COL = {
  day: { sea: "#9b1426", deep: "#6e0c1a", land: "#151012", gold: "#d9b25a", leaf: "rgba(226, 186, 92, 0.5)" },
  night: { sea: "#5a0a16", deep: "#33050c", land: "#0b0809", gold: "#c9a24a", leaf: "rgba(214, 170, 80, 0.38)" },
}
/** Saekdong, from the pole out: the sleeve's stripes */
const STRIPES = ["#c8312b", "#f2c53d", "#2f8a4c", "#2e5aa8", "#f6efe2", "#d9548a", "#3d2a6b"]

/** A small gold-leaf flower: four round petals and a dot */
function flower(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + Math.PI / 4; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.72, 0, Math.PI * 2); g.fill() }
}

export const look: Look = {
  line: "ink",
  icon: "plane",
  shade: 0.4,
  rim: 1.5,
  rimColour: () => "#d9b25a",
  inks: () => ({ nadia: "#f4c95d", griffin: "#f6e6b4", guest: "#d6ac55", you: "#fff3c4", ink: "#2a0a0e", paper: "#f6dc8c" }),
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048
    // The silk: red, deeper towards the poles, with a faint sheen across the weave
    const s = g.createLinearGradient(0, 0, 0, H); s.addColorStop(0, k.deep); s.addColorStop(0.5, k.sea); s.addColorStop(1, k.deep)
    g.fillStyle = s; g.fillRect(0, 0, W, H)
    g.fillStyle = "rgba(255, 255, 255, 0.025)"
    for (let y = 0; y < H; y += 3 * u) g.fillRect(0, y, W, 1 * u)
    await breathe(g)
    // The gold-leaf print, on a half-drop grid that tiles across the date line
    g.fillStyle = k.leaf
    const step = 64 * u
    for (let row = 0, y = step / 2; y < H; y += step, row++) for (let x = (row % 2) * step / 2; x < W; x += step) around(x, 8 * u, W, (cx) => flower(g, cx, y, 5 * u))
    await breathe(g)
    // Saekdong round both poles
    const band = (y0: number, dir: 1 | -1) => {
      const sw = 9 * u
      STRIPES.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, dir > 0 ? y0 + i * sw : y0 - (i + 1) * sw, W, sw) })
    }
    band(0, 1); band(H, -1)
    g.fillStyle = k.gold; g.fillRect(0, 7 * 9 * u, W, 2 * u); g.fillRect(0, H - 7 * 9 * u - 2 * u, W, 2 * u)
    await breathe(g)
    // The land in ink black, edged in fine gold
    const { all } = await land(W)
    g.fillStyle = k.land; g.fill(all)
    g.strokeStyle = k.gold; g.lineWidth = 1.8 * u; g.lineJoin = "round"; g.stroke(all)
    await breathe(g)
    grain(g, 0.05, 41)
    return c
  },
}
