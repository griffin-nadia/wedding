import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react"
import { getJourneys, SAMPLE_JOURNEYS, type Journey } from "@/lib/api"
import { Segmented } from "@/components/segmented"
import { pending } from "@/content/pending"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { Stage } from "../../stage"
import { getSpeed, ms, still, tween } from "../../motion"
import { useKnob, useParam } from "../../params"
import { ASPECT, DIST, FLAT, TAN, hidden, place, project, wrap } from "./kit-geo"
import { KYOTO, RAD, demoCrowd, trips, type Kind, type LineStyle, type Trip } from "./kit-data"
import { drawLine, travels } from "./kit-lines"
import { breathe, cssHex } from "./kit-paint"

/**
 * THE GLOBE KIT (lab run 24b, area globes24). Everything a globe look needs except its painting: the journey data, the
 * crowd switch, the Globe/Flat toggle that curls the paper map into the globe and back, the same key under both views,
 * the place names, the line styles, the turn, and reduced motion.
 *
 * HOW TO ADD A LOOK (looks 5 to 11):
 * 1. Make `globe-<name>.tsx` here: a `const look: Look = { line: "dots", paint: async ({ night, width }) => canvas }`
 *    and `export default function GlobeName() { return <GlobeLab look={look} /> }`. paint() returns a 2:1 picture
 *    (lon -180..180 across, lat 90..-90 down), painted in steps with `await breathe(g)` between them (kit-paint.ts has
 *    land(), sheet(), grain(), seeded(), lonX/latY). Cache nothing yourself: the kit keeps one picture per look and theme.
 *    (Optional also: back, the colour behind the key's swatches when a line colour wouldn't show on the page.)
 * 2. Optional: seeThrough (the far side through the paper), shade (darker towards the rim), rim (an ink outline), glow
 *    (a still glow under the places and lines, for Lantern night), glsl
 *    (a few lines of fragment shader acting on `col`, with vUv, vK = 0 flat .. 1 globe, vZ = how much a point faces
 *    you, and the view's uLon and uTilt: a point's longitude from the view's centre is vUv.x * 2π - π - uLon), segments (a low count for a faceted look), tilt (the latitude it faces at first), inks (line colours), farLines, decor (an overlay inside the
 *    map's box, e.g. a compass rose or a glass dome) and css (its own styles, classes prefixed x-<id>-).
 * 3. In index.ts add an entry with `knobs: globeKnobs("<its default line>")` and Component: lazy(() => import(...)).
 * The look never touches Three.js, the lines or the labels: kit-three.ts bends the paper (one plane mesh, a vertex
 * shader between the flat map and the sphere), kit-geo.ts is the same projection on the CPU for the 2D layer the
 * lines and labels are drawn on, and kit-lines.ts draws the six line styles.
 *
 * The data: Nadia's line from Brisbane and Griffin's from Victoria (BC), every coming household's city from
 * getJourneys() (the sample cities in the lab), and the household's own line (the sample household: Melbourne).
 * The crowd knob adds made-up demo households only (never real guests), labelled as demo. Place names (run 24 §3):
 * Kyoto, Brisbane and Victoria always; a guest city by name on hover, focus or tap only with 2 or more households,
 * otherwise its country. Reduced motion: no turning or coasting, every line drawn, nothing travelling, and Globe/Flat
 * fades instead of curling.
 */
