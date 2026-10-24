import type { Look } from "../globes24/kit-view"
import { breathe, grain, land, seeded, sheet } from "../globes24/kit-paint"

/**
 * Run 26, chiyogami (千代紙) collage: every country cut from a different patterned paper (ichimatsu checks, seigaiha
 * waves, mizutama dots, stripes and a hemp-leaf lattice) and pasted on plain kozo washi with its fibres showing,
 * each piece lifting a little off the sheet with a soft shadow and a pale cut edge. Lantern dims the papers. A paper
 * crane flies each line (the plane and the flock are on the Travelling icon).
 */
type Pal = { sea: string; fibre: string; shadow: string; edge: string; p: [string, string][] }
const PAL: Record<"day" | "night", Pal> = {
  day: { sea: "#ece4d2", fibre: "rgba(120, 95, 60, 0.14)", shadow: "rgba(50, 30, 15, 0.45)", edge: "rgba(255, 252, 244, 0.9)",
    p: [["#c8473b", "#f3e3c8"], ["#2f4f7a", "#e9dfc9"], ["#e58fa0", "#fbeee6"], ["#c9a13a", "#f6ecd2"], ["#4f7d5c", "#efe8d2"]] },
  night: { sea: "#3a2a1c", fibre: "rgba(220, 210, 190, 0.08)", shadow: "rgba(0, 0, 0, 0.6)", edge: "rgba(230, 220, 200, 0.35)",
    p: [["#8d3029", "#3a3128"], ["#3d5d8e", "#262b38"], ["#a35f6d", "#3a2e33"], ["#9a7a2a", "#352f22"], ["#3e6a4a", "#28302a"]] },
}

/** The five papers, as tiles T across */
function papers(T: number, pal: Pal) {
  const make = (draw: (x: CanvasRenderingContext2D, a: string, b: string) => void, i: number) => {
    const t = document.createElement("canvas"); t.width = t.height = T
    const x = t.getContext("2d")!, [a, b] = pal.p[i]
    x.fillStyle = b; x.fillRect(0, 0, T, T); x.fillStyle = a; x.strokeStyle = a; draw(x, a, b); return t
  }
  return [
    make((x) => { x.fillRect(0, 0, T / 2, T / 2); x.fillRect(T / 2, T / 2, T / 2, T / 2) }, 0), // ichimatsu
    make((x) => { x.lineWidth = T * 0.07; for (const [cx, cy] of [[0, T], [T, T], [T / 2, T / 2], [0, 0], [T, 0]]) for (const r of [0.45, 0.3, 0.15]) { x.beginPath(); x.arc(cx, cy, T * r, Math.PI, 0); x.stroke() } }, 1), // seigaiha
    make((x) => { for (const [cx, cy] of [[T / 4, T / 4], [(3 * T) / 4, (3 * T) / 4]]) { x.beginPath(); x.arc(cx, cy, T * 0.14, 0, Math.PI * 2); x.fill() } }, 2), // mizutama
    make((x) => { x.fillRect(0, 0, T, T * 0.22); x.fillRect(0, T * 0.5, T, T * 0.08) }, 3), // shima
    make((x) => { x.lineWidth = T * 0.05; x.beginPath(); x.moveTo(0, 0); x.lineTo(T, T); x.moveTo(T, 0); x.lineTo(0, T); x.moveTo(T / 2, 0); x.lineTo(T / 2, T); x.moveTo(0, T / 2); x.lineTo(T, T / 2); x.stroke() }, 4), // asanoha, simplified
  ]
}

export const look: Look = {
  line: "thread",
  icon: "crane",
  shade: 0.25,
  rim: 1,
  inks: (night) => (night
    ? { nadia: "#e0574a", griffin: "#8fc49c", guest: "#e6dcc8", you: "#e6b450", ink: "#12151c", paper: "#f4ecdc" }
    : { nadia: "#b3302a", griffin: "#2f5d50", guest: "#3a2c22", you: "#d59a2a", ink: "#2a1d14", paper: "#fffaf0" }),
  back: (night) => PAL[night ? "night" : "day"].sea,
  paint: async ({ night, width: W }) => {
    const k = PAL[night ? "night" : "day"], [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(29)
    // Kozo washi: the sheet with long fibres in it
    g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
    g.strokeStyle = k.fibre; g.lineCap = "round"
    for (const lw of [0.8, 1.4]) {
      g.lineWidth = lw * u; g.beginPath()
      for (let i = 0; i < 900; i++) { const x = rnd() * W, y = rnd() * H, l = (12 + rnd() * 40) * u, a = rnd() * Math.PI; g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 4 * u, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l) }
      g.stroke()
    }
    await breathe(g)
    const { all, countries } = await land(W)
    // The shadow under the pasted pieces: drawn small and scaled up, so it blurs for free
    const SW = Math.round(W / 8), sc = document.createElement("canvas"); sc.width = SW; sc.height = SW / 2
    const sg = sc.getContext("2d")!
    sg.setTransform(1 / 8, 0, 0, 1 / 8, (6 * u) / 8, (8 * u) / 8); sg.fillStyle = k.shadow; sg.fill(all)
    g.save(); g.globalAlpha = 0.7; g.imageSmoothingQuality = "high"; g.drawImage(sc, 0, 0, W, H); g.restore()
    await breathe(g)
    // Each country cut from one of the five papers (a pattern turned a little per piece)
    const tiles = papers(Math.round(22 * u), k)
    countries.forEach((x, i) => {
      const p = g.createPattern(tiles[(i * 7) % 5], "repeat")!
      p.setTransform(new DOMMatrix().rotate(((i * 37) % 40) - 20))
      g.fillStyle = p; g.fill(x.path)
    })
    await breathe(g)
    g.strokeStyle = k.edge; g.lineWidth = 1.4 * u; g.lineJoin = "round"; g.stroke(all)
    await breathe(g)
    grain(g, night ? 0.07 : 0.1, 29)
    return c
  },
}
