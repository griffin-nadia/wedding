/* eslint-disable react-refresh/only-export-components -- the takes' shared flow: components and the helpers they share */
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Chapter } from "@/lib/content"
import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { readFlying } from "@/lib/journey"
import { getFlying, getJourneys, type Journey } from "@/lib/api"
import { startsFlat } from "@/lib/globe-mode"
import { loop } from "@/lib/frame"
import { cn } from "@/lib/utils"
import { STORY_PLAN } from "@/content/story-plan"
import { pending } from "@/content/pending"
import { Photo } from "@/components/photo"
import { Segmented } from "@/components/segmented"
import { JourneyLegend, usePlaceName } from "@/components/journey-mini"
import { JourneyFlat } from "@/components/journey-flat"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getSpeed, still } from "../../motion"
import { privatePhoto } from "../../private"

/**
 * Run 24 lab, story takes F to I: the one Our story flow every take shares, so each take only changes how it looks and
 * moves (ground rule 1). The kid opener, one stop per chapter, then the journey stop; arrows, dots, swipe, the arrow
 * keys and See as a list, the same as our-story.tsx and story-journey.tsx. Each stop gets --d (how far it is from the
 * one showing, signed, fractional while moving) and --a (the same, unsigned), written once a frame; a take's CSS turns
 * those into transforms and opacity, so it needs no script of its own. Reduced motion: no following and no spring,
 * the stop simply fades in (takes drop their transforms under the media query).
 */

// ── Content: their chapters from the Content tab, or the planner's with the placeholder line (as our-story.tsx) ──
const PHOTO_STOPS: Record<string, Chapter> = {
  "3": { ...STORY_PLAN.find((c) => c.photo === "story-4")!, key: "photo-4", body: [] },
  "5": { ...STORY_PLAN.find((c) => c.photo === "story-8")!, key: "photo-8", body: [] },
}
export function useChapters(): Chapter[] {
  const { lang } = useLang()
  const { story, ready } = useContent()
  return ready && story.length
    ? story.flatMap((c) => { const ch = { ...c, photo: c.photo || undefined }; return PHOTO_STOPS[c.key] ? [ch, PHOTO_STOPS[c.key]] : [ch] })
    : STORY_PLAN.map((c) => (c.body.length ? c : { ...c, body: [pending("story.chapterBody", lang)] }))
}

export type Stop = { kind: "opener" } | { kind: "chapter"; c: Chapter; n: number } | { kind: "journey"; c: Chapter | null }

/** A place as a print's caption would write it: the town, lower case ("hirakata", "canada") */
export const shortPlace = (place?: string) => (place ?? "").split(",").pop()!.trim().toLowerCase()
/** The hand-placed tilt pattern from the polaroid brief (-6° to 6°), one per print, the same everywhere it appears */
export const TILTS = [-5, 4, -3, 6, -4, 3, -2, 5, -6, 2]