export type Inks = Record<Kind, string> & { ink: string; paper: string }
export type Look = {
  /** The line style it opens with (the Line style knob changes it; keep index.ts's globeKnobs() the same) */
  line: LineStyle
  /** The 2:1 picture, painted in steps (see above) */
  paint: (o: { night: boolean; width: number; countries: string[]; inks: Inks }) => Promise<HTMLCanvasElement>
  /** Line colours: the site's tokens unless the look changes them */
  inks?: (night: boolean, base: Inks) => Partial<Inks>
  /** The far side through the paper, 0 (opaque) to 1 */
  seeThrough?: number
  /** Darker towards the globe's rim, 0 to 1 */
  shade?: number
  /** Lines round the back of the globe, 0 (hidden) to 1 (default: half of seeThrough) */
  farLines?: number
  /** An ink outline round the globe, in CSS pixels (fades in as it curls) */
  rim?: number
  /** Fragment shader lines acting on vec4 col (vUv, vK, vZ, uLon, uTilt available) */
  glsl?: string
  /** The latitude the globe faces at first, in degrees (default: just south of Kyoto, 23) */
  tilt?: number
  /** The mesh's detail, [across, down] (default 128 × 64) */
  segments?: [number, number]
  /** The colour behind the key's swatches (the look's sea), when a line colour wouldn't show on the page's paper */
  back?: (night: boolean) => string
  /** A still glow under every place and line on the 2D layer (e.g. lanterns at night): its colour, how it mixes, how
   *  big the glow at a guest's city is in CSS pixels at 680 wide (Kyoto's is twice that), and the strength of a wide
   *  soft pass under each line, 0 for none. Nothing moves in it: no shimmer. */
  glow?: (night: boolean) => { colour: string; blend: GlobalCompositeOperation; size: number; line: number }
  /** Drawn over the map inside its box (aria-hidden decoration) */
  decor?: ReactNode
  /** Its own styles */
  css?: string
}

/** Where the camera faces at first: just south of Kyoto, so the lines from the south are in view */
const FACE = { lon: (KYOTO.lon + 4) * RAD, tilt: (KYOTO.lat - 12) * RAD }
/** The flat map's centre: the Pacific (the site's frame, 90°E to 100°W) */
const FLAT_LON = 175 * RAD
const TURN = { auto: 4 * RAD, wait: 3000, easeIn: 1500, glide: 2.4, tilt: 55 * RAD }

/** A great-circle arc from a city to Kyoto, lifted in the middle, as latitude, unwrapped longitude and height */
const N = 64
function arcOf(t: Trip) {
  const v = (lat: number, lon: number) => [Math.cos(lat * RAD) * Math.cos(lon * RAD), Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD)]
  const a = v(t.lat, t.lon), b = v(KYOTO.lat, KYOTO.lon)
  const om = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const lat = new Float32Array(N), lon = new Float32Array(N), alt = new Float32Array(N)
  let prev = 0
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1), p = om < 1e-4 ? [a[0], a[1], a[2]] : [0, 1, 2].map((k) => (a[k] * Math.sin((1 - s) * om) + b[k] * Math.sin(s * om)) / Math.sin(om))
    let l = Math.atan2(p[1], p[0])
    if (i) l = prev + wrap(l - prev)
    prev = l
    lat[i] = Math.asin(Math.max(-1, Math.min(1, p[2]))); lon[i] = l; alt[i] = 0.004 + 0.09 * om * Math.sin(Math.PI * s)
  }
  return { lat, lon, alt }
}

const pictures = new WeakMap<Look, Map<string, Promise<HTMLCanvasElement>>>()
function pictureOf(look: Look, night: boolean, width: number, countries: string[], inks: Inks) {
  if (!pictures.has(look)) pictures.set(look, new Map())
  const m = pictures.get(look)!, key = `${night}-${width}`
  if (!m.has(key)) m.set(key, look.paint({ night, width, countries, inks }))
  return m.get(key)!
}

