import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from "react"
import { getJourneys, SAMPLE_JOURNEYS, type Journey } from "@/lib/api"
import { Segmented } from "@/components/segmented"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { Stage } from "../../stage"
import { getSpeed, ms, still, tween } from "../../motion"
import { getParam, setParam, useKnob, useParam } from "../../params"
import type { Knob } from "../../types"
import { ASPECT, DIST, FLAT, TAN, hidden, place, project, wrap } from "./kit-geo"
import { BRISBANE_SAMPLE, CHAPTERS, ICONS, KYOTO, KYOTO_PLACES, LINE_STYLES, RAD, TUNE, chapterTrips, demoCrowd, trips, type Chapter, type Icon, type Kind, type LineStyle, type Trip } from "./kit-data"
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetHead, SheetTitle } from "@/components/ui/sheet"
import { drawLine, iconFor, travels } from "./kit-lines"
import { breathe, cssHex, land, sheet } from "./kit-paint"

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
  /** What travels the lines at first (run 26; default "auto", the line style's own; keep globeKnobs()'s the same) */
  icon?: Icon
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
  const to = t.to ?? KYOTO, a = v(t.lat, t.lon), b = v(to.lat, to.lon), lift = t.near ? 0.5 : 1
  const om = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
  const lat = new Float32Array(N), lon = new Float32Array(N), alt = new Float32Array(N)
  let prev = 0
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1), p = om < 1e-4 ? [a[0], a[1], a[2]] : [0, 1, 2].map((k) => (a[k] * Math.sin((1 - s) * om) + b[k] * Math.sin(s * om)) / Math.sin(om))
    let l = Math.atan2(p[1], p[0])
    if (i) l = prev + wrap(l - prev)
    prev = l
    lat[i] = Math.asin(Math.max(-1, Math.min(1, p[2]))); lon[i] = l; alt[i] = 0.004 + 0.09 * lift * om * Math.sin(Math.PI * s)
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
.${P}-seal { width: 10px; height: 10px; rotate: 45deg; border-radius: 2px; background: var(--action); box-shadow: 0 0 0 2px var(--letter-bg); }
/* Run 26c: G and N beside Victoria and Brisbane, in their own line colour, in place of the plain dot */
.${P}-badge { position: absolute; display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 4px; translate: -50% -50%; border-radius: 9px; background: var(--b); color: var(--letter-bg); font: 600 11px / 1 var(--font-label); letter-spacing: 0.02em; box-shadow: 0 0 0 1.5px var(--letter-bg), 0 1px 2px rgb(0 0 0 / 0.2); }
.${P}-mark:has(.${P}-badge) .${P}-name { left: 13px; }
.${P}-mark[data-side="left"]:has(.${P}-badge) .${P}-name { left: auto; right: 13px; }
/* Run 26c: a chapter's place, much quieter than a guest's dot: a thin ring, no number. 32px to tap. */
.${P}-ch { position: absolute; width: 32px; height: 32px; translate: -50% -50%; padding: 0; border: 0; background: none; pointer-events: auto; cursor: pointer; border-radius: 50%; }
.${P}-ch::after { content: ""; position: absolute; left: 50%; top: 50%; width: 9px; height: 9px; translate: -50% -50%; border-radius: 50%; border: 1.5px solid var(--ink-story, var(--ink-soft)); background: color-mix(in oklab, var(--letter-bg) 70%, transparent); opacity: 0.85; transition: scale 150ms; }
.${P}-ch:hover::after, .${P}-ch:focus-visible::after { scale: 1.35; opacity: 1; }
.${P}-ch:focus-visible { outline: 2px solid var(--input-focus); outline-offset: -6px; }
/* Run 26c: the Kyoto close-up, so the venue map's places show at once with the world */
.${P}-inset { position: absolute; right: 6px; bottom: 6px; width: clamp(104px, 33%, 176px); aspect-ratio: 1; margin: 0; padding: 0; border-radius: 6px; background: color-mix(in oklab, var(--letter-bg) 94%, transparent); box-shadow: 0 0 0 1px var(--line-hairline), 0 2px 6px rgb(0 0 0 / 0.14); pointer-events: auto; cursor: default; }
/* On the globe it sits bottom left (Brisbane's N and name sit on the rim, bottom right); on the map bottom right (the
   empty South Pacific). Smaller on the story stop's size. */
