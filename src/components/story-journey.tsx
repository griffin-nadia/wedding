import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Chapter } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"
import { KYOTO, PLACES, arc } from "@/lib/journey"
import { JourneyLand } from "@/components/journey-mini"
import { Photo } from "@/components/photo"

/** Where a chapter sits: its own spot (the planner's places), its title if it names a place, otherwise along Nadia's line. */
function placeOf(c: Chapter, i: number, n: number): [number, number] {
  if (c.at) return c.at
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
export function StoryJourney({ chapters }: { chapters: Chapter[] }) {
  const { t } = useLang()
  const [on, setOn] = useState(0)
  const [list, setList] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
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
  const n = chapters.length
  const go = (i: number) => { if (n) setOn((i + n) % n) }
  const pts = chapters.map((c, i) => placeOf(c, i, n))
  const c = chapters[on]
  if (list) return (
    <div className="flex flex-col gap-4">
      <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(false)}>{t.story.seeMap}</button>
      <ol className="flex flex-col gap-4">
        {chapters.map((ch) => <li key={ch.key} className="flex flex-col gap-1"><p className="text-small text-muted-foreground">{ch.year}</p><p className="font-medium text-foreground">{ch.title}</p>{ch.body.map((p, k) => <p key={k}>{p}</p>)}</li>)}
      </ol>
    </div>
  )
  return (
    <div className={cn("journey", inView && "is-in")} onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(on + 1) } if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(on - 1) } }}>
      <svg ref={svg} viewBox="0 0 400 320" className="journey-map" role="group" aria-label={t.story.title}>
        <JourneyLand />
        {/* Each line is revealed by a mask whose solid copy draws in (dotted strokes can't draw with dashoffset alone) */}
        <defs>
          <mask id="jm-nadia" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320"><path d={arc(PLACES.brisbane, KYOTO)} className="journey-reveal" pathLength={1} /></mask>
          <mask id="jm-griffin" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320"><path d={arc(PLACES.canada, KYOTO, 0.2)} className="journey-reveal journey-reveal-2" pathLength={1} /></mask>
        </defs>
        <path d={arc(PLACES.brisbane, KYOTO)} className="journey-route journey-route-nadia" pathLength={1} mask="url(#jm-nadia)" />
        <path d={arc(PLACES.canada, KYOTO, 0.2)} className="journey-route journey-route-griffin" pathLength={1} mask="url(#jm-griffin)" />
        {pts[on] && <path key={`draw-${on}`} d={arc(pts[on], KYOTO, 0.25)} className="journey-draw" pathLength={1} />}
        {pts.map(([x, y], i) => (
          <g key={chapters[i].key} role="button" tabIndex={0} aria-label={chapters[i].title} aria-pressed={on === i}
            className={cn("journey-stop", on === i && "is-on")} transform={`translate(${x} ${y})`}
            onClick={() => setOn(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOn(i) } }}>
            <circle r="16" className="journey-hit" />
            <circle r="5" className="journey-dot" />
            {/* Stops on or beside the 京 seal label below the dot, so the seal never covers the words */}
            <text y={Math.hypot(x - KYOTO[0], y - KYOTO[1]) < 30 ? 28 : -12} textAnchor="middle" className="journey-label">{chapters[i].title}</text>
          </g>
        ))}
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
                <span className="flex min-w-0 flex-col text-left"><span className="font-medium text-foreground">{ch.title}</span><span className="text-small text-muted-foreground">{ch.year}</span></span>
              </button>
            </li>
          ))}
        </ol>
        {c ? (
        <section className="journey-stopcard" aria-live="polite">
          {c.photo && <Photo key={c.photo} name={c.photo} treatment="print" sizes="(min-width: 1024px) 240px, 60vw" alt={`${c.title}, ${c.year}`} className="journey-stop-photo" />}
          <p className="text-small text-muted-foreground">{t.story.page(on + 1, n)}, {c.year}{c.place ? ` · ${c.place}` : ""}</p>
          <h2 className="font-display text-heading text-foreground">{c.title}</h2>
          {c.body.map((p, k) => <p key={k}>{p}</p>)}
          <div className="flex items-center justify-between">
            <button type="button" className="utility-btn" onClick={() => go(on - 1)} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
            <span aria-hidden className="journey-dots">{chapters.map((ch, i) => <span key={ch.key} className={cn(i === on && "is-on")} />)}</span>
            <button type="button" className="utility-btn" onClick={() => go(on + 1)} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
          </div>
        </section>
        ) : (
        <section className="journey-stopcard" aria-live="polite">
          <h2 className="font-display text-heading text-foreground">{t.letter.comingSoon}</h2>
          <p>{t.story.soonBody}</p>
        </section>
        )}
        <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(true)}>{t.story.seeList}</button>
      </div>
    </div>
  )
}
