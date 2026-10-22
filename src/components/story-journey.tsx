import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import type { Chapter } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { ART } from "@/lib/art"
import { useTheme } from "@/lib/theme"
import { useHousehold } from "@/lib/household"
import { cn } from "@/lib/utils"
import { readFlying } from "@/lib/journey"
import { getFlying, getJourneys, type Journey } from "@/lib/api"
import { Segmented } from "@/components/segmented"
import { startsFlat } from "@/lib/globe-mode"
import { chapterPins, type ChapterPin } from "@/lib/journey-names"
import { JourneyLegend, usePlaceName } from "@/components/journey-mini"
import { JourneyFlat } from "@/components/journey-flat"
import { Photo } from "@/components/photo"
import { loop } from "@/lib/frame"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Lettering } from "@/components/lettering"

/** Run 24: what's written on a print's bottom border, lowercase and casual: the year and the place's own name
 *  ("Kansai Gaidai, Hirakata" → "2017 · hirakata", "Australia (Brisbane)" → "2022 · brisbane") */
export function printNote(c: Pick<Chapter, "year" | "place">) {
  const place = c.place ? (/\(([^)]+)\)/.exec(c.place)?.[1] ?? c.place.split(",").pop()!).trim().toLowerCase() : ""
  return [c.year, place].filter(Boolean).join(" · ")
}

/** Their sign-off at the end of the last chapter ("Lots of love,", then "G + N") */
const SIGNOFF = /^lots of love,?\s*\n\s*(g \+ n)\s*$/i

/** A chapter's paragraphs, kept whole, with their sign-off as a signature. Their words stay English on the Japanese
 *  site too, marked lang="en" so a screen reader switches. */
function Paragraphs({ body }: { body: string[] }) {
  return <>{body.map((p, k) => {
    const sign = SIGNOFF.exec(p)
    return sign
      ? <p key={k} lang="en" className="story-signoff">Lots of love,<span className="voice"><Lettering word="mark">{sign[1].toUpperCase()}</Lettering></span></p>
      : <p key={k} lang="en">{p}</p>
  })}</>
}

/**
 * Run 23: their chapters run to several paragraphs, more than a stop on the spread can hold. The spread shows the
 * first paragraph (a few lines) and Keep reading opens the whole chapter as a sheet, at a calm reading measure, so
 * nothing is cut and the spread keeps one height (nothing below it moves between stops).
 */
function ReadOn({ c, meta }: { c: Chapter; meta: string }) {
  const { t } = useLang()
  return (
    <Sheet>
      <SheetTrigger asChild><button type="button" className="btn-text -my-2 min-h-11 self-center" aria-label={t.story.keepReadingLabel(c.title)}>{t.story.keepReading}</button></SheetTrigger>
      <SheetContent aria-describedby={undefined}>
        <SheetHead><p className="text-small text-muted-foreground">{meta}</p><SheetTitle lang="en" className="heading">{c.title}</SheetTitle></SheetHead>
        <SheetBody><div className="story-read"><Paragraphs body={c.body} /></div></SheetBody>
      </SheetContent>
    </Sheet>
  )
}

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
// The settle: stiffness and damping per unit mass, a touch under critical, so a print lands a hair past straight and
// comes back (about 450 ms)
const SPRING = { k: 170, c: 20 }

// Three.js and the painted globe load only when the journey stop is showing
const JourneyGlobe = lazy(() => loadGlobe().then((m) => ({ default: m.JourneyGlobe })))

/** Run 25: the globe's place before it's drawn, a still disc the globe's own size (never an empty square) */
const GlobeWaiting = () => <div className="journey-globe" aria-hidden />