.${P}-box[data-mode="globe"] .${P}-inset { right: auto; left: 6px; }
.${P}-box[data-size="stop"] .${P}-inset { width: clamp(84px, 27%, 124px); }
.${P}-inset svg { display: block; width: 100%; height: 100%; overflow: visible; }
.${P}-inset text { font: 500 6.5px / 1 var(--font-label); fill: var(--ink); paint-order: stroke; stroke: var(--letter-bg); stroke-width: 2px; }
.${P}-inset .t { font-size: 6px; fill: var(--ink-soft); letter-spacing: 0.04em; text-transform: uppercase; }
.${P}-chapters { width: min(100%, 680px); margin: 0; }
.${P}-chapters h3 { margin: 0 0 var(--space-1); font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink); }
.${P}-chapters ol { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-2); margin: 0; padding: 0; list-style: none; }
.${P}-chapters button { min-height: 44px; padding: 0 var(--space-3); border: 1px solid var(--line-hairline); border-radius: 999px; background: color-mix(in oklab, var(--letter-bg) 80%, transparent); color: var(--ink); font: 500 var(--type-small-size) / 1.2 var(--font-label); cursor: pointer; }
.${P}-chapters button span { color: var(--ink-soft); font-variant-numeric: tabular-nums; margin-right: 0.4em; }
.${P}-chapters button:hover { border-color: var(--ink-soft); }
.${P}-chapters button:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.${P}-sheet .sheet-body { display: flex; flex-direction: column; gap: var(--space-3); padding-bottom: var(--space-4); }
.${P}-sheet .${P}-box { width: min(100%, 520px); align-self: center; }
.${P}-sheet-line { margin: 0; color: var(--ink); }
.${P}-sheet .${P}-toggle { align-self: center; }
.${P}-sheet-also { min-height: 24px; padding: 0 4px; border: 0; background: none; color: var(--action); font: inherit; text-decoration: underline; cursor: pointer; }
.${P}-sheet-also:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; border-radius: 4px; }
.${P}-sheet-meta { margin: 0; font-size: var(--type-small-size); color: var(--ink-soft); }
.${P}-sheet-back { align-self: flex-end; min-height: 44px; padding: 0 var(--space-4); border: 1px solid var(--line-hairline); border-radius: 999px; background: none; color: var(--action); font: 500 var(--type-small-size) / 1 var(--font-label); cursor: pointer; }
.${P}-sheet-back:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .${P}-ch::after { transition: none; } }
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
.${P}-views { display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-end; gap: var(--space-4) var(--space-5); width: 100%; }
.${P}-view { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); margin: 0; flex: 1 1 360px; max-width: 620px; }
.${P}-view[data-size="stop"] { flex: 0 1 280px; }
.${P}-view figcaption { font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink-soft); }
.${P}-view > .${P}-box { width: 100%; }
.${P}-tune { width: min(100%, 680px); border-top: 1px solid var(--line-hairline); padding-top: var(--space-2); }
.${P}-tune summary { display: flex; align-items: center; min-height: 44px; cursor: pointer; font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink); }
.${P}-tune summary:focus-visible, .${P}-tune-reset:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; border-radius: 4px; }
.${P}-tune-body { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-1) var(--space-5); }
.${P}-tune-row { display: grid; grid-template-columns: 8.5em 1fr 3.2em; align-items: center; gap: var(--space-2); min-height: 44px; font-size: var(--type-small-size); color: var(--ink-soft); }
.${P}-tune-row select { grid-column: 2 / 4; }
.${P}-tune-row input { width: 100%; accent-color: var(--action); }
.${P}-tune-row output { font-variant-numeric: tabular-nums; color: var(--ink); text-align: right; }
.${P}-tune-reset { justify-self: start; min-height: 44px; padding: 0 var(--space-2); border: 0; background: none; color: var(--action); font: 500 var(--type-small-size) / 1.3 var(--font-label); text-decoration: underline; cursor: pointer; }
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