const P = "x-g24"
const css = `
.${P} { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); width: 100%; }
.${P}-toggle { flex: none; }
.${P}-box { position: relative; width: min(100%, 680px); aspect-ratio: ${ASPECT}; touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; border-radius: var(--radius-md, 8px); outline: 2px solid transparent; outline-offset: 4px; }
.${P}-box:active { cursor: grabbing; }
.${P}-box:focus-visible { outline-color: var(--input-focus); }
.${P}-art, .${P}-art > canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.${P}-marks { position: absolute; inset: 0; pointer-events: none; }
.${P}-mark { position: absolute; left: 0; top: 0; will-change: transform; }
.${P}-name { position: absolute; left: 8px; top: 0; translate: 0 -50%; white-space: nowrap; padding: 1px 6px; border-radius: 4px; background: color-mix(in oklab, var(--letter-bg) 90%, transparent); color: var(--ink); font: 500 12px / 1.3 var(--font-label); box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); }
.${P}-mark[data-side="left"] .${P}-name { left: auto; right: 8px; }
.${P}-pip { position: absolute; width: 7px; height: 7px; translate: -50% -50%; border-radius: 50%; background: var(--ink); box-shadow: 0 0 0 2px var(--letter-bg); }
.${P}-kyoto { display: flex; align-items: center; gap: 6px; translate: -12px -50%; position: absolute; white-space: nowrap; }
.${P}-seal { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 5px; background: var(--action); color: var(--action-foreground, #fff); font: 400 14px / 1 var(--font-ja); box-shadow: 0 1px 2px rgb(0 0 0 / 0.2); }
.${P}-kyoto .${P}-name { position: static; translate: none; }
.${P}-dot { position: absolute; width: 44px; height: 44px; translate: -50% -50%; padding: 0; border: 0; background: none; pointer-events: auto; cursor: pointer; border-radius: 50%; }
.${P}-dot::after { content: ""; position: absolute; left: 50%; top: 50%; width: 7px; height: 7px; translate: -50% -50%; border-radius: 50%; background: var(--x-g24-guest); box-shadow: 0 0 0 1.5px var(--letter-bg); }
.${P}-dot:focus-visible { outline: 2px solid var(--input-focus); outline-offset: -10px; }
.${P}-dot[aria-expanded="true"]::after { width: 10px; height: 10px; }
.${P}-tip { position: absolute; left: 0; top: 0; pointer-events: none; translate: -50% calc(-100% - 14px); white-space: nowrap; padding: 2px 8px; border-radius: 4px; background: var(--ink); color: var(--letter-bg); font: 500 12px / 1.4 var(--font-label); }
.${P}-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-1) var(--space-4); margin: 0; padding: 0; list-style: none; font-size: var(--type-small-size); color: var(--ink-soft); }
.${P}-legend li { display: inline-flex; align-items: center; gap: var(--space-2); }
.${P}-legend canvas { width: 30px; height: 12px; }
.${P}-note { margin: 0; font-size: var(--type-small-size); color: var(--ink-muted, var(--ink-soft)); text-align: center; }
.${P}-wait { position: absolute; inset: 0; display: grid; place-items: center; color: var(--ink-soft); font-size: var(--type-small-size); }
`

/** A key swatch: the line style itself, drawn the same way as on the map */
function Swatch({ style, colour, inks, width, back }: { style: LineStyle; colour: string; inks: Inks; width: number; back?: string }) {
  const c = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = c.current
    if (!el) return
    const r = Math.min(2, devicePixelRatio), g = el.getContext("2d")!
    el.width = 30 * r; el.height = 12 * r; g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, 30, 12)
    if (back) { g.fillStyle = back; g.beginPath(); g.roundRect(0, 0, 30, 12, 3); g.fill() }
    const xs = Array.from({ length: 16 }, (_, i) => 4 + i * 1.47), ys = xs.map(() => 6), al = xs.map(() => 1)
    drawLine(g, style, xs, ys, al, 16, 16, { colour, width, ink: inks.ink, paper: inks.paper, head: false, time: 0 })
  }, [style, colour, inks, width, back])
  return <canvas ref={c} aria-hidden />
}

const WIDTH: Record<Kind, number> = { nadia: 2.4, griffin: 2.4, guest: 1.3, you: 3 }

