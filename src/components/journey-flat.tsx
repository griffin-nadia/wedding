import type React from "react"
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react"
import { arc } from "@/lib/journey"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import type { City } from "@/lib/city-search"
import { bundle, nearHome, PACE, type ChapterPin, type Place } from "@/lib/journey-names"
import { ChapterPins } from "@/components/chapter-pins"
import { cn } from "@/lib/utils"

/**
 * The flat map beside the globe (run 19): the globe's own painting (src/lib/paint-globe.ts: every country a soft
 * wash, the home four and every guest's country with painted edges), cut to the Pacific, from 90°E to 100°W and
 * 72°N to 64°S, so Australia, New Zealand, Japan, Canada, Fiji and Hawaii are all on it at true scale. A city outside
 * that comes in from the nearer edge. Over it, the same lines as the globe: Nadia's and Griffin's first, then every
 * other coming household's city, faint and dotted, then this household's own in gold, last. Kyoto under its seal.
 * Reduced motion: every line already drawn (the site's journey CSS). The legend sits under it (Our story's last stop).
 * Run 25: the canvas starts at the painting's own size (it was the default 300 × 150 until painted), the chapter pins
 * sit over it as on the globe, and a household flying from beside Brisbane or Victoria gets a flatter curve than the
 * home line, so both read.
 */
const FRAME = { west: 90, east: 260, north: 72, south: -64 } // 170° by 136°: the 400 × 320 viewBox, 5:4
const KYOTO: [number, number] = [35.01, 135.77], BRISBANE: [number, number] = [-27.47, 153.03], VICTORIA: [number, number] = [48.43, -123.37]
const SPAN = FRAME.east - FRAME.west, TALL = FRAME.north - FRAME.south
/** The painting's pixels per degree (2048 wide for 360°), so the canvas has its final size from the first frame */
const PX = 2048 / 360, ART_W = Math.round(SPAN * PX), ART_H = Math.round(TALL * PX)

/** A place on the flat map (viewBox 400 × 320); outside the frame, on the nearer edge */
export function flatPoint([lat, lon]: [number, number]): [number, number] {
  let u = lon < 0 ? lon + 360 : lon
  if (u > FRAME.east) u = u - FRAME.east < FRAME.west + 360 - u ? FRAME.east : FRAME.west
  if (u < FRAME.west) u = FRAME.west
  const x = ((u - FRAME.west) / SPAN) * 400, y = ((FRAME.north - lat) / TALL) * 320
  return [Math.max(4, Math.min(396, x)), Math.max(4, Math.min(316, y))]
}

/** Run 25: where a tap on the map is (the viewBox's x and y back to latitude and longitude), for "Drop a pin instead" */
function flatLatLon(x: number, y: number): [number, number] {
  const u = FRAME.west + (x / 400) * SPAN, lat = FRAME.north - (y / 320) * TALL
  return [Math.round(lat * 100) / 100, Math.round((u > 180 ? u - 360 : u) * 100) / 100]
}

/** Run 26: the zoom range (the globe's), and the view: the zoom and the viewBox's top left corner */
const Z = { min: 1, max: 3 }
type View = { z: number; x: number; y: number }
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const fit = (z: number, x: number, y: number): View => { z = clamp(z, Z.min, Z.max); return { z, x: clamp(x, 0, 400 - 400 / z), y: clamp(y, 0, 320 - 320 / z) } }
/** Zoom to z about a point of the box (fx, fy from 0 to 1), that point staying put */
const zoomAbout = (v: View, z: number, fx: number, fy: number) => { const nz = clamp(z, Z.min, Z.max); return fit(nz, v.x + fx * (400 / v.z) - fx * (400 / nz), v.y + fy * (320 / v.z) - fy * (320 / nz)) }
/** The paper plane (24 × 24, pointing right), the globe's own */
const PLANE_D = "M2 11.5 22 3l-6.5 18-4-7.5z"

/** Run 26: a paper plane flown once along a line as it draws (SMIL, started on mount so a line drawn later, like a
 *  newly picked city's, gets its flight too). Not drawn at all under reduced motion. */