/** The land as a mask (white land on black, 2:1), for the Land opacity slider: one per page */
let landMask: Promise<HTMLCanvasElement> | null = null
const maskOf = () => (landMask ??= land(1024).then(({ all }) => {
  const [c, g] = sheet(1024)
  g.fillStyle = "#000"; g.fillRect(0, 0, 1024, 512); g.fillStyle = "#fff"; g.fill(all)
  return c
}))

/** The tuning panel's values (run 26), as the frame loop reads them */
type Tune = { land: number; grain: number; weight: number; shadow: number; iconSize: number; icon: Exclude<Icon, "auto"> }
type Arc = { trip: Trip } & ReturnType<typeof arcOf>
type ViewProps = {
  look: Look; night: boolean; inks: Inks; arcs: Arc[]; list: Trip[]; style: LineStyle; tune: Tune; mode: string; reduce: boolean; size: "stop" | "full"; label: string
  /** Run 26c: the chapters' quiet pins, and what a tap on one does (opens its detail view; never goes to the chapter) */
  chapters?: Chapter[]; onChapter?: (key: string, from: HTMLElement) => void
  /** Run 26c: the Kyoto close-up in the corner (default on), Kyoto's own mark (default on), where the globe faces first */
  inset?: boolean; kyoto?: boolean; face?: { lon: number; tilt: number }
}

/**
 * The whole take for one look (see the top of this file). Run 26: the same look in two views, the story stop's size and
 * the full screen's, with one Globe / Map switch above both, so they curl together; and the tuning panel under the key.
 */