// ── Words: the chapter line, title, first paragraph and Keep reading (as story-journey.tsx) ──
const SIGNOFF = /^lots of love,?\s*\n\s*(g \+ n)\s*$/i
function Paragraphs({ body }: { body: string[] }) {
  return <>{body.map((p, k) => SIGNOFF.test(p) ? <p key={k} lang="en" className="story-signoff">{p}</p> : <p key={k} lang="en">{p}</p>)}</>
}
export function useMeta(chapters: Chapter[]) {
  const { t } = useLang()
  const told = chapters.filter((c) => c.body.length)
  return (c: Chapter) => {
    const n = told.indexOf(c)
    return `${n < 0 ? c.year : `${t.story.page(n + 1, told.length)}, ${c.year}`}${c.place ? ` · ${c.place}` : ""}`
  }
}
export function Words({ c, meta, className, titleClass }: { c: Chapter; meta: string; className?: string; titleClass?: string }) {
  const { t } = useLang()
  const more = c.body.length > 1 || (c.body[0]?.length ?? 0) > 220
  return (
    <div className={cn("x-sf-words", className)}>
      <p className="x-sf-meta">{meta}</p>
      <h2 lang="en" className={cn("font-display text-heading", titleClass)}>{c.title}</h2>
      {c.body.length > 0 && <p lang="en" className={cn(more && "story-lead")}>{c.body[0]}</p>}
      {more && (
        <Sheet>
          <SheetTrigger asChild><button type="button" className="btn-text -my-2 min-h-11 self-start" aria-label={t.story.keepReadingLabel(c.title)}>{t.story.keepReading}</button></SheetTrigger>
          <SheetContent aria-describedby={undefined}>
            <SheetHead><p className="text-small text-muted-foreground">{meta}</p><SheetTitle lang="en" className="heading">{c.title}</SheetTitle></SheetHead>
            <SheetBody><div className="story-read"><Paragraphs body={c.body} /></div></SheetBody>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

// ── Pictures ──
/** A photo not on the site yet (dev server only): a plain paper print when it isn't there (any build) */
export function PrivateImg({ file, alt, className, style }: { file: string; alt: string; className?: string; style?: CSSProperties }) {
  const [failed, setFailed] = useState(false)
  const src = privatePhoto(file)
  return failed || !src
    ? <span role="img" aria-label={alt} className={cn("x-sf-blank", className)} />
    : <img src={src} alt={alt} className={className} style={style} draggable={false} decoding="async" onError={() => setFailed(true)} />
}

/**
 * The polaroid from the run 24 brief: 4:5 photo, a narrow edge and a deep foot of the site's paper, a hairline inner
 * shadow, a faint grain, the year and place written on the foot (screen readers get the chapter title instead).
 */
export function Polaroid({ c, i, sizes = "(min-width: 1024px) 320px, 60vw", className, children, caption = true }: { c: Chapter; i: number; sizes?: string; className?: string; children?: ReactNode; caption?: boolean }) {
  return (
    <span className={cn("x-pr", className)} style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as CSSProperties}>
      <span className="x-pr-photo">
        {c.photo ? <Photo name={c.photo} treatment="print" sizes={sizes} alt={`${c.title}, ${c.year}`} /> : <span className="x-sf-blank" />}
      </span>
      {caption && <span aria-hidden className="x-pr-cap">{c.year}{c.place ? ` · ${shortPlace(c.place)}` : ""}</span>}
      {children}
    </span>
  )
}

/** The kid opener's three prints (run 24 section 2): his school portrait and her home photo in front, his first day
 *  behind. Each take arranges them its own way through the classes. */
export function KidPrints({ className }: { className?: string }) {
  return (
    <div className={cn("x-kids", className)}>
      <span className="x-kids-back x-pr"><span className="x-pr-photo"><Photo name="kid-griffin" treatment="print" sizes="200px" /></span></span>
      <span className="x-kids-g x-pr"><span className="x-pr-photo"><PrivateImg file="griffin-kid-portrait-1998-800.webp" alt="Griffin as a boy, his school portrait" /></span></span>
      <span className="x-kids-n x-pr"><span className="x-pr-photo"><PrivateImg file="kids/Nadia Home.jpg" alt="Nadia as a little girl at home" /></span><span aria-hidden className="x-kids-tape" /></span>
    </div>
  )
}

// ── The journey stop (as story-journey.tsx's JourneyMap): the painted globe or the flat map ──
const JourneyGlobe = lazy(() => import("@/components/journey-globe").then((m) => ({ default: m.JourneyGlobe })))
export function JourneyStop({ active }: { active: boolean }) {
  const { t, lang } = useLang()
  const { household } = useHousehold()
  const you = readFlying(household?.token)
  const [flying, setFlying] = useState<Awaited<ReturnType<typeof getFlying>>>(null)
  const [journeys, setJourneys] = useState<Journey[]>([])
  useEffect(() => { void getFlying().then(setFlying); void getJourneys(household?.token).then(setJourneys) }, [household?.token])
  const [mode, setMode] = useState<"globe" | "flat">(() => { try { const m = localStorage.getItem("ng-map"); if (m === "globe" || m === "flat") return m } catch { /* fine */ } return startsFlat() ? "flat" : "globe" })
  const pick = (m: "globe" | "flat") => { setMode(m); try { localStorage.setItem("ng-map", m) } catch { /* private mode */ } }
  const nameOf = usePlaceName()
  const name = you ? nameOf(you.name) : null
  const label = t.journey.map(name, you?.id === "jp" || you?.country === "JP" ? "Already in Japan" : undefined)
  const told = flying && flying.households > 0 ? flying : null
  const toggle = <Segmented label={(lang === "ja" ? "地図" : "Map")} size="sm" className="journey-mode" value={mode} onChange={pick} items={[{ value: "globe", label: (lang === "ja" ? "地球儀" : "Globe") }, { value: "flat", label: (lang === "ja" ? "平面の地図" : "Flat map") }]} />
  return (
    <div className="story-slide story-slide-map x-sf-map">
      <div className="story-media">
        <div className="flex w-full flex-col items-center gap-2">
          {mode === "globe" && active
            ? <Suspense fallback={<div className="journey-globe">{toggle}</div>}><JourneyGlobe you={you} cities={journeys} label={label}>{toggle}</JourneyGlobe></Suspense>
            : mode === "globe" ? <div className="journey-globe">{toggle}</div> : <JourneyFlat you={you} cities={journeys} label={label}>{toggle}</JourneyFlat>}
          {mode === "flat" && <JourneyLegend you={Boolean(you && you.id !== "jp")} />}
          {told && <p className="text-small text-muted-foreground">{t.journey.count(told.told, told.households)}</p>}
        </div>
      </div>
    </div>
  )
}

export const flowCss = `
.x-sf { display: flex; flex-direction: column; gap: var(--space-3); width: 100%; }
.x-sf-track { position: relative; display: grid; overflow: hidden; touch-action: pan-y; -webkit-user-select: none; user-select: none; outline: 2px solid transparent; outline-offset: 4px; border-radius: var(--radius-control); }
.x-sf-track img { -webkit-user-drag: none; }
.x-sf-track:focus-visible { outline-color: var(--input-focus); }
.x-sf-stop { grid-area: 1 / 1; min-width: 0; position: relative; }
.x-sf-words { display: flex; flex-direction: column; gap: var(--space-2); max-width: 34em; color: var(--ink-soft); }
.x-sf-words h2 { color: var(--ink); text-wrap: balance; }
.x-sf-meta { font: 500 var(--type-small-size) / var(--type-small-leading) var(--font-label); color: var(--ink-story); }
.x-sf-blank { display: block; width: 100%; height: 100%; background: var(--surface-alt); }
.x-sf-map { width: 100%; align-self: stretch; flex: none; }
.x-sf-map .story-media { height: auto; width: 100%; max-width: none; }
.x-sf-map .journey-globe { width: min(100%, 340px, 44svh); }
.x-sf-controls { display: flex; align-items: center; justify-content: center; gap: var(--space-5); }
.x-sf-controls .utility-btn:disabled { opacity: .4; }
.x-sf:has(.x-sf-track:focus-visible) .journey-dots .is-on { outline: 2px solid var(--input-focus); outline-offset: 3px; }
@media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) { .x-sf-track { cursor: grab; } .x-sf-track[data-dragging] { cursor: grabbing; } }
@media (prefers-reduced-motion: reduce) { .x-sf-stop { transition: opacity 250ms linear; } .x-sf-stop:not([data-at]) { opacity: 0 !important; } }
/* The polaroid (shared): the site's paper, a deep foot, the photo printed on with a hairline */
.x-pr { --edge: 5%; position: relative; display: block; width: var(--pw, 220px); padding: calc(var(--pw, 220px) * .05) calc(var(--pw, 220px) * .05) calc(var(--pw, 220px) * .2); border-radius: 2px;
  background: color-mix(in oklab, var(--brand-paper-bright) 94%, var(--brand-kare)); rotate: var(--tilt, 0deg);
  box-shadow: 0 1px 1.5px rgb(var(--tint-shadow) / .22), 0 14px 28px -14px rgb(var(--tint-shadow) / .45); }
.x-pr::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .07; border-radius: inherit; background-image: radial-gradient(rgb(var(--tint-shadow)) .5px, transparent .6px); background-size: 3px 3px; }
.x-pr-photo { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; background: var(--surface-alt); }
.x-pr-photo::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 0 .5px rgb(0 0 0 / .25), inset 0 1px 3px rgb(0 0 0 / .18);
  background: linear-gradient(160deg, rgb(255 255 255 / .07), transparent 40%); }
.x-pr-photo figure, .x-pr-photo .photo-print { width: 100%; height: 100%; margin: 0; padding: 0; background: none; box-shadow: none; transform: none; border-radius: 0; }
.x-pr-photo figure > div { width: 100%; height: 100%; aspect-ratio: auto !important; border-radius: 0 !important; }
.x-pr-photo figcaption { display: none; }
.x-pr-photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; display: block; }
.x-pr-cap { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--pw, 220px) * .2); display: grid; place-items: center; padding-inline: 6%;
  font: italic 400 calc(var(--pw, 220px) * .072) / 1 var(--font-display); color: #3d2c20; letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
[data-theme="lantern"] .x-pr { box-shadow: 0 1px 1.5px rgb(0 0 0 / .4), 0 16px 30px -12px rgb(20 8 0 / .7); }
/* The kid opener: Nadia's home photo is cropped in from the left (the other child at the edge) */
.x-kids { position: relative; display: grid; place-items: center; }
.x-kids > .x-pr { grid-area: 1 / 1; }
/* Her home scan is square with a white margin: the 4:5 window sits on her, clear of the child at the left edge */
.x-kids-n .x-pr-photo img { width: 200%; height: auto; aspect-ratio: 1; max-width: none; translate: -29.5% -15%; }
.x-kids-tape { position: absolute; z-index: 3; top: -9px; left: -18px; width: 64px; height: 20px; rotate: -32deg; opacity: .85;
  background: color-mix(in oklab, var(--brand-sage) 55%, white); mask: linear-gradient(90deg, transparent 0, #000 3px calc(100% - 3px), transparent 100%); box-shadow: 0 1px 1px rgb(var(--tint-shadow) / .1); }
`

/**
 * The shared stage. `render` draws a stop; `before` and `after` are a take's own scenery inside the track (rollers,
 * a string). `reach`: how many stops either side stay drawn. `stride`: pixels of drag per stop.
 */
export function StoryFlow({ render, className, reach = 1, stride, before, after, start = 0, onAt, header }: {
  render: (s: Stop, i: number, at: number) => ReactNode; className?: string; reach?: number; stride?: (w: number) => number
  before?: ReactNode; after?: ReactNode; start?: number; onAt?: (at: number) => void; header?: ReactNode
}) {
  const { t } = useLang()
  const chapters = useChapters()
  const last = chapters[chapters.length - 1]
  const ends = last && !last.photo ? last : null
  const body = ends ? chapters.slice(0, -1) : chapters
  const stops: Stop[] = [{ kind: "opener" }, ...body.map((c, n) => ({ kind: "chapter" as const, c, n })), { kind: "journey", c: ends }]
  const total = stops.length
  const first = Math.max(0, Math.min(total - 1, start))
  const [at, setAtState] = useState(first)
  const [list, setList] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const pos = useRef(first), vel = useRef(0), target = useRef(first), running = useRef<(() => void) | null>(null)
  const setAt = (n: number) => { setAtState(n); onAt?.(n) }

  const paint = useCallback(() => {
    const el = track.current
    if (!el) return
    const p = pos.current
    el.style.setProperty("--p", p.toFixed(4))
    for (const s of el.querySelectorAll<HTMLElement>(":scope > .x-sf-stop")) {
      const i = Number(s.dataset.i), d = i - p, a = Math.abs(d)
      s.style.visibility = a < reach + 0.999 ? "" : "hidden"
      s.style.setProperty("--d", d.toFixed(4)); s.style.setProperty("--a", a.toFixed(4))
      s.style.zIndex = String(100 - Math.round(a * 10))
    }
  }, [reach])

  const spring = useCallback(() => {
    running.current?.()
    let then = performance.now()
    running.current = loop((now) => {
      const dt = Math.min(0.032, (now - then) / 1000) * getSpeed(); then = now
      vel.current += (-140 * (pos.current - target.current) - 21 * vel.current) * dt
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
  const goRef = useRef(go); goRef.current = go

  useLayoutEffect(() => {
    paint()
    return () => running.current?.()
  }, [paint, list])

  // Dragging, flicking and a trackpad's sideways swipe (as story-journey.tsx)
  useEffect(() => {
    const el = track.current
    if (!el) return
    const per = () => (stride ? stride(el.clientWidth) : el.clientWidth * 0.9)
    let s0: { x: number; y: number; p: number; id: number } | null = null, dragging = false, samples: [number, number][] = []
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest("button, a, input, .journey-globe, .journey-flat, [data-no-swipe]")) return
      s0 = { x: e.clientX, y: e.clientY, p: pos.current, id: e.pointerId }; dragging = false; samples = [[e.timeStamp, e.clientX]]
    }
    const move = (e: PointerEvent) => {
      if (!s0 || e.pointerId !== s0.id) return
      const dx = e.clientX - s0.x, dy = e.clientY - s0.y
      if (!dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { s0 = null; return }
        if (Math.abs(dx) < 8) return
        dragging = true; running.current?.(); running.current = null
        el.setPointerCapture(e.pointerId); el.dataset.dragging = ""
      }
      samples.push([e.timeStamp, e.clientX]); if (samples.length > 5) samples.shift()
      if (still()) return
      let p = s0.p - dx / per()
      if (p < 0) p *= 0.3; if (p > total - 1) p = total - 1 + (p - (total - 1)) * 0.3
      pos.current = p; paint()
    }
    const up = (e: PointerEvent) => {
      if (!s0 || e.pointerId !== s0.id) return
      const was = dragging, s = s0
      s0 = null; dragging = false; delete el.dataset.dragging
      if (!was) return
      const [t0, x0] = samples[0], [t1, x1] = samples[samples.length - 1]
      const v = (x1 - x0) / Math.max(1, t1 - t0)
      const dx = e.clientX - s.x, from = Math.round(s.p)
      const flick = Math.abs(v) > 0.35 ? (v < 0 ? 1 : -1) : 0
      const next = flick ? from + flick : Math.abs(dx) > per() * 0.28 ? from + (dx < 0 ? 1 : -1) : Math.round(pos.current)
      goRef.current(next, (-v * 1000) / per())
    }
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
      goRef.current(target.current + (sum > 0 ? 1 : -1))
    }
    el.addEventListener("wheel", wheel, { passive: false })
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
    return () => { window.clearTimeout(quiet); el.removeEventListener("wheel", wheel); el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up) }
  }, [list, total, paint, stride])

  if (list) return (
    <div className="x-sf">
      <style>{flowCss}</style>
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

  return (
    <div className={cn("x-sf", className)} data-at={at}>
      <style>{flowCss}</style>
      {header}
      <div ref={track} className="x-sf-track" data-own-swipe role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); go(target.current + 1) } if (e.key === "ArrowLeft") { e.preventDefault(); go(target.current - 1) } }}>
        {before}
        {stops.map((s, i) => (
          <section key={i} data-i={i} data-at={i === at ? "" : undefined} className="x-sf-stop" role="group" aria-roledescription="slide" aria-label={t.story.slide(i + 1, total)} inert={i !== at || undefined}>
            {render(s, i, at)}
          </section>
        ))}
        {after}
      </div>
      <div className="x-sf-controls">
        <button type="button" className="utility-btn" onClick={() => go(target.current - 1)} disabled={at === 0} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span aria-hidden className="journey-dots">{Array.from({ length: total }, (_, i) => <span key={i} className={cn(i === at && "is-on")} />)}</span>
        <button type="button" className="utility-btn" onClick={() => go(target.current + 1)} disabled={at >= total - 1} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
      <button type="button" className="btn-text min-h-11 self-center" onClick={() => setList(true)}>{t.story.seeList}</button>
      {/* For takes that open the story at a chapter from outside (the strip): go there */}
      <FlowJump go={(n) => go(n)} />
    </div>
  )
}

/** A take can ask the flow to move (the strip's prints): window event "x-sf-go" with the stop number */
function FlowJump({ go }: { go: (n: number) => void }) {
  const ref = useRef(go); ref.current = go
  useEffect(() => {
    const f = (e: Event) => ref.current((e as CustomEvent<number>).detail)
    addEventListener("x-sf-go", f)
    return () => removeEventListener("x-sf-go", f)
  }, [])
  return null
}
export const flowGo = (n: number) => dispatchEvent(new CustomEvent("x-sf-go", { detail: n }))