/** The whole take for one look: toggle, map, key. See the top of this file. */
export function GlobeLab({ look }: { look: Look }) {
  const { t, lang } = useLang()
  const { theme } = useTheme()
  const night = theme === "lantern"
  const style = useKnob("line", look.line) as LineStyle
  const crowdN = Number(useKnob("crowd", "0"))
  const [mode, setMode] = useParam("view", "globe")
  const [cities, setCities] = useState<Journey[]>([])
  useEffect(() => { void getJourneys().then((c) => setCities(c.length ? c : SAMPLE_JOURNEYS)) }, [])
  const crowd = useMemo(() => demoCrowd(crowdN), [crowdN])
  const list = useMemo(() => trips(cities, crowd, SAMPLE_JOURNEYS[0], { brisbane: t.journey.brisbane }), [cities, crowd, t.journey.brisbane])
  const arcs = useMemo(() => list.map((x) => ({ trip: x, ...arcOf(x) })), [list])

  const box = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), layer = useRef<HTMLCanvasElement>(null), tip = useRef<HTMLDivElement>(null)
  const marks = useRef(new Map<string, HTMLElement>())
  const [inks, setInks] = useState<Inks | null>(null)
  const [state, setState] = useState<"painting" | "ready" | "failed">("painting")
  const [open, setOpen] = useState<string | null>(null)
  const [focusAt, setFocusAt] = useState(0)
  const reduce = still()
  // Everything the frame loop reads, kept in one place so a knob or the toggle never rebuilds the globe
  const st = useRef({ lon: mode === "flat" ? FLAT_LON : FACE.lon, tilt: look.tilt == null ? FACE.tilt : look.tilt * RAD, m: mode === "flat" ? 0 : 1, vLon: 0, vTilt: 0, drag: null as null | { id: number; x: number; y: number; t: number }, touched: -Infinity, clock: 0, morphing: false, dirty: true })
  const live = useRef({ arcs, style, open, inks })
  live.current = { arcs, style, open, inks }
  // A new line style or crowd draws the lines again from the start
  useEffect(() => { st.current.clock = 0; st.current.dirty = true }, [style, crowdN])

  // The toggle: the paper curls into the globe (or opens out flat) over 1.3 s; under reduced motion it fades
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const s = st.current, to = mode === "flat" ? 0 : 1
    if (reduce) {
      const a = art.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(160), fill: "forwards" })
      const swap = () => {
        s.m = to; if (!to) s.lon = FLAT_LON; s.dirty = true
        art.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(200) })
        a?.cancel()
      }
      if (a) a.onfinish = swap; else swap()
      return
    }
    const m0 = s.m, lon0 = s.lon, lon1 = to ? s.lon : lon0 + wrap(FLAT_LON - lon0)
    s.morphing = true; s.vLon = s.vTilt = 0
    return tween(1300, (k, done) => {
      s.m = m0 + (to - m0) * k; s.lon = lon0 + (lon1 - lon0) * k; s.dirty = true
      if (done) { s.morphing = false; s.touched = performance.now() }
    }, (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2))
  }, [mode, reduce])

  useEffect(() => {
    const el = box.current, cv = layer.current, holder = art.current
    if (!el || !cv || !holder) return
    let alive = true, stop = () => {}
    const base: Inks = {
      nadia: cssHex(el, "--ink-story", "#a84f32"), griffin: cssHex(el, "--ink-moss", "#727354"), guest: cssHex(el, "--ink-soft", "#754b38"),
      you: cssHex(el, "--journey-you", "#d5a34f"), ink: cssHex(el, "--ink", "#3b2a20"), paper: cssHex(el, "--letter-bg", "#f6ecdc"),
    }
    const ink: Inks = { ...base, ...look.inks?.(night, base) }
    setInks(ink); setState("painting")
    el.style.setProperty("--x-g24-guest", ink.guest)
    const phone = matchMedia("(pointer: coarse)").matches
    const countries = [...new Set([...SAMPLE_JOURNEYS.map((c) => c.country), "AU", "CA", "JP", "NZ"])]
    // The paper goes on the page first (empty) while the look paints, then gets its picture
    const painting = pictureOf(look, night, phone ? 1024 : 2048, countries, ink)
    void import("./kit-three")
      .then(async ({ makePaper }) => {
        if (!alive) return
        const paper = makePaper({ seeThrough: look.seeThrough ?? 0, shade: look.shade ?? 0, glsl: look.glsl ?? "", segments: look.segments ?? [128, 64] }, Math.min(phone ? 1.5 : 2, devicePixelRatio))
        holder.prepend(paper.canvas)
        stop = () => { paper.canvas.remove(); paper.dispose() }
        // A CPU canvas: a few dozen lines a frame is cheap to draw there and needs no GPU flush or read back
        const g = cv.getContext("2d", { willReadFrequently: true })!
        const far = look.farLines ?? (look.seeThrough ?? 0) * 0.5
        // The look's glow, as one soft sprite drawn at each place (cheap: a few dozen small images a frame)
        const glow = look.glow?.(night)
        const sprite = document.createElement("canvas")
        if (glow) {
          sprite.width = sprite.height = 64
          const sg = sprite.getContext("2d")!, rg = sg.createRadialGradient(32, 32, 0, 32, 32, 32)
          rg.addColorStop(0, glow.colour); rg.addColorStop(0.25, glow.colour); rg.addColorStop(1, "transparent")
          sg.globalAlpha = 1; sg.fillStyle = rg; sg.fillRect(0, 0, 64, 64)
        }
        let w = 0, h = 0, r = 1
        const size = () => {
          w = el.clientWidth; h = el.clientHeight; r = Math.min(phone ? 1.5 : 2, devicePixelRatio)
          cv.width = Math.round(w * r); cv.height = Math.round(h * r); paper.resize(w, h); st.current.dirty = true
        }
        size()
        const ro = new ResizeObserver(size); ro.observe(el)
        stop = () => { ro.disconnect(); paper.canvas.remove(); paper.dispose() }
        const picture = await painting
        if (!alive) return
        await breathe(picture.getContext("2d"))
        await paper.setPicture(picture)
        if (!alive) return
        let visible = true
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(el)
        // The turn: a finger or mouse takes it (a drag across turns the globe half way, or pans the flat map under the
        // finger), it coasts when let go, the tilt is clamped, and the slow turn comes back 3 s after the last touch
        const s = st.current
        const perPx = () => {
          const globe = Math.PI / Math.max(160, w), flat = ((DIST - 1) * TAN * ASPECT * 2) / (FLAT * w)
          return flat + (globe - flat) * s.m
        }
        const down = (e: PointerEvent) => {
          if (s.drag || (e.pointerType === "mouse" && e.button !== 0) || (e.target as Element).closest("button")) return
          el.setPointerCapture(e.pointerId)
          s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp }; s.vLon = s.vTilt = 0
        }
        const move = (e: PointerEvent) => {
          if (!s.drag || e.pointerId !== s.drag.id) return
          const k = perPx(), dLon = -(e.clientX - s.drag.x) * k, dTilt = s.m > 0.5 ? (e.clientY - s.drag.y) * k : 0, dt = Math.max(1, e.timeStamp - s.drag.t) / 1000
          s.lon += dLon; s.tilt = Math.max(-TURN.tilt, Math.min(TURN.tilt, s.tilt + dTilt))
          s.vLon = s.vLon * 0.6 + (dLon / dt) * 0.4; s.vTilt = s.vTilt * 0.6 + (dTilt / dt) * 0.4
          s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp }; s.dirty = true
        }
        const up = (e: PointerEvent) => {
          if (!s.drag || e.pointerId !== s.drag.id) return
          if (reduce || e.timeStamp - s.drag.t > 80) s.vLon = s.vTilt = 0 // held still before letting go: no glide
          s.drag = null; s.touched = performance.now()
        }
        const key = (e: KeyboardEvent) => {
          if (e.target !== el) return
          const d = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key]
          if (!d) return
          e.preventDefault()
          s.lon += d[0] * 10 * RAD; if (s.m > 0.5) s.tilt = Math.max(-TURN.tilt, Math.min(TURN.tilt, s.tilt + d[1] * 6 * RAD))
          s.touched = performance.now(); s.dirty = true
        }
        el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move)
        el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("lostpointercapture", up)
        el.addEventListener("keydown", key)

        const pt = [0, 0, 0], px = [0, 0]
        let xs = new Float32Array(N), ys = new Float32Array(N), al = new Float32Array(N), then = performance.now()
        const draw = (now: number) => {
          const dt = Math.min(0.05, (now - then) / 1000) * getSpeed(); then = now
          if (!visible) return true
          const { arcs, style, open, inks } = live.current
          const travel = travels(style), dur = travel ? 2.2 : 1.2
          // The lines' timeline: Nadia's and Griffin's, then the guests', then the household's own
          const starts = arcs.map(({ trip }, i) => (trip.kind === "nadia" ? 0.3 : trip.kind === "griffin" ? 0.55 : trip.kind === "you" ? 1.4 + Math.min(arcs.length, 30) * 0.08 + 0.6 : 1.4 + (i - 2) * 0.08))
          const drawing = !reduce && s.clock < Math.max(...starts) + dur + 0.1
          s.clock += dt
          if (!s.drag && !s.morphing && !reduce) {
            s.lon += s.vLon * dt; s.tilt += s.vTilt * dt
            const f = Math.exp(-TURN.glide * dt); s.vLon *= f; s.vTilt *= f
            if (Math.abs(s.tilt) > TURN.tilt) { s.tilt = Math.sign(s.tilt) * TURN.tilt; s.vTilt = 0 }
            if (s.m === 1 && !drawing) {
              const back = Math.min(1, Math.max(0, (now - s.touched - TURN.wait) / TURN.easeIn))
              s.lon += TURN.auto * back * back * dt
            }
          }
          const moving = s.drag || s.morphing || Math.abs(s.vLon) + Math.abs(s.vTilt) > 1e-4 || (s.m === 1 && !reduce)
          if (!moving && !drawing && !s.dirty) return true // a still flat map: nothing to draw
          s.dirty = false
          paper.render(s)
          g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h)
          // The ink rim, as the paper becomes a ball
          if (look.rim && s.m > 0.85) {
            const R = (Math.tan(Math.asin(1 / DIST)) / TAN) * (h / 2)
            g.globalAlpha = (s.m - 0.85) / 0.15; g.strokeStyle = inks!.ink; g.lineWidth = look.rim
            g.beginPath(); g.arc(w / 2, h / 2, R, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1
          }
          const globe = s.m > 0.98
          if (glow) {
            const z = Math.max(0.6, w / 680) * glow.size
            g.globalCompositeOperation = glow.blend
            const spot = (la: number, lo: number, size: number) => {
              place(la * RAD, wrap(lo * RAD - s.lon), 0.004, s.m, s.tilt, pt); project(pt, w, h, px)
              if (!(globe && hidden(pt))) g.drawImage(sprite, px[0] - size / 2, px[1] - size / 2, size, size)
            }
            spot(KYOTO.lat, KYOTO.lon, z * 2)
            for (const { trip } of arcs) spot(trip.lat, trip.lon, trip.kind === "guest" ? z : z * 1.4)
            g.globalCompositeOperation = "source-over"
          }
          for (let j = 0; j < arcs.length; j++) {
            const { trip, lat, lon, alt } = arcs[j]
            const p = reduce ? 1 : Math.max(0, Math.min(1, (s.clock - starts[j]) / dur))
            const n = Math.round(p * (N - 1)) + 1
            if (n < 2) continue
            if (xs.length < N) { xs = new Float32Array(N); ys = new Float32Array(N); al = new Float32Array(N) }
            // Unwrapped from whichever end is nearer the middle of the view, so a long line stays whole on the flat map
            const kyo = lon[N - 1] - s.lon, home = lon[0] - s.lon
            const shift = Math.abs(wrap(kyo)) < Math.abs(wrap(home)) ? wrap(kyo) - kyo : wrap(home) - home
            for (let i = 0; i < n; i++) {
              place(lat[i], lon[i] - s.lon + shift, alt[i], s.m, s.tilt, pt); project(pt, w, h, px)
              xs[i] = px[0]; ys[i] = px[1]; al[i] = globe && hidden(pt) ? far : 1
            }
            const o = { colour: inks![trip.kind], width: WIDTH[trip.kind], ink: inks!.ink, paper: inks!.paper, head: !reduce, time: s.clock }
            g.globalAlpha = trip.kind === "guest" ? 0.7 : 1
            // The household's own line gets a soft darker edge under it, so the gold holds on pale paper
            if (trip.kind === "you") { g.globalAlpha = 0.25; drawLine(g, style, xs, ys, al, n, N, { ...o, colour: inks!.ink, width: o.width + 2, head: false }); g.globalAlpha = 1 }
            if (glow?.line) {
              g.globalCompositeOperation = glow.blend; g.globalAlpha = glow.line * (trip.kind === "guest" ? 0.7 : 1)
              drawLine(g, style, xs, ys, al, n, N, { ...o, halo: true, head: false })
              g.globalCompositeOperation = "source-over"; g.globalAlpha = trip.kind === "guest" ? 0.7 : 1
            }
            drawLine(g, style, xs, ys, al, n, N, o)
          }
          g.globalAlpha = 1
          // The names and dots, pinned to their places; hidden round the back of the globe
          const marksAt = (id: string, la: number, lo: number) => {
            const m = marks.current.get(id)
            place(la * RAD, wrap(lo * RAD - s.lon), 0.004, s.m, s.tilt, pt); project(pt, w, h, px)
            const off = (globe && hidden(pt)) || px[0] < -4 || px[0] > w + 4 || px[1] < -4 || px[1] > h + 4
            if (m) {
              m.style.transform = `translate3d(${px[0].toFixed(1)}px, ${px[1].toFixed(1)}px, 0)`
              const vis = off ? "hidden" : "visible"
              if (m.style.visibility !== vis) m.style.visibility = vis
              if (m.dataset.side !== (px[0] > w * 0.62 ? "left" : "right")) m.dataset.side = px[0] > w * 0.62 ? "left" : "right"
            }
            return off
          }
          marksAt("kyoto", KYOTO.lat, KYOTO.lon)
          for (const { trip } of arcs) {
            const off = marksAt(trip.id, trip.lat, trip.lon)
            if (trip.id === open && tip.current) {
              tip.current.style.transform = `translate3d(${px[0].toFixed(1)}px, ${px[1].toFixed(1)}px, 0)`
              tip.current.style.visibility = off ? "hidden" : "visible"
            }
          }
          return true
        }
        const cancel = loop(draw)
        setState("ready")
        stop = () => { cancel(); ro.disconnect(); io.disconnect(); el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("lostpointercapture", up); el.removeEventListener("keydown", key); paper.canvas.remove(); paper.dispose() }
      })
      .catch(() => alive && setState("failed"))
    return () => { alive = false; stop() }
  }, [look, night, reduce])
  // The tooltip moves with its dot, so it needs a frame drawn when it opens
  useEffect(() => { st.current.dirty = true }, [open])

  const guests = list.filter((x) => x.kind === "guest")
  const roam = (e: ReactKeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (e.key === "Escape") { setOpen(null); return }
    if (!d) return
    e.preventDefault(); e.stopPropagation()
    const n = (i + d + guests.length) % guests.length
    setFocusAt(n); setOpen(guests[n].id)
    marks.current.get(guests[n].id)?.querySelector("button")?.focus()
  }
  const openTrip = list.find((x) => x.id === open)
  const legend: [Kind, string][] = [["nadia", t.journey.legend.nadia], ["griffin", t.journey.legend.griffin], ["guest", t.journey.legend.guests], ["you", `${t.journey.legend.you} (sample)`]]
  const ref = (id: string) => (n: HTMLElement | null) => { if (n) marks.current.set(id, n); else marks.current.delete(id) }
  return (
    <Stage hint="Drag to turn it. Globe and Flat curl the same paper.">
      <style>{css}{look.css ?? ""}</style>
      <div className={P} onKeyDown={(e) => { if (e.key === "Escape") setOpen(null) }}>
        <Segmented className={`${P}-toggle`} label={pending("journey.mapMode", lang)} size="sm" value={mode as "globe" | "flat"} onChange={setMode}
          items={[{ value: "globe", label: pending("journey.globe", lang) }, { value: "flat", label: pending("journey.flat", lang) }]} />
        <div ref={box} className={`${P}-box`} tabIndex={0} role="group" aria-roledescription="map" aria-label={`${t.journey.title}. Drag, or use the arrow keys, to turn it.`}>
          <div ref={art} className={`${P}-art`}><canvas ref={layer} aria-hidden /></div>
          {look.decor}
          <div className={`${P}-marks`}>
            <div ref={ref("kyoto")} className={`${P}-mark`} aria-hidden><span className={`${P}-kyoto`}><span className={`${P}-seal`}>京</span><span className={`${P}-name`}>{t.journey.kyotoPin}</span></span></div>
            <div role="group" aria-label="Where guests are coming from">
              {guests.map((x, i) => (
                <div key={x.id} ref={ref(x.id)} className={`${P}-mark`}>
                  <button type="button" className={`${P}-dot`} aria-label={x.label} aria-expanded={open === x.id} tabIndex={i === Math.min(focusAt, guests.length - 1) ? 0 : -1}
                    onClick={() => { setFocusAt(i); setOpen(x.id) }} onFocus={() => { setFocusAt(i); setOpen(x.id) }} onBlur={() => setOpen(null)}
                    onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(x.id) }} onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpen(null) }}
                    onKeyDown={(e) => roam(e, i)} />
                </div>
              ))}
            </div>
            {list.filter((x) => x.always).map((x) => (
              <div key={x.id} ref={ref(x.id)} className={`${P}-mark`} aria-hidden><span className={`${P}-pip`} /><span className={`${P}-name`}>{x.label}</span></div>
            ))}
            {openTrip && <div ref={tip} className={`${P}-tip`} role="status">{openTrip.label}</div>}
          </div>
          {state !== "ready" && <p className={`${P}-wait`} aria-live="polite">{state === "failed" ? "No WebGL here: the site falls back to its flat map." : "Painting the globe…"}</p>}
        </div>
        {inks && (
          <ul className={`${P}-legend`} aria-label="Key">
            {legend.map(([k, label]) => <li key={k}><Swatch style={style} colour={inks[k]} inks={inks} width={WIDTH[k]} back={look.back?.(night)} />{label}</li>)}
          </ul>
        )}
        {crowdN > 0 && <p className={`${P}-note`}>Demo crowd: {crowdN} made-up households, not guests.</p>}
        <ul className="sr-only">
          <li>{t.journey.list.nadia}</li><li>{t.journey.list.griffin}</li>
          {guests.map((x) => <li key={x.id}>{x.label}</li>)}
          <li>{t.journey.list.you(SAMPLE_JOURNEYS[0].name)}</li>
        </ul>
      </div>
    </Stage>
  )
}