export function GlobeLab({ look }: { look: Look }) {
  const { t, lang } = useLang()
  const { theme } = useTheme()
  const night = theme === "lantern"
  const style = useKnob("line", look.line) as LineStyle
  const icon = useKnob("icon", look.icon ?? "auto") as Icon
  const crowdN = Number(useKnob("crowd", "0"))
  const views = useKnob("views", "both")
  const tune: Tune = {
    land: useKnob("land", 100) / 100, grain: useKnob("grain", 0) / 100, weight: useKnob("weight", 100) / 100,
    shadow: useKnob("shadow", 0) / 100, iconSize: useKnob("iconSize", 100) / 100, icon: iconFor(style, icon),
  }
  const [mode, setMode] = useParam("view", "globe")
  const [cities, setCities] = useState<Journey[]>([])
  // Run 26c: plus lab sample travellers from Brisbane, so the map shows them in their own spots beside N
  useEffect(() => { void getJourneys().then((c) => setCities([...(c.length ? c : SAMPLE_JOURNEYS), BRISBANE_SAMPLE])) }, [])
  // Run 26c: the chapter open in the detail view (its own sheet over the playground; the page never moves)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  // The opener, kept here: Safari doesn't focus a button on click, and focus must go back to it on close
  const opener = useRef<HTMLElement | null>(null)
  const openChapter = (key: string, from: HTMLElement) => { opener.current = from; setChapter(CHAPTERS.find((c) => c.key === key) ?? null) }
  const crowd = useMemo(() => demoCrowd(crowdN), [crowdN])
  const list = useMemo(() => trips(cities, crowd, SAMPLE_JOURNEYS[0], { brisbane: t.journey.brisbane }), [cities, crowd, t.journey.brisbane])
  const arcs = useMemo(() => list.map((x) => ({ trip: x, ...arcOf(x) })), [list])
  const reduce = still()
  // The line colours, read from the theme once it's on the page; both views wait for them, so a theme change builds
  // each view once
  const root = useRef<HTMLDivElement>(null)
  const [inks, setInks] = useState<{ look: Look; night: boolean; ink: Inks } | null>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const base: Inks = {
      nadia: cssHex(el, "--ink-story", "#a84f32"), griffin: cssHex(el, "--ink-moss", "#727354"), guest: cssHex(el, "--ink-soft", "#754b38"),
      you: cssHex(el, "--journey-you", "#d5a34f"), ink: cssHex(el, "--ink", "#3b2a20"), paper: cssHex(el, "--letter-bg", "#f6ecdc"),
    }
    setInks({ look, night, ink: { ...base, ...look.inks?.(night, base) } })
  }, [look, night])
  const ink = inks && inks.look === look && inks.night === night ? inks.ink : null
  const legend: [Kind, string][] = [["nadia", t.journey.legend.nadia], ["griffin", t.journey.legend.griffin], ["guest", t.journey.legend.guests], ["you", `${t.journey.legend.you} (sample)`]]
  const guests = list.filter((x) => x.kind === "guest")
  const common = ink && { look, night, inks: ink, arcs, list, style, tune, mode, reduce }
  return (
    <Stage hint="Drag to turn it. One switch curls every view. Tap a story line to see it explained.">
      <style>{css}{look.css ?? ""}</style>
      <div ref={root} className={P}>
        <Segmented className={`${P}-toggle`} label={(lang === "ja" ? "地図" : "Map")} size="sm" value={mode as "globe" | "flat"} onChange={setMode}
          items={[{ value: "globe", label: (lang === "ja" ? "地球儀" : "Globe") }, { value: "flat", label: (lang === "ja" ? "地図" : "Map") }]} />
        <div className={`${P}-views`}>
          {views === "both" && <figure className={`${P}-view`} data-size="stop">{common ? <View {...common} size="stop" label="In the story" chapters={PINS} onChapter={openChapter} /> : <div className={`${P}-box`} />}<figcaption>In the story</figcaption></figure>}
          <figure className={`${P}-view`} data-size="full">{common ? <View {...common} size="full" label="Full screen" chapters={PINS} onChapter={openChapter} /> : <div className={`${P}-box`} />}<figcaption>Full screen</figcaption></figure>
        </div>
        {ink && (
          <ul className={`${P}-legend`} aria-label="Key">
            {legend.map(([k, label]) => <li key={k}><Swatch style={style} colour={ink[k]} inks={ink} width={WIDTH[k] * tune.weight} back={look.back?.(night)} />{label}</li>)}
          </ul>
        )}
        {crowdN > 0 && <p className={`${P}-note`}>Demo crowd: {crowdN} made-up households, not guests.</p>}
        <nav className={`${P}-chapters`} aria-labelledby={`${P}-chapters`}>
          <h3 id={`${P}-chapters`}>The story's lines (tap one, or a ring on the map)</h3>
          <ol>{CHAPTERS.map((c) => <li key={c.key}><button type="button" aria-haspopup="dialog" onClick={(e) => openChapter(c.key, e.currentTarget)}>{c.year && <span>{c.year}</span>}{c.title}</button></li>)}</ol>
        </nav>
        {common && <ChapterSheet chapter={chapter} onClose={() => setChapter(null)} onPick={setChapter} opener={opener} common={common} />}
        <TunePanel style={look.line} icon={look.icon ?? "auto"} />
        <ul className="sr-only">
          <li>{t.journey.list.nadia}</li><li>{t.journey.list.griffin}</li>
          {guests.map((x) => <li key={x.id}>{x.label}</li>)}
          <li>{t.journey.list.you(SAMPLE_JOURNEYS[0].name)}</li>
        </ul>
      </div>
    </Stage>
  )
}

/** The tuning panel (run 26): every slider on the page, under the key, so the globe stays in view while you tune.
 *  The same values as the Options sheet's knobs (they live in the address, so Copy settings carries them). */
