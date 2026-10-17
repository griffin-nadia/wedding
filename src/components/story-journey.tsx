import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Chapter } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { cn } from "@/lib/utils"
import { readFlying } from "@/lib/journey"
import { getFlying, type Flying } from "@/lib/api"
import { GuestMap } from "@/components/journey-mini"
import { Photo } from "@/components/photo"

/**
 * The journey to Kyoto, once, as the last stop: Nadia's and Griffin's lines, and the guests' lines (counts per city,
 * never who) once anyone has said where they're flying from, with this household's own line when they have.
 */
function JourneyMap() {
  const { t } = useLang()
  const { household } = useHousehold()
  const you = readFlying(household?.token)
  const [flying, setFlying] = useState<Awaited<ReturnType<typeof getFlying>>>(null)
  useEffect(() => { void getFlying().then(setFlying) }, [])
  const name = you ? t.flying.cities[you as Flying] ?? you : null
  return <GuestMap you={you} flying={flying} label={t.journey.map(name, you ?? undefined)} listable={false} />
}

/**
 * Our story, one stop at a time (APG carousel): a sideways track that snaps one stop at a time (the kid-photo opener
 * when there is one, a stop per chapter, then the journey map). Each stop is a spread that fits the screen, so nothing
 * scrolls inside it: on phones the print is centred with its chapter line underneath; from 1024 the print sits on one
 * side and the words on the other, with the arrows and dots centred below. Swipe, the arrows or the arrow keys move
 * it. Reduced motion: the arrows jump straight to the stop. "See as a list" shows the same words plainly.
 */
export function StoryJourney({ chapters, opener }: { chapters: Chapter[]; opener?: ReactNode }) {
  const { t } = useLang()
  const [at, setAt] = useState(0)
  const [list, setList] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  // The planner's last stop (Kyoto, no photo) carries the map; otherwise the map is a stop of its own after the chapters
  const last = chapters[chapters.length - 1]
  const ends = last && !last.photo ? last : null
  const stops = ends ? chapters.slice(0, -1) : chapters
  const lead = opener ? 1 : 0
  const total = lead + stops.length + 1
  // Which stop is showing: the one more than half in view on the track (no scroll listener)
  useEffect(() => {
    const el = track.current
    if (!el) return
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) setAt([...el.children].indexOf(e.target))
    }, { root: el, threshold: 0.6 })
    for (const c of el.children) io.observe(c)
    return () => io.disconnect()
  }, [list])
  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const n = Math.max(0, Math.min(total - 1, i))
    el.scrollTo({ left: n * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }
  if (list) return (
    <div className="flex flex-col gap-4">
      <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(false)}>{t.story.seeMap}</button>
      <ol className="flex flex-col gap-4">
        {chapters.map((ch) => (
          <li key={ch.key} className="flex items-start gap-3">
            {ch.photo ? <Photo name={ch.photo} treatment="split" sizes="96px" alt="" className="story-thumb" /> : <span aria-hidden className="story-thumb" />}
            <div className="flex min-w-0 flex-col gap-1"><p className="text-small text-muted-foreground">{ch.year}</p><p className="font-medium text-foreground">{ch.title}</p>{ch.body.map((p, k) => <p key={k}>{p}</p>)}</div>
          </li>
        ))}
      </ol>
    </div>
  )
  const slide = (i: number, media: ReactNode, words: ReactNode, key: string, className?: string) => (
    <section key={key} className={cn("story-slide", className)} role="group" aria-roledescription="slide" aria-label={t.story.slide(i + 1, total)} inert={i !== at || undefined}>
      <div className="story-media">{media}</div>
      {words && <div className="story-words">{words}</div>}
    </section>
  )
  const words = (c: Chapter, n: number | null) => <>
    <p className="text-small text-muted-foreground">{n === null ? c.year : `${t.story.page(n, chapters.length)}, ${c.year}`}{c.place ? ` · ${c.place}` : ""}</p>
    <h2 className="font-display text-heading text-foreground">{c.title}</h2>
    {c.body.map((p, k) => <p key={k}>{p}</p>)}
  </>
  return (
    <div className="story">
      <div ref={track} className="story-track" role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1) } if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1) } }}>
        {opener && slide(0, opener, null, "opener", "story-slide-opener")}
        {stops.map((c, i) => slide(i + lead, c.photo
          ? <Photo name={c.photo} treatment="print" vary sizes="(min-width: 1024px) 320px, 70vw" alt={`${c.title}, ${c.year}`} className="story-print" />
          : <span aria-hidden className="story-print-blank" />, words(c, i + 1), c.key))}
        {slide(total - 1, <JourneyMap />, ends ? words(ends, chapters.length) : <h2 className="font-display text-heading text-foreground">{t.story.kyoto}</h2>, "journey", "story-slide-map")}
      </div>

      <div className="story-controls">
        <button type="button" className="utility-btn" onClick={() => go(at - 1)} disabled={at === 0} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span aria-hidden className="journey-dots">{Array.from({ length: total }, (_, i) => <span key={i} className={cn(i === at && "is-on")} />)}</span>
        <button type="button" className="utility-btn" onClick={() => go(at + 1)} disabled={at >= total - 1} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
      <button type="button" className="btn-text min-h-11 self-center" onClick={() => setList(true)}>{t.story.seeList}</button>
    </div>
  )
}
