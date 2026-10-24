import type { Look } from "./kit-view"
import { around, breathe, land, seeded, sheet } from "./kit-paint"

/**
 * Look 8, ink line, in the spirit of Nadia's venue map: no fills, only hand-drawn outlines on cream paper. The paper
 * has her map's diagonal crayon scumble; every coast is drawn twice in a soft brown pen, each pass a hair off the
 * other as a hand would, with a pale blue water line just off the coast like her river; borders are a lighter, finer
 * line in her road green, and a few little pen waves sit out at sea. Lantern (run 27): the same pen on the
 * paper dimmed to dusk, so it stays a drawing on paper and reads apart from the dark looks.
 */
const COL = {
  day: { paper: "#f1f0e2", scumble: "rgba(255, 255, 248, 0.55)", scumble2: "rgba(140, 140, 115, 0.06)", pen: "#3d2f26", border: "rgba(120, 130, 105, 0.7)", water: "rgba(80, 190, 215, 0.55)", wave: "rgba(61, 47, 38, 0.45)" },
  night: { paper: "#c9bc9f", scumble: "rgba(240, 230, 205, 0.3)", scumble2: "rgba(60, 50, 35, 0.08)", pen: "#2e241c", border: "rgba(90, 100, 75, 0.7)", water: "rgba(50, 130, 160, 0.55)", wave: "rgba(46, 36, 28, 0.4)" },
}

export const look: Look = {
  line: "ink",
  shade: 0.2,
  rim: 1.4,
  inks: (night) => ({ guest: "#5c4636", ink: night ? "#2e241c" : "#3d2f26", ...(night ? { nadia: "#a84f32", griffin: "#5b6b3a", you: "#b8801c" } : {}) }),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(53)
    g.fillStyle = k.paper; g.fillRect(0, 0, W, H)
    // The crayon scumble: short diagonal strokes laid in loose patches, as on her map's paper
    g.lineCap = "round"
    for (let p = 0; p < 6; p++) {
      g.beginPath()
      for (let i = 0; i < 700; i++) {
        const x = rnd() * W, y = rnd() * H, len = (20 + rnd() * 60) * u
        g.moveTo(x, y); g.lineTo(x + len * 0.8, y - len * 0.6)
      }
      g.strokeStyle = p % 3 === 1 ? k.scumble2 : k.scumble; g.lineWidth = (2 + (p % 3) * 2) * u; g.stroke()
      await breathe(g)
    }
    const { all, countries } = await land(W)
    await breathe(g)
    g.lineJoin = "round"; g.lineCap = "round"
    // Her river blue, as a water line just off every coast (a wide pale stroke, clipped to the sea)
    g.save()
    const sea = new Path2D(); sea.rect(0, 0, W, H); sea.addPath(all); g.clip(sea, "evenodd")
    g.strokeStyle = k.water; g.lineWidth = 7 * u; g.stroke(all)
    g.restore()
    await breathe(g)
    // Borders: a fine line in her road green, each country nudged a little, as drawn freehand
    g.strokeStyle = k.border; g.lineWidth = 1 * u
    for (const [i, x] of countries.entries()) {
      g.save(); g.translate((rnd() - 0.5) * 1.6 * u, (rnd() - 0.5) * 1.6 * u); g.stroke(x.path); g.restore()
      if (i % 60 === 59) await breathe(g)
    }
    await breathe(g)
    // The coast in pen, twice, each pass a hair off the other and a touch different in weight
    for (const [dx, dy, lw, a] of [[0.6, -0.4, 1.8, 0.95], [-0.7, 0.6, 1.1, 0.6]]) {
      g.save(); g.translate(dx * u, dy * u); g.globalAlpha = a; g.strokeStyle = k.pen; g.lineWidth = lw * u; g.stroke(all); g.restore()
      await breathe(g)
    }
    // A few little pen waves out at sea, kept away from the land
    g.strokeStyle = k.wave; g.lineWidth = 1.4 * u
    const spots: [number, number][] = [[-150, 20], [-130, -15], [-160, -35], [170, 10], [160, -25], [-110, 5], [75, -15], [90, -35], [60, -45], [-30, 25], [-20, -20], [-40, -40], [130, -50], [-90, -55], [20, -55], [-175, 40]]
    for (const [lon, lat] of spots) {
      const x0 = ((lon + 180) / 360) * W, y0 = ((90 - lat) / 180) * H, s = (9 + rnd() * 5) * u
      around(x0, s * 3, W, (x) => {
        for (const row of [0, 1]) {
          const ox = x - s * 1.5 + row * s * 0.9, oy = y0 + row * s * 0.9
          g.beginPath(); g.moveTo(ox, oy)
          g.quadraticCurveTo(ox + s * 0.5, oy - s * 0.6, ox + s, oy); g.quadraticCurveTo(ox + s * 1.5, oy + s * 0.6, ox + s * 2, oy)
          g.stroke()
        }
      })
    }
    return c
  },
}
