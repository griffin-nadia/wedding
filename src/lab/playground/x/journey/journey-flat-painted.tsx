import { useEffect, useRef, useState } from "react"
import { getJourneys, SAMPLE_JOURNEYS, type Journey } from "@/lib/api"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { still } from "../../motion"
import { useTake } from "../../params"
import { cssHex, paint, type Inks, type Style } from "./paint"

/**
 * The painted flat map (lab run 19): the fallback for phones without WebGL or with little memory, and the still for
 * reduced motion, painted in the same three hands as the globe (paint.ts) so the two agree. The world is turned so the
 * Pacific is in the middle (Brisbane, Kyoto and Canada all in view, London at the left edge), cropped from 70°N to
 * 50°S. The lines bow north like flight paths and draw in (Nadia's, then Griffin's, then the guests' fading in, then
 * the gold one); the Kyoto label sits on the city. No WebGL, no Three.js: a canvas and an SVG over it.
 * Reduced motion: everything drawn, nothing moving.
 */
const KYOTO: [number, number] = [35.01, 135.77], BRISBANE: [number, number] = [-27.47, 153.03], EDMONTON: [number, number] = [53.55, -113.49]
// The crop: 95°E to 105°W (centred on 175°E), 65°N to 45°S, so every city but London is on it; London's line runs in
// from the left edge
const MID = 175, SPAN = 160, N_LAT = 65, S_LAT = -45
const P = "x-fp"
const css = `
.${P} { position: relative; width: 100%; max-width: 720px; margin-inline: auto; border-radius: var(--radius-section); overflow: hidden; box-shadow: 0 0 0 1px var(--line-hairline); }
.${P} canvas { display: block; width: 100%; height: auto; }
.${P} svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.${P} path { fill: none; stroke-linecap: round; }
.${P}-home { stroke-width: 2.4; stroke-dasharray: 1; stroke-dashoffset: 1; animation: x-fp-draw 1.1s cubic-bezier(.45,.05,.3,1) forwards; }
.${P}-guest { stroke-width: 1.2; stroke-dasharray: 3 4; opacity: 0; animation: x-fp-in .6s ease-out forwards; }
@keyframes x-fp-draw { to { stroke-dashoffset: 0; } }
@keyframes x-fp-in { to { opacity: .6; } }
.${P} circle { fill: var(--action); }
.${P}-label { position: absolute; translate: -50% calc(-100% - 8px); display: flex; flex-direction: column; align-items: center; pointer-events: none;
  font: 400 calc(var(--type-small-size) * 1.15) / 1 var(--font-display); color: var(--ink); opacity: 0; animation: x-fp-in2 .5s ease-out 2.4s forwards; }
.${P}-label span { font: 11px / 1.2 var(--font-ja); color: var(--ink-soft); }
@keyframes x-fp-in2 { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .${P} * { animation: none !important; } .${P}-home { stroke-dashoffset: 0; } .${P}-guest { opacity: .6; } .${P}-label { opacity: 1; } }
`
const x = (lon: number) => ((((lon - MID + 540) % 360) - 180) + SPAN / 2) / SPAN
const y = (lat: number) => (N_LAT - lat) / (N_LAT - S_LAT)
/** A line that bows north, more for longer flights, as a flight path does on a flat map */
const arc = (from: [number, number], W: number, H: number) => {
  const [x1, y1, x2, y2] = [x(from[1]) * W, y(from[0]) * H, x(KYOTO[1]) * W, y(KYOTO[0]) * H]
  const d = Math.hypot(x2 - x1, y2 - y1)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1 + x2) / 2).toFixed(1)} ${Math.max(H * 0.05, Math.min(y1, y2) - d * 0.24).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

export default function JourneyFlatPainted() {
  const style = useTake("watercolour") as Style
  const { theme } = useTheme()
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const [cities, setCities] = useState<Journey[]>([])
  const [size, setSize] = useState<{ W: number; H: number } | null>(null)
  useEffect(() => { void getJourneys().then((c) => setCities(c.length ? c : SAMPLE_JOURNEYS)) }, [])
  useEffect(() => {
    const el = box.current, out = cv.current
    if (!el || !out) return
    let alive = true
    const night = theme === "lantern"
    const inks: Inks = {
      night, paper: cssHex(el, "--letter-bg", night ? "#2e1b12" : "#f6ecdc"),
      sea: night ? "#2f3a3c" : style === "gouache" ? "#b9c7c0" : "#c9d6d2",
      land: style === "gouache" ? (night ? "#7c7a52" : "#c7b98a") : night ? "#8a8660" : "#b9ad7e",
      edge: night ? "#2a2716" : "#6f6642", ink: cssHex(el, "--ink", night ? "#f1e3c8" : "#4a2a1a"), bloom: night ? "#a49567" : "#9c8d5c",
    }
    const phone = matchMedia("(pointer: coarse)").matches
    void paint(style, inks, phone ? 1536 : 2048).then((src) => {
      if (!alive) return
      // Turn the world so the Pacific is in the middle, then crop to the latitudes that matter
      const sw = src.width, sh = src.height, top = ((90 - N_LAT) / 180) * sh, ch = ((N_LAT - S_LAT) / 180) * sh
      const px = (lon: number) => ((lon + 180) / 360) * sw
      const west = MID - SPAN / 2, cw = (SPAN / 360) * sw, part = px(180) - px(west) // west edge to the date line, then on round
      out.width = Math.round(cw); out.height = Math.round(ch)
      const g = out.getContext("2d")!
      if (style === "watercolour") { g.fillStyle = inks.paper; g.fillRect(0, 0, cw, ch) } // the clear washes sit on the card's paper
      g.drawImage(src, px(west), top, part, ch, 0, 0, part, ch)
      g.drawImage(src, 0, top, cw - part, ch, part, 0, cw - part, ch)
      setSize({ W: Math.round(cw), H: Math.round(ch) })
    })
    return () => { alive = false }
  }, [style, theme])
  const ink = "var(--ink)"
  const reduce = still()
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <style>{css}</style>
      <div ref={box} className={P} role="img" aria-label={`${t.journey.title}: Nadia's line from Brisbane, Griffin's from Canada, one from every guest city, all to Kyoto.`}>
        <canvas ref={cv} aria-hidden />
        {size && (
          <svg key={`${style}${theme}`} viewBox={`0 0 ${size.W} ${size.H}`} preserveAspectRatio="none" aria-hidden>
            {cities.map((c, i) => <path key={c.name} className={`${P}-guest`} d={arc([c.lat, c.lon], size.W, size.H)} stroke={ink} style={{ animationDelay: reduce ? undefined : `${1.2 + (i % 8) * 0.12}s`, strokeWidth: size.W / 500 }} />)}
            <path className={`${P}-home`} pathLength={1} d={arc(BRISBANE, size.W, size.H)} stroke="var(--ink-story)" style={{ strokeWidth: size.W / 260 }} />
            <path className={`${P}-home`} pathLength={1} d={arc(EDMONTON, size.W, size.H)} stroke="var(--ink-moss)" style={{ animationDelay: "0.25s", strokeWidth: size.W / 260 }} />
            <path className={`${P}-home`} pathLength={1} d={arc([SAMPLE_JOURNEYS[0].lat, SAMPLE_JOURNEYS[0].lon], size.W, size.H)} stroke="var(--journey-you)" style={{ animationDelay: "2.6s", strokeWidth: size.W / 210 }} />
            <circle cx={x(KYOTO[1]) * size.W} cy={y(KYOTO[0]) * size.H} r={size.W / 130} />
          </svg>
        )}
        {size && <p className={`${P}-label`} style={{ left: `${x(KYOTO[1]) * 100}%`, top: `${y(KYOTO[0]) * 100}%` }} aria-hidden>Kyoto<span>京都</span></p>}
      </div>
      <p className="text-small text-muted-foreground">The fallback for phones without WebGL, and the still for reduced motion. The gold line is the sample household's (Melbourne).</p>
    </div>
  )
}
