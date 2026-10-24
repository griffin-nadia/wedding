import { GlobeLab, type Look } from "../globes24/kit"
import { breathe, grain, land, sheet } from "../globes24/kit-paint"

/**
 * Run 26, risograph: printed in two inks on a cheap duplicator. Light: fluoro pink and blue on off-white; Lantern:
 * fluoro pink and yellow on near-black. The sea is the second ink in fine lines, the land the pink in a halftone dot
 * screen printed a few pixels off its blue outline (misregistration), and where they cross they overprint. Heavy riso
 * speckle over all. A flock of three paper planes flies each line.
 */
const INKS = {
  day: { paper: "#f3eee2", a: "#ff48b0", b: "#0078bf", mix: "multiply" as GlobalCompositeOperation },
  night: { paper: "#1b1a22", a: "#ff48b0", b: "#ffe14d", mix: "screen" as GlobalCompositeOperation },
}

/** A small tile, repeated: dots for the halftone or lines for the sea */
function tile(size: number, draw: (x: CanvasRenderingContext2D, s: number) => void) {
  const t = document.createElement("canvas"); t.width = t.height = Math.max(2, Math.round(size))
  draw(t.getContext("2d")!, t.width); return t
}

const look: Look = {
  line: "dots",
  icon: "flock",
  shade: 0.15,
  rim: 1.5,
  inks: (night) => (night
    ? { nadia: "#ff6cc2", griffin: "#ffe14d", guest: "#d8d2e6", you: "#ff8a3d", ink: "#0f0e14", paper: "#fff6e8" }
    : { nadia: "#e0218a", griffin: "#0078bf", guest: "#3b3550", you: "#ff6c2f", ink: "#1f1d2a", paper: "#fffaf0" }),
  back: (night) => (night ? INKS.night.paper : INKS.day.paper),
  paint: async ({ night, width: W }) => {
    const k = night ? INKS.night : INKS.day, [c, g] = sheet(W), H = W / 2, u = W / 2048
    g.fillStyle = k.paper; g.fillRect(0, 0, W, H)
    const { all } = await land(W)
    await breathe(g)
    // The second ink: the sea in fine lines, everywhere (the land's dots overprint it)
    const S = Math.max(5, 7 * u)
    const lines = tile(S, (x, s) => { x.fillStyle = k.b; x.globalAlpha = 0.55; x.fillRect(0, 0, s, Math.max(1, s * 0.34)) })
    g.save(); g.globalCompositeOperation = k.mix; g.fillStyle = g.createPattern(lines, "repeat")!; g.fillRect(0, 0, W, H); g.restore()
    await breathe(g)
    // The pink: the land as a halftone screen, solid near the coast, printed a few pixels off
    const D = Math.max(8, 12 * u)
    const dots = tile(D, (x, s) => { x.fillStyle = k.a; x.beginPath(); x.arc(s / 2, s / 2, s * 0.38, 0, Math.PI * 2); x.fill() })
    g.save(); g.translate(5 * u, -3 * u); g.clip(all)
    g.globalCompositeOperation = k.mix; g.fillStyle = g.createPattern(dots, "repeat")!; g.fillRect(-10, -10, W + 20, H + 20)
    g.lineWidth = 14 * u; g.lineJoin = "round"; g.strokeStyle = k.a; g.globalAlpha = 0.9; g.stroke(all)
    g.restore()
    await breathe(g)
    // The coast in the second ink, on register
    g.save(); g.globalCompositeOperation = k.mix; g.strokeStyle = k.b; g.lineWidth = 2.2 * u; g.lineJoin = "round"; g.stroke(all); g.restore()
    await breathe(g)
    // Riso speckle, heavier than the other looks' grain
    grain(g, night ? 0.16 : 0.2, 61)
    return c
  },
}

export default function GlobeRiso() {
  return <GlobeLab look={look} />
}