/**
 * The journey to Kyoto, once, as the last stop (final run): Nadia's and Griffin's lines, then the guests' (one per
 * city, never who), then this household's own when they've said. The globe only runs while this stop shows.
 * Run 25, one view per screen: the stop shows the painted globe (the flat map on a phone that starts flat: no WebGL,
 * little memory or Save-Data) and a small Full screen control above it. That opens the map full screen like a photo
 * (a dialog: focus kept inside, Escape or the X closes it, focus goes back to the control), with Globe / Map in a
 * fixed spot at the top that never moves when you switch, and + and − on the globe. Each chapter's place is a pin on
 * both; tapping one goes to that chapter's stop.
 */
/** Run 24: the globe's code warms one stop early, and the globe itself starts once the spring has settled on its stop,
 *  so building it (Three.js, painting the land) never lands mid-slide. Before and after: .brief/docs/runs/2026-10-24.md */
const loadGlobe = () => import("@/components/journey-globe")
type View = "globe" | "flat"
function JourneyMap({ active, near, pins, onPin }: { active: boolean; near: boolean; pins: ChapterPin[]; onPin: (key: string) => void }) {
  const { t } = useLang()
  const { household } = useHousehold()
  // Read once per household (run 25): a new object every render rebuilt the globe on every re-render
  const you = useMemo(() => readFlying(household?.token), [household?.token])
  const [flying, setFlying] = useState<Awaited<ReturnType<typeof getFlying>>>(null)
  // null until the back end answers, so the globe is built once with its lines rather than again when they arrive
  const [journeys, setJourneys] = useState<Journey[] | null>(null)
  useEffect(() => { void getFlying().then(setFlying); void getJourneys(household?.token).then(setJourneys) }, [household?.token])
  const [base] = useState<View>(() => (startsFlat() ? "flat" : "globe"))
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>(base)
  const jumped = useRef(false)
  // One stop early, while they read: the globe's code, then its land painted in idle time (paintGlobe keeps it, so the
  // globe mounts on a ready painting; the same look, size and countries as journey-globe.tsx asks for)
  const { theme } = useTheme()
  useEffect(() => {
    if (!near || base !== "globe" || ART.globeLand || !journeys) return
    let alive = true
    // After this stop's own slide has settled (about 550 ms), then when the phone is idle, never mid-spring
    const idle = (f: () => void) => window.setTimeout(() => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(f) : f()), still() ? 0 : 700)
    void loadGlobe().then(() => idle(() => {
      if (!alive) return
      const countries = [...journeys.map((c) => c.country ?? ""), you?.country ?? ""].filter(Boolean)
      void import("@/lib/paint-globe").then(({ paintGlobe, GLOBE_LOOK }) => paintGlobe(theme === "lantern" ? GLOBE_LOOK.night : GLOBE_LOOK.day, matchMedia("(pointer: coarse)").matches ? 1024 : 2048, countries))
    }))
    return () => { alive = false }
  }, [near, base, theme, journeys, you])
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!active) return setSettled(false)
    const id = window.setTimeout(() => setSettled(true), still() ? 0 : 550)
    return () => window.clearTimeout(id)
  }, [active])
  const nameOf = usePlaceName()
  const name = you ? nameOf(you.name) : null
  const label = t.journey.map(name, you?.id === "jp" || you?.country === "JP" ? "Already in Japan" : undefined)
  const told = flying && flying.households > 0 ? flying : null
  const cities = journeys ?? NONE
  const show = (v: View, where: "stop" | "full") => {
    const go = where === "full" ? (key: string) => { jumped.current = true; setOpen(false); onPin(key) } : onPin
    if (v === "flat") return <JourneyFlat you={you} cities={cities} label={label} pins={pins} onPin={go} />
    // The stop's globe waits for its stop to settle and for the lines; the full-screen one builds straight away
    if (where === "stop" && !(active && settled && journeys)) return <GlobeWaiting />
    return <Suspense fallback={<GlobeWaiting />}><JourneyGlobe you={you} cities={cities} label={label} pins={pins} onPin={go} zoomable={where === "full"} held={where === "stop" && open} /></Suspense>
  }
  const legend = <JourneyLegend you={Boolean(you && you.id !== "jp")} />
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) { jumped.current = false; setView(base) } }}>
        {/* The control sits where the Globe / Flat switch was, centred above the map */}
        <div className="journey-mode-bar">
          <SheetTrigger asChild>
            <button type="button" className="journey-open" aria-label={t.journey.openLabel}><Maximize2 className="size-4" aria-hidden />{t.journey.open}</button>
          </SheetTrigger>
        </div>
        {show(base, "stop")}
        <SheetContent className="journey-viewer" closeLabel={t.journey.close} aria-describedby={undefined}
          onCloseAutoFocus={(e) => { if (jumped.current) e.preventDefault() }}>
          <SheetTitle className="sr-only">{t.journey.title}</SheetTitle>
          {/* Globe / Map in one fixed spot at the top, the same in both views */}
          <div className="journey-viewer-bar">
            <Segmented label={t.journey.view} size="sm" className="journey-mode" value={view} onChange={setView} items={[{ value: "globe", label: t.journey.globe }, { value: "flat", label: t.journey.flat }]} />
          </div>
          <div className="journey-viewer-stage" data-view={view}>{show(view, "full")}</div>
          <div className="journey-viewer-foot">{legend}</div>
        </SheetContent>
      </Sheet>
      {legend}
      {told && <p className="text-small text-muted-foreground">{t.journey.count(told.told, told.households)}</p>}
    </div>
  )
}
const NONE: Journey[] = []