function TunePanel({ style, icon: def }: { style: LineStyle; icon: Icon }) {
  const [line, setLine] = useParam("k.line", style)
  const [icon, setIcon] = useParam("k.icon", def)
  const reset = () => { for (const k of [...TUNE.map((x) => x.id), "icon"]) setParam(`k.${k}`, null) }
  // Open at first on a laptop, or when the link carries tuning; closed on a phone so both views come first
  const [first] = useState(() => matchMedia("(min-width: 900px)").matches || TUNE.some((k) => getParam(`k.${k.id}`) !== null))
  return (
    <details className={`${P}-tune`} open={first}>
      <summary>Tune the look</summary>
      <div className={`${P}-tune-body`}>
        <label className={`${P}-tune-row`}><span>Line style</span>
          <select className="field" value={line} onChange={(e) => setLine(e.target.value)}>{LINE_STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className={`${P}-tune-row`}><span>Travelling icon</span>
          <select className="field" value={icon} onChange={(e) => setIcon(e.target.value)}>{ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        {TUNE.map((k) => k.kind === "range" && <Slider key={k.id} k={k} />)}
        <button type="button" className={`${P}-tune-reset`} onClick={reset}>Back to the look as painted</button>
      </div>
    </details>
  )
}
function Slider({ k }: { k: Extract<Knob, { kind: "range" }> }) {
  const [v, set] = useParam(`k.${k.id}`, String(k.def))
  return (
    <label className={`${P}-tune-row`}><span>{k.label}</span>
      <input type="range" min={k.min} max={k.max} step={k.step} value={v} onChange={(e) => set(e.target.value)} aria-valuetext={`${v}${k.unit ?? ""}`} />
      <output>{v}{k.unit ?? ""}</output>
    </label>
  )
}

/** One quiet ring per place on the map (the first chapter there); its detail view links the others there */
const PINS = CHAPTERS.filter((c, i) => CHAPTERS.findIndex((d) => d.place === c.place) === i)

/** Where the globe faces first for a chapter's lines: the middle of all their ends */
function faceOf(list: Trip[]) {
  const v = [0, 0, 0]
  for (const t of list) for (const p of [t, t.to ?? KYOTO]) { v[0] += Math.cos(p.lat * RAD) * Math.cos(p.lon * RAD); v[1] += Math.cos(p.lat * RAD) * Math.sin(p.lon * RAD); v[2] += Math.sin(p.lat * RAD) }
  return { lon: Math.atan2(v[1], v[0]), tilt: Math.atan2(v[2], Math.hypot(v[0], v[1])) }
}

/**
 * Run 26c: a chapter's detail view. Tapping a chapter (its ring on the map, or its name in the list) opens this over the
 * playground and never moves the page or goes to the chapter: the line explained in words, and a map of only that
 * chapter's lines in the same look, under the same Globe / Map switch. It is the site's own sheet (Radix dialog, the
 * APG dialog pattern): focus moves in, Tab stays inside, Escape, the X or Back to the map closes it, and focus goes back
 * to what opened it.
 */
function ChapterSheet({ chapter, onClose, onPick, opener, common }: { chapter: Chapter | null; onClose: () => void; onPick: (c: Chapter) => void; opener: RefObject<HTMLElement | null>; common: Omit<ViewProps, "size" | "label"> }) {
  const list = useMemo(() => (chapter ? chapterTrips(chapter) : []), [chapter])
  const arcs = useMemo(() => list.map((x) => ({ trip: x, ...arcOf(x) })), [list])
  const toKyoto = list.some((x) => x.toLabel === "Kyoto")
  const also = chapter ? CHAPTERS.filter((c) => c !== chapter && c.place === chapter.place) : []
  // The same Globe / Map switch as the page's (one value in the address), so every view changes together
  const [mode, setMode] = useParam("view", "globe")
  return (
    <Sheet open={!!chapter} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className={`${P}-sheet`} closeLabel="Close this line" onCloseAutoFocus={(e) => { const el = opener.current; if (el?.isConnected) { e.preventDefault(); el.focus({ preventScroll: true }) } }}>
        {chapter && <>
          <SheetHead><SheetTitle className="font-display text-heading">{chapter.year ? `${chapter.year} · ` : ""}{chapter.title}</SheetTitle></SheetHead>
          <SheetBody>
            <SheetDescription className={`${P}-sheet-line`}>{chapter.line}</SheetDescription>
            <p className={`${P}-sheet-meta`}>{chapter.place}. Lab sample: the words for each line are placeholders until the story's own go in.</p>
            <Segmented className={`${P}-toggle`} label="Map" size="sm" value={mode as "globe" | "flat"} onChange={setMode} items={[{ value: "globe", label: "Globe" }, { value: "flat", label: "Map" }]} />
            <View key={chapter.key} {...common} arcs={arcs} list={list} size="stop" mode={mode} label={`${chapter.title}, its line`} inset={toKyoto} kyoto={toKyoto} face={faceOf(list)} />
            {also.length > 0 && <p className={`${P}-sheet-meta`}>Also here: {also.map((c) => <button key={c.key} type="button" className={`${P}-sheet-also`} onClick={() => onPick(c)}>{c.year ? `${c.year} · ` : ""}{c.title}</button>)}</p>}
            <SheetClose asChild><button type="button" className={`${P}-sheet-back`}>Back to the map</button></SheetClose>
          </SheetBody>
        </>}
      </SheetContent>
    </Sheet>
  )
}

/** One view of the look: the map's box, its paper, lines and names. Both views read the same switch and tuning. */
function View({ look, night, inks, arcs, list, style, tune, mode, reduce, size, label, chapters = [], onChapter, inset = true, kyoto = true, face = FACE }: ViewProps) {
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null), art = useRef<HTMLDivElement>(null), layer = useRef<HTMLCanvasElement>(null), tip = useRef<HTMLDivElement>(null)
  const marks = useRef(new Map<string, HTMLElement>())
  const [state, setState] = useState<"painting" | "ready" | "failed">("painting")
  const [open, setOpen] = useState<string | null>(null)
  const [focusAt, setFocusAt] = useState(0)
  // Everything the frame loop reads, kept in one place so a knob or the toggle never rebuilds the globe
  const st = useRef({ lon: mode === "flat" ? FLAT_LON : face.lon, tilt: look.tilt == null || face !== FACE ? face.tilt : look.tilt * RAD, m: mode === "flat" ? 0 : 1, vLon: 0, vTilt: 0, drag: null as null | { id: number; x: number; y: number; t: number }, touched: -Infinity, clock: 0, morphing: false, dirty: true })
  const live = useRef({ arcs, style, open, inks, tune, chapters })
  live.current = { arcs, style, open, inks, tune, chapters }
  // A new line style, crowd or travelling icon draws the lines again from the start; any other tuning redraws
  useEffect(() => { st.current.clock = 0; st.current.dirty = true }, [style, arcs, tune.icon])
  useEffect(() => { st.current.dirty = true }, [tune.land, tune.grain, tune.weight, tune.iconSize])

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
    setState("painting")
    el.style.setProperty("--x-g24-guest", inks.guest)
    const phone = matchMedia("(pointer: coarse)").matches
    const countries = [...new Set([...SAMPLE_JOURNEYS.map((c) => c.country), "AU", "CA", "JP", "NZ"])]
    // The paper goes on the page first (empty) while the look paints, then gets its picture
    const painting = pictureOf(look, night, phone ? 1024 : 2048, countries, inks)
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
        const [picture, mask] = await Promise.all([painting, maskOf()])
        if (!alive) return
        await breathe(picture.getContext("2d"))
        paper.setMask(mask)
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
          const { arcs, style, open, inks, tune, chapters: chapterList } = live.current
          const dur = tune.icon !== "none" || travels(style) ? 2.2 : 1.2
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
          paper.tune(tune.land, tune.grain)
          paper.render(s)
          g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h)
          // The ink rim, as the paper becomes a ball
          if (look.rim && s.m > 0.85) {
            const R = (Math.tan(Math.asin(1 / DIST)) / TAN) * (h / 2)
            g.globalAlpha = (s.m - 0.85) / 0.15; g.strokeStyle = inks.ink; g.lineWidth = look.rim
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
            const o = { colour: inks[trip.kind], width: WIDTH[trip.kind] * tune.weight, ink: inks.ink, paper: inks.paper, head: !reduce, time: s.clock, icon: tune.icon, iconSize: tune.iconSize }
            g.globalAlpha = trip.kind === "guest" ? 0.7 : 1
            // The household's own line gets a soft darker edge under it, so the gold holds on pale paper
            if (trip.kind === "you") { g.globalAlpha = 0.25; drawLine(g, style, xs, ys, al, n, N, { ...o, colour: inks.ink, width: o.width + 2, head: false }); g.globalAlpha = 1 }
            if (glow?.line) {
              g.globalCompositeOperation = glow.blend; g.globalAlpha = glow.line * (trip.kind === "guest" ? 0.7 : 1)
              drawLine(g, style, xs, ys, al, n, N, { ...o, halo: true, head: false })
              g.globalCompositeOperation = "source-over"; g.globalAlpha = trip.kind === "guest" ? 0.7 : 1
            }
            drawLine(g, style, xs, ys, al, n, N, o)
          }
          g.globalAlpha = 1
          // The names and dots, pinned to their places; hidden round the back of the globe
          // Run 26c: nudge moves a mark off a taken spot (screen px), with an ink hairline back to its real place
          const marksAt = (id: string, la: number, lo: number, nudge?: [number, number]) => {
            const m = marks.current.get(id)
            place(la * RAD, wrap(lo * RAD - s.lon), 0.004, s.m, s.tilt, pt); project(pt, w, h, px)
            const off = (globe && hidden(pt)) || px[0] < -4 || px[0] > w + 4 || px[1] < -4 || px[1] > h + 4
            if (nudge && !off) {
              g.globalAlpha = 0.55; g.strokeStyle = inks.ink; g.lineWidth = 0.8; g.setLineDash([])
              g.beginPath(); g.moveTo(px[0], px[1]); g.lineTo(px[0] + nudge[0], px[1] + nudge[1]); g.stroke(); g.globalAlpha = 1
              px[0] += nudge[0]; px[1] += nudge[1]
            }
            if (m) {
              m.style.transform = `translate3d(${px[0].toFixed(1)}px, ${px[1].toFixed(1)}px, 0)`
              const vis = off ? "hidden" : "visible"
              if (m.style.visibility !== vis) m.style.visibility = vis
              if (m.dataset.side !== (px[0] > w * 0.62 ? "left" : "right")) m.dataset.side = px[0] > w * 0.62 ? "left" : "right"
            }
            return off
          }
          marksAt("kyoto", KYOTO.lat, KYOTO.lon)
          for (const c of chapterList) marksAt(`ch-${c.key}`, c.at.lat, c.at.lon, c.nudge)
          for (const { trip } of arcs) if (trip.to && trip.toLabel) marksAt(`${trip.id}-to`, trip.to.lat, trip.to.lon)
          for (const { trip } of arcs) {
            const off = marksAt(trip.id, trip.lat, trip.lon, trip.nudge)
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
    // inks changes with the look and the theme (GlobeLab reads them once each is on the page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inks, reduce])
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
  const ref = (id: string) => (n: HTMLElement | null) => { if (n) marks.current.set(id, n); else marks.current.delete(id) }
  // The shadow slider: one drop shadow on the paper and the lines together (it follows the globe's or the map's edge)
  const shadow = tune.shadow > 0 ? `drop-shadow(0 ${(2 + 8 * tune.shadow).toFixed(1)}px ${(3 + 16 * tune.shadow).toFixed(1)}px rgb(0 0 0 / ${(0.55 * tune.shadow).toFixed(2)}))` : undefined
  return (
    <div ref={box} className={`${P}-box`} data-size={size} data-mode={mode} tabIndex={0} role="group" aria-roledescription="map" aria-label={`${t.journey.title}, ${label.toLowerCase()}. Drag, or use the arrow keys, to turn it.`} onKeyDown={(e) => { if (e.key === "Escape") setOpen(null) }}>
      <div ref={art} className={`${P}-art`} style={{ filter: shadow }}><canvas ref={layer} aria-hidden /></div>
      {look.decor}
      {inset && <KyotoInset />}
      <div className={`${P}-marks`}>
        {kyoto && <div ref={ref("kyoto")} className={`${P}-mark`} aria-hidden><span className={`${P}-kyoto`}><span className={`${P}-seal`} /><span className={`${P}-name`}>{t.journey.kyotoPin}</span></span></div>}
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
          <div key={x.id} ref={ref(x.id)} className={`${P}-mark`} aria-hidden>
            {x.badge ? <span className={`${P}-badge`} style={{ "--b": inks[x.kind] } as CSSProperties}>{x.badge}</span> : <span className={`${P}-pip`} />}<span className={`${P}-name`}>{x.label}</span>
          </div>
        ))}
        {list.filter((x, i, all) => x.to && x.toLabel && all.findIndex((y) => y.toLabel === x.toLabel) === i && !(kyoto && x.toLabel === "Kyoto")).map((x) => (
          <div key={`${x.id}-to`} ref={ref(`${x.id}-to`)} className={`${P}-mark`} aria-hidden><span className={`${P}-pip`} /><span className={`${P}-name`}>{x.toLabel}</span></div>
        ))}
        {chapters.length > 0 && (
          <div role="group" aria-label="The story's places">
            {chapters.map((c) => (
              <div key={c.key} ref={ref(`ch-${c.key}`)} className={`${P}-mark`}>
                <button type="button" className={`${P}-ch`} aria-haspopup="dialog" aria-label={`${c.year ? `${c.year}, ` : ""}${c.title}, ${c.place}. Explain its line`} title={`${c.title}, ${c.place}`} onClick={(e) => onChapter?.(c.key, e.currentTarget)} />
              </div>
            ))}
          </div>
        )}
        {openTrip && <div ref={tip} className={`${P}-tip`} role="status">{openTrip.label}</div>}
      </div>
      {state !== "ready" && <p className={`${P}-wait`} aria-live="polite">{state === "failed" ? "No WebGL here: the site falls back to its flat map." : "Painting the globe…"}</p>}
    </div>
  )
}

