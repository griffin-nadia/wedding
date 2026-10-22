import { GlobeLab, type Look } from "./kit"
import { breathe, grain, land, seeded, sheet } from "./kit-paint"

/**
 * Look 9, origami: a ball folded from washi. The world is cut into facets 15° square, each split corner to corner, and
 * each facet is lit flat from the top left, so it reads as folded paper, not a smooth ball. The facets belong to the
 * paper (they turn with the land), and the crease pattern is printed on the sheet, so flat it's the unfolded sheet
 * with its creases and a faint valley and mountain tint; as it curls the facets take the light, so the toggle folds
 * it up and unfolds it again. Two washi: a pale indigo for the sea, a cream with long kozo fibres for the land, the
 * land a layer cut and laid on top (a hair of shadow under its edge).
 */
const G = [24, 12] // facets across and down: 15° each

const COL = {
  day: { sea: "#a9c0cc", sea2: "#93aebd", land: "#f3eadb", edge: "rgba(40, 55, 70, 0.28)", fibre: "rgba(255, 255, 255, 0.5)", fibreLand: "rgba(160, 120, 80, 0.16)", crease: "rgba(30, 40, 55, 0.2)", lift: "rgba(255, 255, 255, 0.45)" },
  night: { sea: "#1d2a3a", sea2: "#16212e", land: "#5a5246", edge: "rgba(0, 0, 0, 0.45)", fibre: "rgba(190, 210, 230, 0.12)", fibreLand: "rgba(240, 220, 190, 0.14)", crease: "rgba(0, 0, 0, 0.35)", lift: "rgba(255, 240, 220, 0.1)" },
}

// Each facet's light: its centre on the ball (in the paper's own longitude, so it turns with the land), turned to the
// view, lit from the top left. Flat (vK 0) only the creases' faint valley and mountain tint is left.
const glsl = /* glsl */ `
  vec2 og = vec2(${G[0].toFixed(1)}, ${G[1].toFixed(1)});
  vec2 oq = vUv * og, oc = floor(oq), of = fract(oq);
  bool ov = of.x + of.y < 1.0;
  vec2 ocen = (oc + (ov ? vec2(1.0 / 3.0) : vec2(2.0 / 3.0))) / og;
  float olat = (ocen.y - 0.5) * 3.1415927, odl = ocen.x * 6.2831853 - 3.1415927 - uLon;
  vec3 on = vec3(cos(olat) * sin(odl), sin(olat), cos(olat) * cos(odl));
  on = vec3(on.x, on.y * cos(uTilt) - on.z * sin(uTilt), on.y * sin(uTilt) + on.z * cos(uTilt));
  float olit = 0.46 + 0.72 * max(dot(on, normalize(vec3(-0.55, 0.6, 0.58))), 0.0);
  // Each facet a hair different, as hand-folded paper never sits quite flat
  olit *= 0.95 + 0.1 * fract(sin(dot(oc + (ov ? 0.5 : 0.0), vec2(12.9898, 78.233))) * 43758.5453);
  col.rgb *= mix(ov ? 0.965 : 1.0, olit, vK);
`

const look: Look = {
  line: "plane",
  segments: [48, 24],
  rim: 0.8,
  glsl,
  inks: (night) => ({ guest: night ? "#d8cdb8" : "#4f5a66", ink: night ? "#e9dfcc" : "#2b3440", paper: night ? "#efe6d6" : "#fbf7ef" }),
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(23)
    // The sea's washi: a soft wash, then long fibres
    const wash = g.createLinearGradient(0, 0, 0, H); wash.addColorStop(0, k.sea2); wash.addColorStop(0.5, k.sea); wash.addColorStop(1, k.sea2)
    g.fillStyle = wash; g.fillRect(0, 0, W, H)
    const fibres = (n: number, colour: string) => {
      g.strokeStyle = colour; g.lineWidth = 0.9 * u; g.beginPath()
      for (let i = 0; i < n; i++) {
        const x = rnd() * W, y = rnd() * H, a = rnd() * Math.PI * 2, len = (12 + rnd() * 40) * u, bend = (rnd() - 0.5) * 18 * u
        g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 - Math.sin(a) * bend, y + Math.sin(a) * len * 0.5 + Math.cos(a) * bend, x + Math.cos(a) * len, y + Math.sin(a) * len)
      }
      g.stroke()
    }
    fibres(450, k.fibre)
    await breathe(g)
    fibres(450, k.fibre)
    await breathe(g)
    const { all } = await land(W)
    await breathe(g)
    // The land: a second sheet cut and laid on, a hair of shadow under its edge
    g.save(); g.translate(1.6 * u, 2.4 * u); g.fillStyle = k.edge; g.fill(all); g.restore()
    await breathe(g)
    g.fillStyle = k.land; g.fill(all)
    await breathe(g)
    for (let i = 0; i < 2; i++) { g.save(); g.clip(all); fibres(700, k.fibreLand); g.restore(); await breathe(g) }
    await breathe(g)
    // The crease pattern: the facets' edges, each a fine dark line with a light one beside it (a pressed fold)
    const cw = W / G[0], ch = H / G[1]
    const creases = (colour: string, off: number) => {
      g.strokeStyle = colour; g.lineWidth = 1 * u; g.beginPath()
      for (let i = 0; i <= G[0]; i++) { g.moveTo(i * cw + off, 0); g.lineTo(i * cw + off, H) }
      for (let j = 1; j < G[1]; j++) { g.moveTo(0, j * ch + off); g.lineTo(W, j * ch + off) }
      // Corner to corner, top left to bottom right, as the facets split
      for (let i = 0; i < G[0]; i++) for (let j = 0; j < G[1]; j++) { g.moveTo(i * cw + off, j * ch); g.lineTo((i + 1) * cw + off, (j + 1) * ch) }
      g.stroke()
    }
    creases(k.lift, 1.2 * u)
    await breathe(g)
    creases(k.crease, 0)
    await breathe(g)
    grain(g, night ? 0.06 : 0.08, 23)
    return c
  },
}

export default function GlobeOrigami() {
  return <GlobeLab look={look} />
}
