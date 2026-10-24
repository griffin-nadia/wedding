import type { Look } from "../globes24/kit-view"
import { breathe, land, seeded, sheet } from "../globes24/kit-paint"

/**
 * Run 26, kintsugi (金継ぎ): the globe as a lacquer bowl mended with gold. Black lacquer seas (run 27: by day too, so
 * it reads apart from hanbok red), vermilion land by day and deep red at night. Every coast is a gold seam, a few gold cracks run across the
 * world as if it had been broken and put back together, and the lacquer has one soft highlight that stays still while
 * the world turns under it (a few lines of shader). Gold-leaf paper planes fly the lines.
 */
const COL = {
  day: { sea: "#14100e", land: "#b2341f", deep: "rgba(0, 0, 0, 0.4)" },
  night: { sea: "#0e0b0a", land: "#3a1410", deep: "rgba(0, 0, 0, 0.45)" },
}

/** A gold seam along a path: a dark bed, the gold, then a thin bright highlight */
function seam(g: CanvasRenderingContext2D, draw: () => void, w: number) {
  g.lineJoin = "round"; g.lineCap = "round"
  g.strokeStyle = "rgba(60, 35, 5, 0.6)"; g.lineWidth = w * 1.6; draw()
  g.strokeStyle = "#c9a24a"; g.lineWidth = w; draw()
  g.strokeStyle = "rgba(255, 240, 190, 0.85)"; g.lineWidth = w * 0.32; draw()
}

export const look: Look = {
  line: "ink",
  icon: "plane",
  shade: 0.45,
  rim: 1.5,
  inks: () => ({ nadia: "#f0c35a", griffin: "#f3e7c4", guest: "#d4b062", you: "#fff1b0", ink: "#1a1412", paper: "#f2d27e" }),
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  // The lacquer's highlight: fixed to the view (top left), worked out from the point's place on the ball
  glsl: /* glsl */ `
    float lo = vUv.x * 6.2831853 - 3.1415927 - uLon, la = (vUv.y - 0.5) * 3.1415927;
    vec3 sp = vec3(cos(la) * sin(lo), sin(la), cos(la) * cos(lo));
    sp = vec3(sp.x, sp.y * cos(uTilt) - sp.z * sin(uTilt), sp.y * sin(uTilt) + sp.z * cos(uTilt));
    float hl = pow(max(dot(sp, normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 36.0);
    col.rgb += vec3(1.0, 0.93, 0.8) * hl * 0.55 * vK;`,
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(17)
    // The lacquer: the sea, deepened at the poles
    g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
    const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, k.deep); v.addColorStop(0.3, "transparent"); v.addColorStop(0.7, "transparent"); v.addColorStop(1, k.deep)
    g.fillStyle = v; g.fillRect(0, 0, W, H)
    await breathe(g)
    const { all } = await land(W)
    g.fillStyle = k.land; g.fill(all)
    await breathe(g)
    // The cracks: jagged lines across the world, each mended in gold
    const cracks: number[][] = []
    for (let i = 0; i < 16; i++) {
      let x = rnd() * W, y = (0.15 + rnd() * 0.7) * H, a = rnd() * Math.PI * 2
      const pts = [x, y]
      for (let s = 0; s < 10 + rnd() * 12; s++) { a += (rnd() - 0.5) * 1.1; x += Math.cos(a) * (14 + rnd() * 30) * u; y += Math.sin(a) * (14 + rnd() * 30) * u; pts.push(x, y) }
      cracks.push(pts)
    }
    seam(g, () => { g.beginPath(); for (const p of cracks) { g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]) } g.stroke() }, 2 * u)
    await breathe(g)
    // Every coast a seam
    seam(g, () => g.stroke(all), 2.6 * u)
    await breathe(g)
    return c
  },
}