/**
 * Our story, one stop at a time (APG carousel): the kid-photo opener when there is one, a stop per chapter, then the
 * journey map, stacked in one place. Each stop is a spread that fits the screen, so nothing scrolls inside it: on
 * phones the print is centred with its chapter line underneath; from 1024 the print sits on one side and the words
 * on the other, with the arrows and dots centred below.
 * Moving on: the next print slides in turned a few degrees and settles straight on a spring, the previous one eases
 * back (a little smaller, a little left) and fades, and the chapter text cross-fades (out by halfway, in from
 * halfway). Dragging moves it with the finger the whole way; letting go (or a flick) springs to the nearest stop,
 * with a little give at either end. Arrows, dots, the arrow keys and swipes all use the same spring. Reduced motion:
 * nothing moves or follows the finger; a swipe or a tap fades straight to the stop. "See as a list" shows the same
 * words plainly.
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
  // Where the stack is, in stops (0 = the first; fractional while moving), how fast, and where it's heading
  const pos = useRef(0), vel = useRef(0), target = useRef(0), running = useRef<(() => void) | null>(null)

  // One write per stop per frame, straight to the elements (no re-render while moving)
  const paint = useCallback(() => {
    const el = track.current
    if (!el) return
    const p = pos.current, w = el.clientWidth, calm = still()
    // Every read before any write (run 19): reading a size after a write forced a fresh layout per stop, every frame
    const slides = [...el.children] as HTMLElement[]
    const parts = slides.map((s) => [s.querySelector<HTMLElement>(".story-media"), s.querySelector<HTMLElement>(".story-words")] as const)
    const offs = parts.map(([m]) => (m ? (w + m.offsetWidth) / 2 + 32 : 0))
    slides.forEach((slide, i) => {
      const d = i - p, a = Math.abs(d), [media, words] = parts[i]
      slide.style.visibility = a < 0.999 ? "" : "hidden" // only the stops on screen draw
      slide.style.zIndex = d >= 0 ? "2" : "1" // the arriving print comes in over the one easing back
      if (calm) { slide.style.opacity = a < 0.5 ? "1" : "0"; return }
      slide.style.opacity = ""
      if (media) {
        // Far enough that a whole stop along, the print (and its tilt) is clear of the track's edge
        const off = offs[i]
        media.style.transform = d >= 0
          ? `translate3d(${d * off}px, 0, 0) rotate(${d * 8}deg)` // arriving: from the right, turned, settling straight
          : `translate3d(${d * w * 0.16}px, 0, 0) scale(${1 + d * 0.08})` // leaving: eases back and away
        media.style.opacity = String(d >= 0 ? 1 : Math.max(0, 1 + d * 1.3))
      }
      if (words) words.style.opacity = String(Math.max(0, 1 - a * 2))
    })
  }, [])

  const spring = useCallback(() => {
    running.current?.()
    let then = performance.now()
    running.current = loop((now) => {
      const dt = Math.min(0.032, (now - then) / 1000); then = now
      vel.current += (-SPRING.k * (pos.current - target.current) - SPRING.c * vel.current) * dt
      pos.current += vel.current * dt
      const done = Math.abs(vel.current) < 0.003 && Math.abs(pos.current - target.current) < 0.001
      if (done) { pos.current = target.current; vel.current = 0; running.current = null }
      paint()
      return !done
    })
  }, [paint])

  const go = (i: number, v = 0) => {
    const n = Math.max(0, Math.min(total - 1, i))
    target.current = n
    setAt(n)
    if (still()) { running.current?.(); pos.current = n; vel.current = 0; paint(); return }
    vel.current = v
    spring()
  }

  // Placed before the first paint, and again whenever the size changes (stops are placed in px of the track's width)
  useLayoutEffect(() => {
    paint()
    const el = track.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(paint); ro.observe(el)
    return () => { ro.disconnect(); running.current?.() }
  }, [paint, list])

  // Dragging: sideways moves follow the finger; up and down stay the page's
  useEffect(() => {
    const el = track.current
    if (!el) return
    let start: { x: number; y: number; p: number; id: number } | null = null, dragging = false, samples: [number, number][] = []
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest("button, a, input, .journey-globe")) return // the globe turns, it doesn't swipe
      start = { x: e.clientX, y: e.clientY, p: pos.current, id: e.pointerId }; dragging = false; samples = [[e.timeStamp, e.clientX]]
    }
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const dx = e.clientX - start.x, dy = e.clientY - start.y
      if (!dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { start = null; return } // a scroll
        if (Math.abs(dx) < 8) return
        dragging = true; running.current?.(); running.current = null
        el.setPointerCapture(e.pointerId); el.dataset.dragging = ""
      }
      samples.push([e.timeStamp, e.clientX]); if (samples.length > 5) samples.shift()
      if (still()) return // reduced motion: no following, just the swipe at the end
      let p = start.p - dx / (el.clientWidth * 0.9)
      if (p < 0) p *= 0.3; if (p > total - 1) p = total - 1 + (p - (total - 1)) * 0.3 // a little give at the ends
      pos.current = p; paint()
    }
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const was = dragging, s = start
      start = null; dragging = false; delete el.dataset.dragging
      if (!was) return
      const [t0, x0] = samples[0], [t1, x1] = samples[samples.length - 1]
      const v = (x1 - x0) / Math.max(1, t1 - t0) // px per ms, + is rightwards
      const dx = e.clientX - s.x
      const from = Math.round(s.p)
      const flick = Math.abs(v) > 0.35 ? (v < 0 ? 1 : -1) : 0
      const next = flick ? from + flick : Math.abs(dx) > el.clientWidth * 0.25 ? from + (dx < 0 ? 1 : -1) : Math.round(pos.current)
      go(next, (-v * 1000) / (el.clientWidth * 0.9))
    }
    // A trackpad's sideways swipe is one stop, like an arrow: the first push past 24px moves, and the momentum that
    // follows (wheel events that keep arriving, smaller and smaller) is ignored until the wheel has been quiet for
    // 200 ms. Up and down stay the page's. preventDefault keeps the browser's own swipe-back out of it.
    let sum = 0, locked = false, quiet = 0
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      window.clearTimeout(quiet)
      quiet = window.setTimeout(() => { locked = false; sum = 0 }, 200)
      if (locked) return
      sum += e.deltaX
      if (Math.abs(sum) < 24) return
      locked = true
      go(target.current + (sum > 0 ? 1 : -1))
    }
    el.addEventListener("wheel", wheel, { passive: false })
    el.addEventListener("pointerdown", down)
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
    return () => { window.clearTimeout(quiet); el.removeEventListener("wheel", wheel); el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, total, paint])
  if (list) return (
    <div className="flex flex-col gap-4">
      <button type="button" className="btn-text min-h-11 self-start" onClick={() => setList(false)}>{t.story.seeMap}</button>
      <ol className="flex flex-col gap-4">
        {chapters.map((ch) => (
          <li key={ch.key} className="flex items-start gap-3">
            {ch.photo ? <Photo name={ch.photo} treatment="split" sizes="96px" alt="" className="story-thumb" /> : <span aria-hidden className="story-thumb" />}
            <div className="story-read flex min-w-0 flex-col gap-2"><p className="text-small text-muted-foreground">{ch.year}{ch.place ? ` · ${ch.place}` : ""}</p><p lang="en" className="font-medium text-foreground">{ch.title}</p><Paragraphs body={ch.body} /></div>
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
  // Run 25: a chapter's pin on the map goes to its stop, and the carousel takes focus (the map's stop goes inert)
  const pins = chapterPins(chapters)
  const toChapter = (key: string) => {
    const i = ends?.key === key ? total - 1 : stops.findIndex((c) => c.key === key) + lead
    if (i < lead && ends?.key !== key) return
    go(i)
    requestAnimationFrame(() => track.current?.focus({ preventScroll: true }))
  }
  // Chapters are counted without the photo-only stops between them (run 23)
  const told = chapters.filter((c) => c.body.length)
  const words = (c: Chapter) => {
    const n = told.indexOf(c), meta = `${n < 0 ? c.year : `${t.story.page(n + 1, told.length)}, ${c.year}`}${c.place ? ` · ${c.place}` : ""}`
    const more = c.body.length > 1 || (c.body[0]?.length ?? 0) > 220
    return <>
      <p className="text-small text-muted-foreground">{meta}</p>
      <h2 lang="en" className="font-display text-heading text-foreground">{c.title}</h2>
      {c.body.length > 0 && <p lang="en" className={cn(more && "story-lead")}>{c.body[0]}</p>}
      {more && <ReadOn c={c} meta={meta} />}
    </>
  }
  return (
    <div className="story">
      <div ref={track} className="story-track" data-own-swipe role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(target.current + 1) } if (e.key === "ArrowLeft") { e.preventDefault(); go(target.current - 1) } }}>
        {opener && slide(0, opener, null, "opener", "story-slide-opener")}
        {stops.map((c, i) => slide(i + lead, c.photo
          ? <Photo name={c.photo} treatment="print" vary sizes="(min-width: 1024px) 320px, 70vw" alt={`${c.title}, ${c.year}`} className="story-print" note={printNote(c)} />
          : <span aria-hidden className="story-print-blank" />, words(c), c.key))}
        {slide(total - 1, <JourneyMap active={at === total - 1} near={at >= total - 2} pins={pins} onPin={toChapter} />, ends ? words(ends) : <h2 className="font-display text-heading text-foreground">{t.story.kyoto}</h2>, "journey", "story-slide-map")}
      </div>

      <div className="story-controls">
        <button type="button" className="utility-btn" onClick={() => go(target.current - 1)} disabled={at === 0} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span aria-hidden className="journey-dots">{Array.from({ length: total }, (_, i) => <span key={i} className={cn(i === at && "is-on")} />)}</span>
        <button type="button" className="utility-btn" onClick={() => go(target.current + 1)} disabled={at >= total - 1} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
      <button type="button" className="btn-text min-h-11 self-center" onClick={() => setList(true)}>{t.story.seeList}</button>
    </div>
  )
}
