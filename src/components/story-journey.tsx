import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getFlying, type Flying } from "@/lib/api"
import { FlyingFrom } from "@/components/flying-from"
import type { Chapter } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

// The hand-drawn map (Figma D1 / M2, "Journey map · hi-fi concept"): soft land, Kyoto as a 京 seal, Nadia's line
// from Brisbane and Griffin's from Canada. Stylised, not to scale. viewBox 400 × 320.
const KYOTO: [number, number] = [132, 112]
const PLACES: Record<string, [number, number]> = {
  brisbane: [196, 272], canada: [318, 46], kyoto: KYOTO, japan: [150, 96], melbourne: [160, 296], sydney: [186, 288], perth: [70, 280], adelaide: [132, 290],
}
const FLY: Partial<Record<Flying, [number, number]>> = { Brisbane: PLACES.brisbane, Sydney: PLACES.sydney, Melbourne: PLACES.melbourne, Adelaide: PLACES.adelaide, Perth: PLACES.perth, "Elsewhere in Australia": [110, 262], Canada: PLACES.canada, "Already in Japan": [178, 74] }
const arc = ([x1, y1]: [number, number], [x2, y2]: [number, number], lift = 0.3) => {
  const mx = (x1 + x2) / 2 - Math.abs(y2 - y1) * lift, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * lift
  return `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`
}
/** Where a chapter sits: its title if it names a place, otherwise spread along Nadia's line. */
function placeOf(c: Chapter, i: number, n: number): [number, number] {
  const k = c.title.toLowerCase().split(/[ ,]/)[0]
  if (PLACES[k]) return PLACES[k]
  const t = n > 1 ? i / (n - 1) : 1, [x1, y1] = PLACES.brisbane
  return [x1 + (KYOTO[0] - x1) * t, y1 + (KYOTO[1] - y1) * t]
}

/**
 * Our story as a journey you can play with: pick a chapter (on the map or in the list) and its line draws in to
 * Kyoto and its stop lifts; the map's stops are buttons, arrow keys step through them, and "See as a list" shows
 * the same words plainly. Guests' Flying from lines (counts only, never names) join as faint dotted lines when on.
 * Phones: the map on top, one stop card under it with dots and Next stop. Still under reduced motion.
 */
