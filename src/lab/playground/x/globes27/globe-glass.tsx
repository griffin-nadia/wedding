/* eslint-disable react-refresh/only-export-components -- a look (or the kit) exports its data beside its component */
import { useParam } from "../../params"
import type { Look } from "../globes24/kit-view"
import { breathe, land, sheet } from "../globes24/kit-paint"

/**
 * Run 27, see-through: a glass globe. The sea is clear glass with only a breath of tint, the land frosted glass with a
 * bright etched outline, and you see the far side of the world through the near one. One still highlight the world
 * turns under (a few lines of shader) and a soft rim of light round the ball. The lines glow. Flat, it's a sheet of
 * glass on the page.
 */
const COL = {
  day: { sea: "rgba(120, 175, 200, 0.16)", frost: "rgba(255, 255, 255, 0.62)", etch: "rgba(30, 105, 135, 0.95)", haze: "rgba(30, 105, 135, 0.2)" },
  night: { sea: "rgba(90, 160, 210, 0.1)", frost: "rgba(205, 235, 255, 0.2)", etch: "rgba(160, 230, 255, 0.95)", haze: "rgba(160, 230, 255, 0.25)" },
}

const css = `
.x-gglass { position: absolute; inset: 0; pointer-events: none; transition: opacity .5s ease; }
.x-gglass[data-flat="true"] { opacity: 0; }
.x-gglass[data-flat="false"] { transition-delay: .9s; }
.x-gglass::before { content: ""; position: absolute; left: 50%; top: 50%; width: 66.4%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, transparent 62%, var(--x-gglass-edge) 100%); box-shadow: 0 10px 30px -12px var(--x-gglass-shadow); }
@media (prefers-reduced-motion: reduce) { .x-gglass { transition: opacity .2s linear; transition-delay: 0s !important; } }
.x-g24-box { --x-gglass-edge: rgb(30 105 135 / .28); --x-gglass-shadow: rgb(30 80 100 / .5); }
[data-theme="lantern"] .x-g24-box { --x-gglass-edge: rgb(160 230 255 / .3); --x-gglass-shadow: rgb(0 0 0 / .8); }
`
/** The glass's edge and its shadow on the page: only as a globe (the ball is 0.414 of the box's height across) */
function Glass() {
  const [view] = useParam("view", "globe")
  return <div className="x-gglass" data-flat={view === "flat"} aria-hidden />
}

export const look: Look = {
  line: "plane",
  icon: "plane",
  seeThrough: 0.7,
  farLines: 0.45,
  rim: 1.2,
  rimColour: (night) => (night ? "rgba(170, 235, 255, 0.85)" : "rgba(30, 105, 135, 0.7)"),
  inks: (night) => (night
    ? { nadia: "#ff9a7a", griffin: "#7ff5e1", guest: "#a9c6ff", you: "#ffd36b", ink: "#cfeeff", paper: "#effaff" }
    : { nadia: "#e0502f", griffin: "#178f8a", guest: "#4d7894", you: "#d8941c", ink: "#16485c", paper: "#ffffff" }),
  glow: (night) => (night
    ? { colour: "rgba(150, 225, 255, 0.5)", blend: "lighter", size: 30, line: 0.4 }
    : { colour: "rgba(40, 150, 180, 0.18)", blend: "source-over", size: 26, line: 0.16 }),
  back: (night) => (night ? "#16222c" : "#dcebf0"),
  glsl: /* glsl */ `
    float lo = vUv.x * 6.2831853 - 3.1415927 - uLon, la = (vUv.y - 0.5) * 3.1415927;
    vec3 sp = vec3(cos(la) * sin(lo), sin(la), cos(la) * cos(lo));
    sp = vec3(sp.x, sp.y * cos(uTilt) - sp.z * sin(uTilt), sp.y * sin(uTilt) + sp.z * cos(uTilt));
    float hl = pow(max(dot(sp, normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 60.0);
    col.rgb = mix(col.rgb, vec3(1.0), hl * 0.8 * vK); col.a = max(col.a, hl * 0.7 * vK);`,
  decor: <Glass />,
  css,
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048
    g.clearRect(0, 0, W, H)
    g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
    await breathe(g)
    const { all } = await land(W)
    // Frosted land, a soft haze off the coast, then the bright etched outline
    g.strokeStyle = k.haze; g.lineJoin = "round"; g.lineWidth = 10 * u; g.stroke(all)
    g.fillStyle = k.frost; g.fill(all)
    await breathe(g)
    g.strokeStyle = k.etch; g.lineWidth = 2.2 * u; g.stroke(all)
    await breathe(g)
    return c
  },
}