function FlatPlane({ d, delay, dur, k, kind, run }: { d: string; delay: number; dur: number; k: number; kind: string; run: boolean }) {
  const g = useRef<SVGGElement>(null)
  useEffect(() => { if (run) g.current?.querySelectorAll<SVGAnimationElement>("animate, animateMotion").forEach((a) => { try { a.beginElementAt(delay / 1000) } catch { /* no SMIL */ } }) }, [d, delay, run])
  const timing = { begin: "indefinite", dur: `${dur}ms`, fill: "freeze" as const }
  return (
    <g ref={g} aria-hidden className={`journey-plane journey-plane-${kind}`} opacity={0}>
      <g transform={`scale(${k}) translate(-7 -7) scale(${14 / 24})`}><path d={PLANE_D} /><path d="M22 3 11.5 13.5" className="journey-plane-fold" /></g>
      {/* --ease-paper, the line's own reveal */}
      <animateMotion path={d} rotate="auto" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.22 1 0.36 1" {...timing} />
      <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.85;1" {...timing} />
    </g>
  )
}

export function JourneyFlat({ you, cities, label, children, pins = [], onPin, onPick, zoomable = false, zoomRef }: { you: City | null; cities: { lat: number; lon: number; n: number; country?: string; name?: string }[]; label: string; children?: ReactNode; pins?: ChapterPin[]; onPin?: (key: string) => void
  /** Run 25: set while the guest is dropping a pin; a tap on the map gives its latitude and longitude */
  onPick?: (lat: number, lon: number) => void
  /** Run 26, the full-screen map: pinch, Ctrl or Cmd with the wheel, and the view's + and − (zoomRef), 1x to 3x; a
   *  finger or the mouse moves it about once zoomed in */
  zoomable?: boolean; zoomRef?: RefObject<((f: number) => void) | null> }) {
  const { t, lang } = useLang()
  const [tipAt, setTipAt] = useState<number | null>(null)
  const { theme } = useTheme()
  const id = useId().replace(/:/g, "")
  const art = useRef<HTMLCanvasElement>(null)
  // Run 26: the lines draw (and the planes fly) once the map is on screen and its stop showing, not at mount, so a
  // map on a stop further on (the journey stop on phones) isn't drawn where no one sees it
  const [shown, setShown] = useState(false)
  const [still] = useState(() => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)
  // Run 25: names, dots, the seal and the lines keep their size on screen when the map is drawn bigger (full screen):
  // k is the viewBox units per screen px, never above 1, so the stop's map stays as it was
  const box = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => { const w = el.clientWidth; if (w) setK(Math.min(1, Math.round((400 / w) * 100) / 100)) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Run 26: the zoom. The viewBox shows part of the map and the painting moves with it; names, lines and pins keep
  // their size on screen (kz), so one line weight per kind whatever the zoom
  const [view, setView] = useState<View>({ z: 1, x: 0, y: 0 })
  const now = useRef(view)
  now.current = view
  const kz = k / view.z
  useEffect(() => {
    if (!zoomRef) return
    let raf = 0
    // The + and −: about the middle, eased over 200 ms (at once under reduced motion)
    zoomRef.current = (f) => {
      cancelAnimationFrame(raf)
      const from = now.current, to = zoomAbout(from, from.z * f, 0.5, 0.5), t0 = performance.now()
      if (still) return setView(to)
      const step = (t: number) => {
        const s = Math.min(1, (t - t0) / 200), e = 1 - Math.pow(1 - s, 3)
        setView(fit(from.z + (to.z - from.z) * e, from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e))
        if (s < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    return () => { cancelAnimationFrame(raf); zoomRef.current = null }
  }, [zoomRef, still])
  // Ctrl or Cmd with the wheel (a trackpad pinch sends that too) zooms about the pointer; a plain scroll isn't taken
  useEffect(() => {
    const el = box.current
    if (!el || !zoomable) return
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      setView((v) => zoomAbout(v, v.z * Math.exp(-e.deltaY * 0.01), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height))
    }
    el.addEventListener("wheel", wheel, { passive: false })
    return () => el.removeEventListener("wheel", wheel)
  }, [zoomable])
  // Two fingers pinch (about their middle); one finger or the mouse drags once zoomed. A drag isn't a tap on a pin.
  const fingers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ kind: "pinch" | "drag"; d: number; x: number; y: number; v: View } | null>(null)
  const moved = useRef(false)
  const spread = () => { const [a, b] = [...fingers.current.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  const gestures = zoomable ? {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved.current = false
      if (fingers.current.size === 2) { const s = spread(); gesture.current = { kind: "pinch", d: s.d, x: s.x, y: s.y, v: now.current } }
      else if (fingers.current.size === 1) gesture.current = { kind: "drag", d: 0, x: e.clientX, y: e.clientY, v: now.current }
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      const g = gesture.current, el = box.current
      if (!g || !el || !fingers.current.has(e.pointerId)) return
      fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const r = el.getBoundingClientRect()
      if (g.kind === "pinch" && fingers.current.size === 2) {
        const s = spread(); moved.current = true
        setView(zoomAbout(g.v, g.v.z * (s.d / Math.max(1, g.d)), (g.x - r.left) / r.width, (g.y - r.top) / r.height))
      } else if (g.kind === "drag" && g.v.z > 1) {
        const dx = e.clientX - g.x, dy = e.clientY - g.y
        if (!moved.current && Math.hypot(dx, dy) < 6) return
        if (!moved.current) el.setPointerCapture(e.pointerId)
        moved.current = true
        setView(fit(g.v.z, g.v.x - (dx / r.width) * (400 / g.v.z), g.v.y - (dy / r.height) * (320 / g.v.z)))
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => { fingers.current.delete(e.pointerId); if (!fingers.current.size) gesture.current = null; else if (gesture.current?.kind === "pinch") gesture.current = null },
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => { fingers.current.delete(e.pointerId); gesture.current = null },
    onClickCapture: (e: React.MouseEvent) => { if (moved.current) { e.stopPropagation(); moved.current = false } },
  } : {}
  useEffect(() => {
    let alive = true
    const countries = [...cities.map((c) => c.country ?? ""), you?.country ?? ""].filter(Boolean)
    // The painting is heavy (the whole world at 2048): only once the map is on screen, so a story opened on its
    // first stop with the flat map remembered isn't held up by a map four stops away
    const paint = () => void import("@/lib/paint-globe").then(async ({ paintGlobe, GLOBE_LOOK }) => {
      // Run 26: the globe's own painting at the globe's size (1024 on phones), so on a phone the map reuses the one
      // the globe has already painted instead of painting the world again at 2048 (on CI's software GL phone that
      // second paint held the page for about 15 s; on a phone it's the same picture, so the same assets in both views)
      const src = await paintGlobe(GLOBE_LOOK.map, matchMedia("(pointer: coarse)").matches ? 1024 : 2048, countries)
      const c = art.current
      if (!alive || !c) return
      // The painting runs -180° to 180°; the frame crosses the date line, so it's drawn twice, a world apart
      const px = src.width / 360, g = c.getContext("2d")!
      c.width = Math.round(SPAN * px); c.height = Math.round(TALL * px)
      for (const shift of [0, 360]) g.drawImage(src, (-180 + shift - FRAME.west) * px, (FRAME.north - 90) * px)
    }).catch(() => { /* the lines still show on the paper */ })
    // On screen and its story stop showing (stops lie on top of each other under reduced motion, so "on screen"
    // alone would paint it on load)
    const el = art.current
    if (!el || typeof IntersectionObserver === "undefined") { paint(); setShown(true); return () => { alive = false } }
    const stop = el.closest("[inert]")
    let onScreen = false, done = false
    const go = () => { if (done || !onScreen || stop?.hasAttribute("inert")) return; done = true; seen.disconnect(); unhid.disconnect(); setShown(true); paint() }
    const seen = new IntersectionObserver((e) => { onScreen = e.some((x) => x.isIntersecting); go() })
    const unhid = new MutationObserver(go)
    seen.observe(el)
    if (stop) unhid.observe(stop, { attributes: true, attributeFilter: ["inert"] })
    return () => { alive = false; seen.disconnect(); unhid.disconnect() }
  }, [cities, you, theme])
  const kyoto = flatPoint(KYOTO)
  // The same naming and bundling as the globe (lib/journey-names.ts)
  const guests = bundle(cities.filter((c) => c.n > 0).map((c) => ({ name: c.name ?? "", country: c.country ?? "", lat: c.lat, lon: c.lon, n: c.n }) as Place), lang, t.journey.households)
  const others = guests.map((c) => flatPoint([c.lat, c.lon]))
  // Their own line, unless they're in Kyoto already (no line to draw)
  const mine = you && you.id !== "jp" && you.lat != null && you.lon != null && Math.hypot(you.lat - KYOTO[0], you.lon - KYOTO[1]) > 0.5 ? flatPoint([you.lat, you.lon]) : null
  // Beside a home line's start, their line bows the other way, so the two part and both read
  const mineLift = you?.lat != null && you.lon != null && nearHome(you.lat, you.lon) ? -0.1 : 0.25
  // Run 26c: every time here is run 26's times PACE (journey-names.ts), set on each line, so the planes keep pace
  const ms = (x: number) => Math.round(x * PACE)
  const youDelay = ms(900 + others.length * 120)
  const line = (from: [number, number], lift: number) => arc(from, kyoto, lift)
  // The lines and when each draws: the home lines 300 and 600 ms in over 900, guests 120 apart over 700 (times PACE)
  const flights = [
    { d: line(flatPoint(BRISBANE), 0.25), delay: ms(300), dur: ms(900), kind: "nadia" }, { d: line(flatPoint(VICTORIA), 0.25), delay: ms(600), dur: ms(900), kind: "griffin" },
    ...others.map((p, i) => ({ d: line(p, 0.15), delay: ms(900 + i * 120), dur: ms(700), kind: "guest" })),
    ...(mine ? [{ d: line(mine, mineLift), delay: youDelay, dur: ms(900), kind: "you" }] : []),
  ]
  const vw = 400 / view.z, vh = 320 / view.z
  return (
    <div ref={box} className={cn("journey-flat", onPick && "is-picking")} data-theme="lantern" data-zoomed={view.z > 1 || undefined} {...gestures} onClick={onPick ? (e) => {
      const r = e.currentTarget.querySelector("svg")!.getBoundingClientRect()
      onPick(...flatLatLon(view.x + ((e.clientX - r.left) / r.width) * vw, view.y + ((e.clientY - r.top) / r.height) * vh))
    } : undefined}>
        <canvas ref={art} aria-hidden className="journey-flat-art" width={ART_W} height={ART_H}
          style={view.z > 1 ? { transform: `scale(${view.z}) translate(${(-view.x / 4).toFixed(3)}%, ${(-view.y / 3.2).toFixed(3)}%)` } : undefined} />
        <svg viewBox={`${view.x} ${view.y} ${vw} ${vh}`} role="img" aria-label={label} className={cn("journey journey-hifi journey-flat-lines", shown && "is-in")} style={{ "--k": kz } as CSSProperties}>
          <defs>
            {[flatPoint(BRISBANE), flatPoint(VICTORIA), ...others].map((p, i) => (
              <mask key={i} id={`${id}-m${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320">
                <path d={line(p, i < 2 ? 0.25 : 0.15)} className={i === 0 ? "journey-reveal" : i === 1 ? "journey-reveal journey-reveal-2" : "journey-reveal journey-reveal-guest"} style={{ animationDelay: `${flights[i].delay}ms`, animationDuration: `${flights[i].dur}ms` }} pathLength={1} />
              </mask>
            ))}
          </defs>
          {/* Run 26: no pathLength on the lines, so their dots and dashes are px on screen, the globe's */}
          <path d={line(flatPoint(BRISBANE), 0.25)} className="journey-route journey-route-nadia" mask={`url(#${id}-m0)`} />
          <path d={line(flatPoint(VICTORIA), 0.25)} className="journey-route journey-route-griffin" mask={`url(#${id}-m1)`} />
          {others.map((p, i) => <path key={i} d={line(p, 0.15)} className={guests[i].bundled ? "journey-guest journey-guest-bundle" : "journey-guest"} mask={`url(#${id}-m${i + 2})`} />)}
          {/* Brisbane and Victoria always named (run 24); Brisbane's to its right (run 25), clear of Australia's chapter pin */}
          <g aria-hidden className="journey-flat-names">
            {/* Run 26c: who's from there, a G or an N in their line's colour beside the place (the globe's marks) */}
            <g transform={`translate(${flatPoint(BRISBANE)[0]} ${flatPoint(BRISBANE)[1]}) scale(${kz})`}>
              <rect x={5} y={-7} width={14} height={14} rx={3.5} className="home-mark-nadia" /><text x={12} y={3.5} textAnchor="middle" className="home-mark-letter">N</text>
              <text x={23} y={4} className="journey-place journey-flat-home">{t.journey.from.nadia}</text>
            </g>
            <g transform={`translate(${flatPoint(VICTORIA)[0]} ${flatPoint(VICTORIA)[1]}) scale(${kz})`}>
              <rect x={-19} y={-7} width={14} height={14} rx={3.5} className="home-mark-griffin" /><text x={-12} y={3.5} textAnchor="middle" className="home-mark-letter">G</text>
              <text x={-23} y={4} textAnchor="end" className="journey-place journey-flat-home">{t.journey.from.griffin}</text>
            </g>
          </g>
          {/* Each guest line's start: its name on hover or tap (a city only with 2+ households, else the country) */}
          {others.map((p, i) => (
            <g key={`t${i}`} className="journey-flat-hit" onPointerEnter={() => setTipAt(i)} onPointerLeave={() => setTipAt((x) => (x === i ? null : x))} onClick={() => setTipAt(i)}>
              <circle cx={p[0]} cy={p[1]} r={11 * kz} fill="transparent" />
              <circle cx={p[0]} cy={p[1]} r={2.2 * kz} className="journey-flat-dot" />
            </g>
          ))}
          {tipAt !== null && others[tipAt] && (
            <text aria-hidden x={others[tipAt][0]} y={others[tipAt][1] - 9 * kz} textAnchor="middle" className="journey-place journey-flat-tip">{guests[tipAt].label}</text>
          )}
          {mine && <path key={String(you!.id)} d={line(mine, mineLift)} className="journey-you journey-you-edge" pathLength={1} style={{ animationDelay: `${youDelay}ms`, animationDuration: `${ms(900)}ms` }} />}
          {mine && <path key={`${you!.id}-line`} d={line(mine, mineLift)} className="journey-you" pathLength={1} style={{ animationDelay: `${youDelay}ms`, animationDuration: `${ms(900)}ms` }} />}
          {mine && <circle cx={mine[0]} cy={mine[1]} r={4 * kz} className="journey-you-dot" />}
          {!still && flights.map((f) => <FlatPlane key={`${f.kind}:${f.d}`} {...f} k={kz} run={shown} />)}
          <g aria-hidden transform={`translate(${kyoto[0]} ${kyoto[1]}) scale(${kz})`} className="journey-flat-pin">
            <rect x={-11} y={-11} width="22" height="22" rx="5" className="journey-seal" />
            <text x={0} y={5} textAnchor="middle" className="journey-seal-text journey-flat-seal">京</text>
            <text x={11} y={-16} textAnchor="end" className="journey-place journey-flat-kyoto">{t.journey.kyotoPin}</text>
          </g>
      </svg>
      <ChapterPins pins={pins} onPin={onPin} at={(p) => { const [x, y] = flatPoint(p.at); return [((x - view.x) / vw) * 100, ((y - view.y) / vh) * 100] }} />
      {children}
    </div>
  )
}
