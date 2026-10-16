import { useEffect, useRef, useState, type ReactNode } from "react"
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
 * Our story, one stop at a time (APG carousel): the map stays on top and its line draws to the stop you're on;
 * underneath, a sideways track of slides that snaps one stop at a time (the kid-photo opener when there is one, a
 * slide per chapter with its photo, then Kyoto). Each slide is sized to fit the screen, so nothing scrolls inside
 * it. Swipe, the arrows, the arrow keys or a stop on the map move it. Reduced motion: the arrows jump straight to
 * the stop and nothing animates. "See as a list" shows the same words plainly.
 */
export function StoryJourney({ chapters, opener }: { chapters: Chapter[]; opener?: ReactNode }) {
  const { t } = useLang()
  const [at, setAt] = useState(0)
  const [list, setList] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const lead = opener ? 1 : 0
  const total = chapters.length + lead
  // Arrival (v3 R): the land washes in, the two home routes draw to Kyoto, the seal lands
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = svg.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setInView(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { rootMargin: "-10% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [list])
  // Which slide is showing, from where the track has snapped to (one passive listener, at most once a frame)
  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setAt(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))) }
    el.addEventListener("scroll", on, { passive: true })
    return () => { el.removeEventListener("scroll", on); cancelAnimationFrame(raf) }
  }, [list])
  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const n = Math.max(0, Math.min(total - 1, i))
    el.scrollTo({ left: n * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  }
  const on = at - lead // the chapter showing, or -1 on the opener
  const pts = chapters.map((c, i) => placeOf(c, i, chapters.length))
  if (list) return (
    <div className="flex flex-col gap-4">
      <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(false)}>{t.story.seeMap}</button>
      <ol className="flex flex-col gap-4">
        {chapters.map((ch) => <li key={ch.key} className="flex flex-col gap-1"><p className="text-small text-muted-foreground">{ch.year}</p><p className="font-medium text-foreground">{ch.title}</p>{ch.body.map((p, k) => <p key={k}>{p}</p>)}</li>)}
      </ol>
    </div>
  )
  return (
    <div className={cn("journey story", inView && "is-in")}>
      <svg ref={svg} viewBox="0 0 400 320" className="journey-map story-map" role="group" aria-label={t.story.title}>
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
            onClick={() => go(i + lead)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i + lead) } }}>
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

      <div ref={track} className="story-track" role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1) } if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1) } }}>
        {opener && <section className="story-slide" role="group" aria-roledescription="slide" aria-label={t.story.slide(1, total)}>{opener}</section>}
        {chapters.length ? chapters.map((c, i) => (
          <section key={c.key} className="story-slide" role="group" aria-roledescription="slide" aria-label={t.story.slide(i + 1 + lead, total)} inert={i !== on || undefined}>
            {c.photo && <Photo name={c.photo} treatment="print" sizes="(min-width: 1024px) 320px, 60vw" alt={`${c.title}, ${c.year}`} className="story-slide-photo" />}
            <p className="text-small text-muted-foreground">{t.story.page(i + 1, chapters.length)}, {c.year}{c.place ? ` · ${c.place}` : ""}</p>
            <h2 className="font-display text-heading text-foreground">{c.title}</h2>
            {c.body.map((p, k) => <p key={k}>{p}</p>)}
          </section>
        )) : (
          <section className="story-slide" role="group" aria-roledescription="slide">
            <h2 className="font-display text-heading text-foreground">{t.letter.comingSoon}</h2>
            <p>{t.story.soonBody}</p>
          </section>
        )}
      </div>

      <div className="story-controls">
        <button type="button" className="utility-btn" onClick={() => go(at - 1)} disabled={at === 0} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span aria-hidden className="journey-dots">{Array.from({ length: total }, (_, i) => <span key={i} className={cn(i === at && "is-on")} />)}</span>
        <button type="button" className="utility-btn" onClick={() => go(at + 1)} disabled={at >= total - 1} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
      <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(true)}>{t.story.seeList}</button>
    </div>
  )
}