/**
 * Run 26c: Kyoto close up, in the map's corner, so every place shows at once: at world scale the venue, the pagoda and
 * the stations all sit on Kyoto's one pixel. The venue map's places at their real spots (about 3.5 km across), the main
 * ones named, the rest named on hover and in its label. Still: it never turns with the world.
 */
const BOUNDS = { n: 35.0125, s: 34.9775, w: 135.7535, e: 135.7955 }
function KyotoInset() {
  const x = (lon: number) => 8 + ((lon - BOUNDS.w) / (BOUNDS.e - BOUNDS.w)) * 84
  const y = (lat: number) => 14 + ((BOUNDS.n - lat) / (BOUNDS.n - BOUNDS.s)) * 78
  const label = `Kyoto close up: ${KYOTO_PLACES.map((p) => p.name).join(", ")}`
  return (
    <figure className={`${P}-inset`} role="img" aria-label={label} onPointerDown={(e) => e.stopPropagation()}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <text className="t" x={6} y={9}>Kyoto close up</text>
        {/* The Kamo river, roughly, for a sense of place */}
        <path d={`M${x(135.7712)} ${y(35.0125)} L${x(135.7716)} ${y(35.003)} L${x(135.7695)} ${y(34.99)} L${x(135.7672)} ${y(34.9775)}`} fill="none" stroke="var(--line-hairline)" strokeWidth={2.4} strokeLinecap="round" />
        {KYOTO_PLACES.map((p) => {
          const cx = x(p.lon), cy = y(p.lat), lines = p.short?.split(" / ") ?? [], [dx, dy, anchor] = p.lab ?? [5, 2, "start"]
          const tx = cx + dx, ty = cy + dy
          return (
            <g key={p.id}>
              <title>{p.name}</title>
              {p.venue ? <rect x={cx - 3} y={cy - 3} width={6} height={6} rx={1} transform={`rotate(45 ${cx} ${cy})`} fill="var(--action)" stroke="var(--letter-bg)" strokeWidth={1} />
                : <circle cx={cx} cy={cy} r={p.short ? 2.4 : 1.7} fill={p.short ? "var(--ink-story, var(--ink))" : "var(--ink-soft)"} stroke="var(--letter-bg)" strokeWidth={0.8} />}
              {p.short && <text x={tx} y={ty} textAnchor={anchor}>{lines.map((l, i) => <tspan key={l} x={tx} dy={i ? 7 : 0}>{l}</tspan>)}</text>}
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