export function StoryJourney({ chapters, showFlying = false, drag = false, token, replied = false }: { chapters: Chapter[]; showFlying?: boolean; drag?: boolean; token?: string; replied?: boolean }) {
  const { t } = useLang()
  const [on, setOn] = useState(0)
  const [list, setList] = useState(false)
  const [flying, setFlying] = useState<Awaited<ReturnType<typeof getFlying>>>(null)
  useEffect(() => { if (showFlying) void getFlying().then(setFlying) }, [showFlying])
  const svg = useRef<SVGSVGElement>(null)
  const [held, setHeld] = useState<[number, number] | null>(null)
  // Arrival (v3 R): the land washes in, the two home routes draw to Kyoto, the seal lands, then guests' lines one by one
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = svg.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setInView(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { rootMargin: "-10% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [list])
  // Where this household said they're flying from (kept on this device so the chips hide once answered)
  const flyKey = token ? `ng-flying:${token}` : ""
  const [picked, setPicked] = useState<Flying | null>(() => { try { return flyKey ? (localStorage.getItem(flyKey) as Flying | null) : null } catch { return null } })
  const [changing, setChanging] = useState(false)
  const chips = showFlying && Boolean(token) && replied && (!picked || changing)
  const onPicked = (city: Flying) => {
    try { if (flyKey) localStorage.setItem(flyKey, city) } catch { /* private mode */ }
    setPicked(city); setChanging(false)
    // Draw their line now rather than waiting for the counts cache (10 minutes)
    setFlying((f) => f ? { ...f, counts: { ...f.counts, [city]: (f.counts[city] ?? 0) + 1 }, told: f.told + 1 } : { counts: { [city]: 1 }, told: 1, households: 0 })
  }
  const n = chapters.length
  const go = (i: number) => { if (n) setOn((i + n) % n) }
  const pts = chapters.map((c, i) => placeOf(c, i, n))
  const c = chapters[on]
  if (list) return (
    <div className="flex flex-col gap-4">
      <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(false)}>{t.story.seeMap}</button>
      <ol className="flex flex-col gap-4">
        {chapters.map((ch) => <li key={ch.key} className="flex flex-col gap-1"><p className="text-sm text-muted-foreground">{ch.year}</p><p className="font-medium text-foreground">{ch.title}</p>{ch.body.map((p, k) => <p key={k}>{p}</p>)}</li>)}
      </ol>
    </div>
  )
  return (
    <div className={cn("journey", inView && "is-in")} onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(on + 1) } if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(on - 1) } }}>
      <svg ref={svg} viewBox="0 0 400 320" className="journey-map" role="group" aria-label={t.story.title} style={drag ? { touchAction: "none" } : undefined}>
        {/* land: Australia, Japan, a corner of Canada (soft, painted feel) */}
        <defs><pattern id="journey-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" className="journey-dot-grain" /></pattern></defs>
        <path className="journey-land" d="M60 236c26-30 82-40 118-30 30-14 60-2 74 22 12 24 0 50-24 64-34 18-90 20-128 8-36-12-60-34-40-64z" />
        <path className="journey-land journey-land-green" d="M120 150c8-20 22-34 30-52 8-16 20-30 34-38 8 8 0 22-8 32-12 16-22 32-34 48-8 12-18 18-22 10z" />
        <path className="journey-land" d="M300 6c30-10 70-6 96 6v70c-22 8-50 0-68-12-18-14-40-50-28-64z" />
        {/* Each line is revealed by a mask whose solid copy draws in (dotted strokes can't draw with dashoffset alone) */}
        <defs>
          <mask id="jm-nadia" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320"><path d={arc(PLACES.brisbane, KYOTO)} className="journey-reveal" pathLength={1} /></mask>
          <mask id="jm-griffin" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320"><path d={arc(PLACES.canada, KYOTO, 0.2)} className="journey-reveal journey-reveal-2" pathLength={1} /></mask>
          {flying && (Object.entries(flying.counts) as [Flying, number][]).filter(([city]) => FLY[city]).map(([city], i) => (
            <mask key={city} id={`jm-g-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320"><path d={arc(FLY[city]!, KYOTO, 0.15)} className="journey-reveal journey-reveal-guest" style={{ animationDelay: `${1500 + i * 120}ms` }} pathLength={1} /></mask>
          ))}
        </defs>
        {flying && (Object.entries(flying.counts) as [Flying, number][]).filter(([city]) => FLY[city]).map(([city], i) => (
          <g key={city}>
            <path d={arc(FLY[city]!, KYOTO, 0.15)} className="journey-guest" mask={`url(#jm-g-${i})`} />
            <circle cx={KYOTO[0]} cy={KYOTO[1]} r="6" className="journey-pulse" style={{ animationDelay: `${1500 + i * 120 + 500}ms` }} />
          </g>
        ))}
        <path d={arc(PLACES.brisbane, KYOTO)} className="journey-route journey-route-nadia" pathLength={1} mask="url(#jm-nadia)" />
        <path d={arc(PLACES.canada, KYOTO, 0.2)} className="journey-route journey-route-griffin" pathLength={1} mask="url(#jm-griffin)" />
        {pts[on] && <path key={`draw-${on}`} d={arc(pts[on], KYOTO, 0.25)} className="journey-draw" pathLength={1} />}
        {pts.map(([x, y], i) => (
          <g key={chapters[i].key} role="button" tabIndex={0} aria-label={chapters[i].title} aria-pressed={on === i}
            className={cn("journey-stop", on === i && "is-on")} transform={`translate(${x} ${y})`}
            onClick={() => setOn(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOn(i) } }}>
            <circle r="16" className="journey-hit" />
            <circle r="5" className="journey-dot" />
            <text y="-12" textAnchor="middle" className="journey-label">{chapters[i].title}</text>
          </g>
        ))}
        {/* Drag the seal (Options → Our story): it follows the finger and the nearest chapter opens as it passes */}
        {drag && n > 0 && (() => {
          const [x, y] = held ?? pts[on]
          const toSvg = (e: React.PointerEvent) => { const m = svg.current!.getScreenCTM()!.inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [p.x, p.y] as [number, number] }
          const nearest = ([px, py]: [number, number]) => pts.reduce((b, [sx, sy], i) => (Math.hypot(sx - px, sy - py) < Math.hypot(pts[b][0] - px, pts[b][1] - py) ? i : b), 0)
          return (
            <g aria-hidden className="journey-handle" transform={`translate(${x} ${y})`}
              onPointerDown={(e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); setHeld(toSvg(e)) }}
              onPointerMove={(e) => { if (!held) return; const p = toSvg(e); setHeld(p); setOn(nearest(p)) }}
              onPointerUp={() => setHeld(null)} onPointerCancel={() => setHeld(null)}>
              <circle r="18" className="journey-hit" />
              <circle r="9" className="journey-handle-dot" />
            </g>
          )
        })()}
        <g transform={`translate(${KYOTO[0] - 14} ${KYOTO[1] - 14})`} aria-hidden>
          <g className="journey-seal-g">
            <rect width="28" height="28" rx="6" className="journey-seal" />
            <text x="14" y="20" textAnchor="middle" className="journey-seal-text">京</text>
          </g>
        </g>
      </svg>
      <div className="journey-panel">
        <ol className="journey-cards">
          {chapters.map((ch, i) => (
            <li key={ch.key}>
              <button type="button" className={cn("journey-card", on === i && "is-on")} aria-pressed={on === i} onClick={() => setOn(i)}>
                <span className="journey-num numerals" aria-hidden>{i + 1}</span>
                <span className="flex min-w-0 flex-col text-left"><span className="font-medium text-foreground">{ch.title}</span><span className="text-sm text-muted-foreground">{ch.year}</span></span>
              </button>
            </li>
          ))}
        </ol>
        {c ? (
        <section className="journey-stopcard" aria-live="polite">
          <p className="text-sm text-muted-foreground">{t.story.page(on + 1, n)}, {c.year}</p>
          <h2 className="font-display text-2xl text-foreground">{c.title}</h2>
          {c.body.map((p, k) => <p key={k}>{p}</p>)}
          <div className="flex items-center justify-between">
            <button type="button" className="utility-btn" onClick={() => go(on - 1)} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
            <span aria-hidden className="journey-dots">{chapters.map((ch, i) => <span key={ch.key} className={cn(i === on && "is-on")} />)}</span>
            <button type="button" className="utility-btn" onClick={() => go(on + 1)} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
          </div>
        </section>
        ) : (
        <section className="journey-stopcard" aria-live="polite">
          <h2 className="font-display text-2xl text-foreground">{t.letter.comingSoon}</h2>
          <p>{t.story.soonBody}</p>
        </section>
        )}
        {chips && token && <FlyingFrom token={token} initial={picked} onSaved={onPicked} />}
        {!chips && picked && showFlying && <p className="text-sm text-muted-foreground">{t.flying.yours(t.flying.cities[picked] ?? picked)} <button type="button" className="btn-text" onClick={() => setChanging(true)}>{t.flying.change}</button></p>}
        {flying && flying.told > 0 && <p className="text-sm text-muted-foreground">{t.story.flyingFrom(flying.told, flying.households)}</p>}
        <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(true)}>{t.story.seeList}</button>
      </div>
    </div>
  )
}
