import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { arc } from "@/lib/journey"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import type { City } from "@/lib/city-search"
import { bundle, nearHome, type ChapterPin, type Place } from "@/lib/journey-names"
import { ChapterPins } from "@/components/chapter-pins"

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

export function JourneyFlat({ you, cities, label, children, pins = [], onPin }: { you: City | null; cities: { lat: number; lon: number; n: number; country?: string; name?: string }[]; label: string; children?: ReactNode; pins?: ChapterPin[]; onPin?: (key: string) => void }) {
  const { t, lang } = useLang()
  const [tipAt, setTipAt] = useState<number | null>(null)
  const { theme } = useTheme()
  const id = useId().replace(/:/g, "")
  const art = useRef<HTMLCanvasElement>(null)
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
  useEffect(() => {
    let alive = true
    const countries = [...cities.map((c) => c.country ?? ""), you?.country ?? ""].filter(Boolean)
    // The painting is heavy (the whole world at 2048): only once the map is on screen, so a story opened on its
    // first stop with the flat map remembered isn't held up by a map four stops away
    const paint = () => void import("@/lib/paint-globe").then(async ({ paintGlobe, GLOBE_LOOK }) => {
      const src = await paintGlobe(theme === "lantern" ? GLOBE_LOOK.night : GLOBE_LOOK.day, 2048, countries)
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
    if (!el || typeof IntersectionObserver === "undefined") { paint(); return () => { alive = false } }
    const stop = el.closest("[inert]")
    let onScreen = false, done = false
    const go = () => { if (done || !onScreen || stop?.hasAttribute("inert")) return; done = true; seen.disconnect(); shown.disconnect(); paint() }
    const seen = new IntersectionObserver((e) => { onScreen = e.some((x) => x.isIntersecting); go() })
    const shown = new MutationObserver(go)
    seen.observe(el)
    if (stop) shown.observe(stop, { attributes: true, attributeFilter: ["inert"] })
    return () => { alive = false; seen.disconnect(); shown.disconnect() }
  }, [cities, you, theme])
  const kyoto = flatPoint(KYOTO)
  // The same naming and bundling as the globe (lib/journey-names.ts)
  const guests = bundle(cities.filter((c) => c.n > 0).map((c) => ({ name: c.name ?? "", country: c.country ?? "", lat: c.lat, lon: c.lon, n: c.n }) as Place), lang, t.journey.households)
  const others = guests.map((c) => flatPoint([c.lat, c.lon]))
  // Their own line, unless they're in Kyoto already (no line to draw)
  const mine = you && you.id !== "jp" && you.lat != null && you.lon != null && Math.hypot(you.lat - KYOTO[0], you.lon - KYOTO[1]) > 0.5 ? flatPoint([you.lat, you.lon]) : null
  // Beside a home line's start, their line bows the other way, so the two part and both read
  const mineLift = you?.lat != null && you.lon != null && nearHome(you.lat, you.lon) ? -0.1 : 0.25
  const youDelay = 900 + others.length * 120
  const line = (from: [number, number], lift: number) => arc(from, kyoto, lift)
  return (
    <div ref={box} className="journey-flat">
        <canvas ref={art} aria-hidden className="journey-flat-art" width={ART_W} height={ART_H} />
        <svg viewBox="0 0 400 320" role="img" aria-label={label} className="journey is-in journey-hifi journey-flat-lines" style={{ "--k": k } as CSSProperties}>
          <defs>
            {[flatPoint(BRISBANE), flatPoint(VICTORIA), ...others].map((p, i) => (
              <mask key={i} id={`${id}-m${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320">
                <path d={line(p, i < 2 ? 0.25 : 0.15)} className={i === 0 ? "journey-reveal" : i === 1 ? "journey-reveal journey-reveal-2" : "journey-reveal journey-reveal-guest"} style={i > 1 ? { animationDelay: `${900 + (i - 2) * 120}ms` } : undefined} pathLength={1} />
              </mask>
            ))}
          </defs>
          <path d={line(flatPoint(BRISBANE), 0.25)} className="journey-route journey-route-nadia" pathLength={1} mask={`url(#${id}-m0)`} />
          <path d={line(flatPoint(VICTORIA), 0.25)} className="journey-route journey-route-griffin" pathLength={1} mask={`url(#${id}-m1)`} />
          {others.map((p, i) => <path key={i} d={line(p, 0.15)} className={guests[i].bundled ? "journey-guest journey-guest-bundle" : "journey-guest"} mask={`url(#${id}-m${i + 2})`} />)}
          {/* Brisbane and Victoria always named (run 24); Brisbane's to its right (run 25), clear of Australia's chapter pin */}
          <g aria-hidden className="journey-flat-names">
            <text x={flatPoint(BRISBANE)[0] + 6 * k} y={flatPoint(BRISBANE)[1] + 4 * k} className="journey-place">{t.journey.brisbane}</text>
            <text x={flatPoint(VICTORIA)[0] - 6 * k} y={flatPoint(VICTORIA)[1] + 4 * k} textAnchor="end" className="journey-place">{t.journey.victoria}</text>
          </g>
          {/* Each guest line's start: its name on hover or tap (a city only with 2+ households, else the country) */}
          {others.map((p, i) => (
            <g key={`t${i}`} className="journey-flat-hit" onPointerEnter={() => setTipAt(i)} onPointerLeave={() => setTipAt((x) => (x === i ? null : x))} onClick={() => setTipAt(i)}>
              <circle cx={p[0]} cy={p[1]} r={11 * k} fill="transparent" />
              <circle cx={p[0]} cy={p[1]} r={2.2 * k} className="journey-flat-dot" />
            </g>
          ))}
          {tipAt !== null && others[tipAt] && (
            <text aria-hidden x={others[tipAt][0]} y={others[tipAt][1] - 9 * k} textAnchor="middle" className="journey-place journey-flat-tip">{guests[tipAt].label}</text>
          )}
          {mine && <path key={String(you!.id)} d={line(mine, mineLift)} className="journey-you journey-you-edge" pathLength={1} style={{ animationDelay: `${youDelay}ms` }} />}
          {mine && <path key={`${you!.id}-line`} d={line(mine, mineLift)} className="journey-you" pathLength={1} style={{ animationDelay: `${youDelay}ms` }} />}
          {mine && <circle cx={mine[0]} cy={mine[1]} r={4 * k} className="journey-you-dot" />}
          <g aria-hidden transform={`translate(${kyoto[0]} ${kyoto[1]}) scale(${k})`} className="journey-flat-pin">
            <rect x={-11} y={-11} width="22" height="22" rx="5" className="journey-seal" />
            <text x={0} y={5} textAnchor="middle" className="journey-seal-text journey-flat-seal">京</text>
            <text x={11} y={-16} textAnchor="end" className="journey-place journey-flat-kyoto">{t.journey.kyotoPin}</text>
          </g>
      </svg>
      <ChapterPins pins={pins} onPin={onPin} at={(p) => { const [x, y] = flatPoint(p.at); return [x / 4, y / 3.2] }} />
      {children}
    </div>
  )
}
