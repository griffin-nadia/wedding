import type { Look } from "../globes24/kit-view"
import { breathe, land, sheet } from "../globes24/kit-paint"

/**
 * Run 27, video game: a world from an old console. The sea is big square pixels in two blues with pixel wave crests,
 * the land flat green cut into low-poly facets (each lit flat, a few lines of shader, the land only), the ball itself
 * a low-poly shape (10° steps), its coasts a dark sprite outline. Chunky square-ended lines, and a pixel plane flies
 * each one, turning in eighths. Lantern: the night level, a navy sea with pixel stars.
 */
const COL = {
  day: { sea: "#2f6fd0", sea2: "#2a63bd", crest: "#7fb6ff", land: "#5fbf4a", outline: "#163b1a", ice: "#e8f3ff" },
  night: { sea: "#121a44", sea2: "#0f163a", crest: "#3d55a8", land: "#2f7a3e", outline: "#07140a", ice: "#9fb3d9" },
}
/** Pixels across the whole world: big enough to read as pixels on a phone */
const PX = 160

// The land's facets: 10° triangles, lit flat from the top left on the ball, with a two-tone hint flat; land only (uMask)
const glsl = /* glsl */ `
  float vm = texture2D(uMask, vUv).r;
  vec2 vg = vec2(36.0, 18.0), vq = vUv * vg, vc = floor(vq), vf = fract(vq);
  bool vv = vf.x + vf.y < 1.0;
  vec2 vcen = (vc + (vv ? vec2(1.0 / 3.0) : vec2(2.0 / 3.0))) / vg;
  float vla = (vcen.y - 0.5) * 3.1415927, vdl = vcen.x * 6.2831853 - 3.1415927 - uLon;
  vec3 vn = vec3(cos(vla) * sin(vdl), sin(vla), cos(vla) * cos(vdl));
  vn = vec3(vn.x, vn.y * cos(uTilt) - vn.z * sin(uTilt), vn.y * sin(uTilt) + vn.z * cos(uTilt));
  float vlit = 0.62 + 0.55 * max(dot(vn, normalize(vec3(-0.55, 0.6, 0.58))), 0.0);
  vlit *= 0.92 + 0.16 * fract(sin(dot(vc + (vv ? 0.5 : 0.0), vec2(12.9898, 78.233))) * 43758.5453);
  col.rgb *= mix(1.0, mix(vv ? 0.9 : 1.04, vlit, vK), step(0.5, vm));
`

export const look: Look = {
  line: "pixel",
  icon: "pixel",
  weight: 1.25,
  segments: [36, 18],
  nearest: true,
  rim: 2,
  glsl,
  inks: (night) => ({ nadia: "#ff4f6e", griffin: "#ffffff", guest: night ? "#9fc4ff" : "#d6e8ff", you: "#ffc23a", ink: "#10142a", paper: "#ffffff" }),
  rimColour: () => "#10142a",
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, H = W / 2
    // The sea at PX × PX/2, one square per pixel, then blown up without smoothing
    const [s, sg] = sheet(PX), h = PX / 2
    sg.fillStyle = k.sea; sg.fillRect(0, 0, PX, h)
    for (let y = 0; y < h; y++) for (let x = 0; x < PX; x++) {
      if ((x + y * 3) % 7 === 0) { sg.fillStyle = k.sea2; sg.fillRect(x, y, 1, 1) }
      // Wave crests: little two-pixel dashes in rows, shifted every row
      if (y % 4 === 1 && (x + y * 5) % 11 < 2) { sg.fillStyle = k.crest; sg.fillRect(x, y, 1, 1) }
      if (night && (x * 7 + y * 13) % 97 === 0) { sg.fillStyle = "#ffe9a8"; sg.fillRect(x, y, 1, 1) }
    }
    // The ice caps, as pixels too
    sg.fillStyle = k.ice; sg.fillRect(0, 0, PX, 3); sg.fillRect(0, h - 5, PX, 5)
    const [c, g] = sheet(W)
    g.imageSmoothingEnabled = false
    g.drawImage(s, 0, 0, W, H)
    await breathe(g)
    // The land: flat green with a dark sprite outline (its facets come from the shader)
    const { all } = await land(W)
    const u = W / 2048
    g.lineJoin = "miter"; g.strokeStyle = k.outline; g.lineWidth = 6 * u; g.stroke(all)
    g.fillStyle = k.land; g.fill(all)
    await breathe(g)
    return c
  },
}
