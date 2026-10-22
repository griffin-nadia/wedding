import type { CSSProperties } from "react"
import { useParam } from "../../params"
import { GlobeLab, type Look } from "./kit"
import { around, breathe, grain, land, latY, seeded, sheet } from "./kit-paint"

/**
 * Look 10, the snow globe (extreme, for fun): a little snowy world inside a glass dome on a lacquer base, turned so
 * Kyoto rides near the top, with maple leaves drifting down inside the glass instead of snow. The glass has one soft
 * reflection that stays still (no sweep, no shimmer). The leaves are a plain maple silhouette (Nadia's maple leaf art
 * isn't available yet), few and slow, all transform and opacity; under reduced motion they rest where they are. The
 * dome and its leaves are only there as a globe: flat, it's the painted sheet on its own.
 */
const COL = {
  day: { sea: "#2f6f8f", deep: "#1f4f6c", land: "#f2ede1", shadow: "rgba(70, 110, 150, 0.22)", coast: "#ffffff", green: "rgba(120, 150, 100, 0.28)" },
  night: { sea: "#163449", deep: "#0c2131", land: "#c9c3b4", shadow: "rgba(10, 30, 60, 0.35)", coast: "#e8e2d4", green: "rgba(90, 120, 80, 0.3)" },
}

// The box is 5:4 and the globe's radius is 0.414 of its height (kit-geo.ts), so in a 125 × 100 box it sits at 62.5, 50
const D = 46 // the glass, a little wider than the ball (radius 41.4)
const LEAF = "M0 -11L2 -6L5 -7.5L4 -3L9.5 -5L8 -2L11 -.5L6 3L7 5L2 4L.6 6L.6 11L-.6 11L-.6 6L-2 4L-7 5L-6 3L-11 -.5L-8 -2L-9.5 -5L-4 -3L-5 -7.5L-2 -6Z"
// Few and slow: where each falls (% of the dome), its size, colour, how long a fall takes and where in it it starts
const LEAVES = [
  { x: 22, s: 1, c: 0, t: 19, d: -2, rest: 70 }, { x: 70, s: 0.8, c: 1, t: 23, d: -9, rest: 40 }, { x: 45, s: 1.15, c: 2, t: 21, d: -15, rest: 58 },
  { x: 84, s: 0.7, c: 3, t: 26, d: -5, rest: 26 }, { x: 33, s: 0.75, c: 1, t: 24, d: -19, rest: 34 }, { x: 58, s: 0.9, c: 0, t: 28, d: -12, rest: 80 },
]
const MAPLE = ["#c8452c", "#d9682f", "#b5352a", "#e08a3c"]

const css = `
.x-gsn { position: absolute; inset: 0; pointer-events: none; transition: opacity .5s ease; }
.x-gsn[data-flat="true"] { opacity: 0; }
.x-gsn[data-flat="false"] { transition-delay: .9s; }
.x-gsn svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.x-gsn-snow { position: absolute; left: ${((62.5 - D) / 125) * 100}%; top: ${((50 - D) / 100) * 100}%; width: ${((2 * D) / 125) * 100}%; height: ${((2 * D) / 100) * 100}%; border-radius: 50%; overflow: hidden; }
.x-gsn-leaf { position: absolute; top: 0; width: 7%; aspect-ratio: 1; margin-left: -3.5%; opacity: 0; animation: x-gsn-fall var(--t) linear var(--d) infinite; will-change: transform, opacity; }
.x-gsn-leaf > svg { position: static; display: block; width: 100%; height: 100%; animation: x-gsn-sway calc(var(--t) / 3) ease-in-out var(--d) infinite alternate; }
@keyframes x-gsn-fall { 0% { transform: translateY(-10cqh); opacity: 0 } 12% { opacity: .95 } 85% { opacity: .95 } 100% { transform: translateY(105cqh); opacity: 0 } }
@keyframes x-gsn-sway { from { transform: translateX(-60%) rotate(-35deg) } to { transform: translateX(60%) rotate(30deg) } }
.x-gsn-snow { container-type: size; }
@media (prefers-reduced-motion: reduce) {
  .x-gsn-leaf, .x-gsn-leaf > svg { animation: none; }
  .x-gsn-leaf { opacity: .9; transform: translateY(var(--rest)); }
  .x-gsn-leaf > svg { transform: rotate(var(--turn)); }
}
`

/** The glass, its base and the leaves inside, drawn over the map (decoration only) */
function Dome() {
  const [view] = useParam("view", "globe")
  return (
    <div className="x-gsn" data-flat={view === "flat"} aria-hidden>
      <div className="x-gsn-snow">
        {LEAVES.map((l, i) => (
          <span key={i} className="x-gsn-leaf" style={{ left: `${l.x}%`, scale: String(l.s), "--t": `${l.t}s`, "--d": `${l.d}s`, "--rest": `${l.rest}cqh`, "--turn": `${i * 47 - 60}deg` } as CSSProperties}>
            <svg viewBox="-12 -12 24 24"><path d={LEAF} fill={MAPLE[l.c]} /></svg>
          </span>
        ))}
      </div>
      <svg viewBox="0 0 125 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="x-gsn-glass" cx="62.5" cy="50" r={D} gradientUnits="userSpaceOnUse">
            <stop offset="0.88" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.97" stopColor="#dff0ff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.4" />
          </radialGradient>
          <linearGradient id="x-gsn-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="x-gsn-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--x-gsn-base-hi)" />
            <stop offset="1" stopColor="var(--x-gsn-base)" />
          </linearGradient>
        </defs>
        <circle cx="62.5" cy="50" r={D} fill="url(#x-gsn-glass)" />
        <circle cx="62.5" cy="50" r={D} fill="none" stroke="var(--x-gsn-rim)" strokeWidth="0.35" />
        {/* The one still reflection: a soft crescent top left, and a small glint across from it */}
        <path d={`M${62.5 - D * 0.78} ${50 - D * 0.18} A${D * 0.86} ${D * 0.86} 0 0 1 ${62.5 - D * 0.1} ${50 - D * 0.84} A${D * 0.98} ${D * 0.98} 0 0 0 ${62.5 - D * 0.78} ${50 - D * 0.18}Z`} fill="url(#x-gsn-shine)" style={{ opacity: "var(--x-gsn-shine)" }} />
        <ellipse cx={62.5 + D * 0.55} cy={50 + D * 0.52} rx="3.2" ry="1.2" transform={`rotate(-45 ${62.5 + D * 0.55} ${50 + D * 0.52})`} fill="#fff" style={{ opacity: "calc(var(--x-gsn-shine) * .5)" }} />
        {/* The base: a lacquer plinth the dome sits in, with Kyoto's name on its plaque */}
        <path d="M37 89 Q62.5 85.5 88 89 L95 99.2 Q62.5 101 30 99.2 Z" fill="url(#x-gsn-base)" />
        <path d="M37 89 Q62.5 85.5 88 89" fill="none" stroke="var(--x-gsn-rim)" strokeWidth="0.5" />
        <rect x="55" y="92" width="15" height="5" rx="0.8" fill="var(--x-gsn-plaque)" />
        <text x="62.5" y="95.6" textAnchor="middle" fontSize="3.4" fill="var(--x-gsn-base)" fontFamily="var(--font-ja)">京都</text>
      </svg>
    </div>
  )
}

const look: Look = {
  line: "leaf",
  shade: 0.45,
  // Kyoto near the top: the globe faces 10°S at first, so Kyoto rides about 45° above the middle as it turns
  tilt: -10,
  inks: (night) => ({ nadia: night ? "#ff9b74" : "#ff8a5c", griffin: night ? "#cfe0a0" : "#d8e8a0", guest: night ? "#d8d2c4" : "#f2ede1", you: "#f4c55a", ink: night ? "#e0603f" : "#d0482e", paper: "#f2ede1" }),
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  decor: <Dome />,
  css: `${css}
.x-g24-box { --x-gsn-base: #4a1f17; --x-gsn-base-hi: #8a3a27; --x-gsn-plaque: #d9b26a; --x-gsn-rim: rgb(255 255 255 / .5); --x-gsn-shine: .9; }
[data-theme="lantern"] .x-g24-box { --x-gsn-base: #24100c; --x-gsn-base-hi: #5a271c; --x-gsn-plaque: #a8874c; --x-gsn-rim: rgb(255 240 220 / .3); --x-gsn-shine: .45; }`,
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(31)
    // The sea: deeper towards the poles
    const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, k.deep); sea.addColorStop(0.5, k.sea); sea.addColorStop(1, k.deep)
    g.fillStyle = sea; g.fillRect(0, 0, W, H)
    const { all } = await land(W)
    await breathe(g)
    // Snowy land: a white edge like sugar, blue shadow inside the coast, a little green showing through near the equator
    g.strokeStyle = k.coast; g.lineJoin = "round"; g.lineWidth = 5 * u; g.globalAlpha = 0.5; g.stroke(all); g.globalAlpha = 1
    await breathe(g)
    g.fillStyle = k.land; g.fill(all)
    await breathe(g)
    g.save(); g.clip(all)
    g.strokeStyle = k.shadow; for (const lw of [14, 7]) { g.lineWidth = lw * u; g.stroke(all); await breathe(g) }
    const band = g.createLinearGradient(0, latY(35, W), 0, latY(-35, W))
    band.addColorStop(0, "transparent"); band.addColorStop(0.5, k.green); band.addColorStop(1, "transparent")
    g.fillStyle = band; g.fillRect(0, latY(35, W), W, latY(-35, W) - latY(35, W))
    g.restore()
    await breathe(g)
    // Snow settled on the sea ice near the poles, and a dusting of flakes painted on the sea
    for (const [y0, y1] of [[0, latY(70, W)], [H, latY(-62, W)]]) {
      const b = g.createLinearGradient(0, y0, 0, y1); b.addColorStop(0, k.land); b.addColorStop(1, "transparent")
      g.fillStyle = b; g.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0))
    }
    await breathe(g)
    g.fillStyle = k.coast
    for (let i = 0; i < 500; i++) {
      if (i % 125 === 124) await breathe(g)
      const x = rnd() * W, y = rnd() * H, r = (0.8 + rnd() * 1.8) * u
      g.globalAlpha = 0.15 + rnd() * 0.25
      around(x, r, W, (cx) => { g.beginPath(); g.arc(cx, y, r, 0, Math.PI * 2); g.fill() })
    }
    g.globalAlpha = 1
    await breathe(g)
    grain(g, night ? 0.05 : 0.06, 31)
    return c
  },
}

export default function GlobeSnow() {
  return <GlobeLab look={look} />
}
