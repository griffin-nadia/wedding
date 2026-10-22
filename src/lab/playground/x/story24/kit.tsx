/* eslint-disable react-refresh/only-export-components -- the five takes' shared kit, never a page of its own */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode, type RefObject } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import manifest from "@/content/photos.json"
import type { Chapter } from "@/lib/content"
import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { readFlying } from "@/lib/journey"
import { getFlying, getJourneys, type Journey } from "@/lib/api"
import { STORY_PLAN } from "@/content/story-plan"
import { pending } from "@/content/pending"
import { Segmented } from "@/components/segmented"
import { JourneyLegend, usePlaceName } from "@/components/journey-mini"
import { JourneyFlat } from "@/components/journey-flat"
import { startsFlat } from "@/lib/globe-mode"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { privatePhoto } from "../../private"

/**
 * Run 24, section 5: what the five story takes share, so each take is only how it looks and moves (ground rule 1).
 * The same flow as the live page: the kid opener, one chapter at a time (arrows, dots, swipe, the arrow keys, See as a
 * list), then the journey stop. Their chapters from the Content tab when there's a back end, else the planner with
 * the placeholder line, exactly as pages/our-story.tsx does. Nothing invented: captions are the chapter's year and
 * place only.
 */

// ---------- Chapters ----------
/** The live page's photo-only stops between chapters once their words are in (our-story.tsx, run 23) */
const PHOTO_STOPS: Record<string, Chapter> = {
  "3": { ...STORY_PLAN.find((c) => c.photo === "story-4")!, key: "photo-4", body: [] },
  "5": { ...STORY_PLAN.find((c) => c.photo === "story-8")!, key: "photo-8", body: [] },
}
export type Story = { chapters: Chapter[]; stops: Chapter[]; ends: Chapter | null; total: number; told: Chapter[] }
/** The stops in order: 0 is the kid opener, 1..n the chapters, total - 1 the journey stop (with the last words) */
export function useChapters(): Story {
  const { lang } = useLang()
  const { story, ready } = useContent()
  return useMemo(() => {
    const chapters = ready && story.length
      ? story.flatMap((c) => (PHOTO_STOPS[c.key] ? [{ ...c, photo: c.photo || undefined }, PHOTO_STOPS[c.key]] : [{ ...c, photo: c.photo || undefined }]))
      : STORY_PLAN.map((c) => (c.body.length ? c : { ...c, body: [pending("story.chapterBody", lang)] }))
    const last = chapters[chapters.length - 1]
    const ends = last && !last.photo ? last : null
    const stops = ends ? chapters.slice(0, -1) : chapters
    return { chapters, stops, ends, total: stops.length + 2, told: chapters.filter((c) => c.body.length) }
  }, [story, ready, lang])
}

/** The handwritten-feel caption: year and place only ("2017 · hirakata"), lower case */
export function caption(c: Chapter) {
  const p = (c.place ?? "").match(/\(([^)]+)\)/)?.[1] ?? (c.place ?? "").split(",").pop() ?? ""
  return `${c.year}${p.trim() ? ` · ${p.trim().toLowerCase()}` : ""}`
}
/** Section 1's hand-placed tilts, one per print, the same everywhere it appears */
export const TILTS = [-5, 4, -3, 6, -4, 3, -2, 5]
/** A stable 0..1 per print and use (never random per visit) */
export const rnd = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }

// ---------- Pictures ----------
type Man = { formats: Record<string, number[]>; width: number; height: number }
const PHOTOS = manifest as unknown as Record<string, Man>
const base = `${import.meta.env.BASE_URL}photos/`
/** A site photo's sources (the same files Photo uses), or a private one's (dev server only) */
export function sources(name: string) {
  const p = PHOTOS[name]
  if (!p) return null
  const set = (f: string) => (p.formats[f] ?? []).map((w) => `${base}${name}-${w}.${f} ${w}w`).join(", ")
  const w = p.formats.webp ?? p.formats.jpg ?? [800]
  return { avif: set("avif"), webp: set("webp"), src: `${base}${name}-${w[w.length - 1]}.${p.formats.webp ? "webp" : "jpg"}` }
}
/** crop: a close-up from a square scan, as [left, top, width] fractions of the image, shown in the 4:5 box */
export type Pic = { name?: string; file?: string; alt: string; at?: string; crop?: [number, number, number] }
/** The kid opener (section 2): Griffin's 1998 school portrait and Nadia at home in front, his first day behind */
export const KIDS: { front: [Pic, Pic]; behind: Pic } = {
  front: [
    { file: "griffin-kid-portrait-1998-800.webp", alt: "Griffin as a little boy, his school portrait", at: "50% 30%" },
    // A close-up from the square scan: the scan's white edge and the other child peeking in at the left stay out
    { file: "kids/Nadia Home.jpg", alt: "Nadia as a little girl at home", crop: [0.2875, 0.15, 0.5125] },
  ],
  behind: { name: "kid-griffin", alt: "Griffin as a little boy on his first day of school, standing at the front door", at: "50% 40%" },
}
/**
 * One photo, cropped to cover its box (4:5 in the prints). Private pictures only exist on the lab's dev server: in a
 * test build they 404, and the box quietly becomes plain paper (no broken image, no console error).
 */
export function Img({ pic, sizes = "320px", className, style, eager }: { pic: Pic; sizes?: string; className?: string; style?: CSSProperties; eager?: boolean }) {
  const [broken, setBroken] = useState(false)
  const s = pic.name ? sources(pic.name) : null
  // Private pictures come from the dev server only: in a build privatePhoto is "", and the box is plain paper
  const src = s?.src ?? (pic.file ? privatePhoto(pic.file) : "")
  if (broken || !src || (pic.name && !__PUBLIC_PHOTOS__)) return <span role="img" aria-label={pic.alt} className={cn("x-s24-blank", className)} style={style} />
  const img = <img src={src} alt={pic.alt} sizes={sizes} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} onError={() => setBroken(true)}
    className={className} style={pic.crop
      ? { position: "absolute", left: `${(-pic.crop[0] / pic.crop[2]) * 100}%`, top: 0, marginTop: `${(-pic.crop[1] / pic.crop[2]) * 100}%`, width: `${100 / pic.crop[2]}%`, maxWidth: "none", height: "auto", ...style }
      : { objectFit: "cover", objectPosition: pic.at ?? "50% 30%", ...style }} />
  return s ? <picture>{s.avif && <source type="image/avif" srcSet={s.avif} sizes={sizes} />}{s.webp && <source type="image/webp" srcSet={s.webp} sizes={sizes} />}{img}</picture> : img
}
export const chapterPic = (c: Chapter): Pic | null => (c.photo ? { name: c.photo, alt: `${c.title}, ${c.year}` } : null)

/**
 * The polaroid (section 1): photo at 4:5 slightly inset with a hairline inner shadow and a faint still gloss, border
 * about 5% at the top and sides and 18% at the bottom in the site's warm paper with a faint grain, 2px corners, a
 * two-layer shadow, the caption on the bottom border. Screen readers get the photo's alt (the chapter title), not the
 * caption. Width from --pw on the print.
 */
export function Polaroid({ pic, cap, tilt = 0, tape, className, style, sizes, eager, children }: { pic: Pic | null; cap?: string; tilt?: number; tape?: boolean; className?: string; style?: CSSProperties; sizes?: string; eager?: boolean; children?: ReactNode }) {
  return (
    <span className={cn("x-s24-pol", className)} style={{ ["--tilt" as string]: `${tilt}deg`, ...style }}>
      {tape && <span aria-hidden className="x-s24-tape" />}
      <span className="x-s24-pol-photo">{pic ? <Img pic={pic} sizes={sizes} eager={eager} /> : <span aria-hidden className="x-s24-blank" />}</span>
      {cap && <span aria-hidden className="x-s24-cap">{cap}</span>}
      {children}
    </span>
  )
}

// ---------- Moving between stops ----------
const clamp = (i: number, n: number) => Math.max(0, Math.min(n - 1, i))
export function useStops(total: number) {
  const [at, setAt] = useState(0)
  const [list, setList] = useState(false)
  const go = useCallback((i: number) => setAt(clamp(i, total)), [total])
  return { at, go, list, setList }
}
/**
 * Swipes on an element: a sideways drag past 40px (or a flick) is one stop, up and down stay the page's. Never from a
 * button, a link, the globe or anything marked data-own-drag. A trackpad's sideways swipe is one stop too (the live
 * page's rule: the first push past 24px, then quiet for 200ms). onDrag, if given, follows the finger (px, null at the
 * end) for takes that move with it.
 */
export function useSwipe(ref: RefObject<HTMLElement | null>, step: (dir: 1 | -1) => void, onDrag?: (dx: number | null, v: number) => boolean | void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let start: { x: number; y: number; id: number } | null = null, on = false, samples: [number, number][] = []
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest("button, a, input, .journey-globe, .journey-flat, [data-own-drag], [role=dialog]")) return
      start = { x: e.clientX, y: e.clientY, id: e.pointerId }; on = false; samples = [[e.timeStamp, e.clientX]]
    }
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const dx = e.clientX - start.x, dy = e.clientY - start.y
      if (!on) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { start = null; return }
        if (Math.abs(dx) < 8) return
        on = true; el.setPointerCapture(e.pointerId)
      }
      samples.push([e.timeStamp, e.clientX]); if (samples.length > 5) samples.shift()
      onDrag?.(dx, 0)
    }
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const dx = e.clientX - start.x, was = on
      start = null; on = false
      if (!was) return
      const [t0, x0] = samples[0], [t1, x1] = samples[samples.length - 1]
      const v = (x1 - x0) / Math.max(1, t1 - t0)
      if (onDrag?.(null, v) === true) return // the take settled it itself
      if (Math.abs(dx) > 40 || Math.abs(v) > 0.35) step(dx < 0 ? 1 : -1)
    }
    let sum = 0, locked = false, quiet = 0
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      window.clearTimeout(quiet); quiet = window.setTimeout(() => { locked = false; sum = 0 }, 200)
      if (locked) return
      sum += e.deltaX
      if (Math.abs(sum) < 24) return
      locked = true; step(sum > 0 ? 1 : -1)
    }
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
    el.addEventListener("wheel", wheel, { passive: false })
    return () => { window.clearTimeout(quiet); el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("wheel", wheel) }
  }, [ref, step, onDrag])
}
/** The arrow keys on the carousel region */
export const arrowKeys = (go: (d: 1 | -1) => void) => (e: React.KeyboardEvent) => {
  if (e.key === "ArrowRight") { e.preventDefault(); go(1) }
  if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
}

/** The live page's controls: the arrows either side of the dots, then See as a list */
export function Controls({ at, total, go, onList, className }: { at: number; total: number; go: (i: number) => void; onList: () => void; className?: string }) {
  const { t } = useLang()
  return (
    <div className={cn("x-s24-controls", className)}>
      <div className="x-s24-row">
        <button type="button" className="utility-btn" onClick={() => go(at - 1)} disabled={at === 0} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span aria-hidden className="journey-dots">{Array.from({ length: total }, (_, i) => <span key={i} className={cn(i === at && "is-on")} />)}</span>
        <button type="button" className="utility-btn" onClick={() => go(at + 1)} disabled={at >= total - 1} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
      <button type="button" className="btn-text min-h-11" onClick={onList}>{t.story.seeList}</button>
    </div>
  )
}

/** What a screen reader hears on each move: where it is and the chapter's title */
export function useAnnounce(s: Story, at: number) {
  const { t } = useLang()
  const c = at > 0 && at <= s.stops.length ? s.stops[at - 1] : null
  return `${t.story.slide(at + 1, s.total)}${c ? `: ${c.title}, ${c.year}` : at === s.total - 1 ? `: ${s.ends?.title ?? t.story.kyoto}` : ""}`
}

// ---------- Words ----------
function Paragraphs({ body }: { body: string[] }) { return <>{body.map((p, k) => <p key={k} lang="en">{p}</p>)}</> }
export function useMeta(s: Story) {
  const { t } = useLang()
  return (c: Chapter) => { const n = s.told.indexOf(c); return `${n < 0 ? c.year : `${t.story.page(n + 1, s.told.length)}, ${c.year}`}${c.place ? ` · ${c.place}` : ""}` }
}
/** Keep reading: the whole chapter in the site's sheet (Escape closes it, focus comes back) */
export function ReadOn({ c, meta, className }: { c: Chapter; meta: string; className?: string }) {
  const { t } = useLang()
  return (
    <Sheet>
      <SheetTrigger asChild><button type="button" className={cn("btn-text min-h-11", className)} aria-label={t.story.keepReadingLabel(c.title)}>{t.story.keepReading}</button></SheetTrigger>
      <SheetContent aria-describedby={undefined}>
        <SheetHead><p className="text-small text-muted-foreground">{meta}</p><SheetTitle lang="en" className="heading">{c.title}</SheetTitle></SheetHead>
        <SheetBody><div className="story-read"><Paragraphs body={c.body} /></div></SheetBody>
      </SheetContent>
    </Sheet>
  )
}
/** A chapter's words as the live page shows them: meta, title, the first paragraph and Keep reading */
export function Words({ c, meta, className, titleClass }: { c: Chapter; meta: string; className?: string; titleClass?: string }) {
  const more = c.body.length > 1 || (c.body[0]?.length ?? 0) > 220
  return (
    <div className={cn("x-s24-words", className)}>
      <p className="x-s24-meta">{meta}</p>
      <h2 lang="en" className={cn("x-s24-title", titleClass)}>{c.title}</h2>
      {c.body.length > 0 && <p lang="en" className={cn("x-s24-body", more && "is-lead")}>{c.body[0]}</p>}
      {more && <ReadOn c={c} meta={meta} />}
    </div>
  )
}

/** See as a list: the same words plainly (the live page's list), with See the map back */
export function ListView({ s, onBack, className }: { s: Story; onBack: () => void; className?: string }) {
  const { t } = useLang()
  const meta = (c: Chapter) => `${c.year}${c.place ? ` · ${c.place}` : ""}`
  return (
    <div className={cn("x-s24-list", className)}>
      <button type="button" className="btn-text min-h-11 self-start" onClick={onBack} autoFocus>{t.story.seeMap}</button>
      <ol>
        {s.chapters.map((c) => (
          <li key={c.key}>
            {c.photo ? <Img pic={{ name: c.photo, alt: "" }} sizes="96px" className="x-s24-thumb" /> : <span aria-hidden className="x-s24-thumb" />}
            <div className="story-read flex min-w-0 flex-col gap-2"><p className="text-small text-muted-foreground">{meta(c)}</p><p lang="en" className="font-medium text-foreground">{c.title}</p><Paragraphs body={c.body} /></div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ---------- The journey stop ----------
const JourneyGlobe = lazy(() => import("@/components/journey-globe").then((m) => ({ default: m.JourneyGlobe })))
/** The live page's journey stop (story-journey.tsx's JourneyMap, read only): the globe or the flat map, the key, the count */
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
  const label = t.journey.map(you ? nameOf(you.name) : null, you?.id === "jp" || you?.country === "JP" ? "Already in Japan" : undefined)
  const told = flying && flying.households > 0 ? flying : null
  const toggle = <Segmented label={pending("journey.mapMode", lang)} size="sm" className="journey-mode" value={mode} onChange={pick} items={[{ value: "globe", label: pending("journey.globe", lang) }, { value: "flat", label: pending("journey.flat", lang) }]} />
  return (
    <div className="x-s24-journey">
      {mode === "globe" && active
        ? <Suspense fallback={<div className="journey-globe">{toggle}</div>}><JourneyGlobe you={you} cities={journeys} label={label}>{toggle}</JourneyGlobe></Suspense>
        : mode === "globe" ? <div className="journey-globe">{toggle}</div> : <JourneyFlat you={you} cities={journeys} label={label}>{toggle}</JourneyFlat>}
      {mode === "flat" && <JourneyLegend you={Boolean(you && you.id !== "jp")} />}
      {told && <p className="text-small text-muted-foreground">{t.journey.count(told.told, told.households)}</p>}
    </div>
  )
}
/** The words on the journey stop: their last chapter (And then, Kyoto) or plain Kyoto */
export function EndWords({ s, className }: { s: Story; className?: string }) {
  const { t } = useLang()
  const meta = useMeta(s)
  return s.ends ? <Words c={s.ends} meta={meta(s.ends)} className={className} /> : <div className={cn("x-s24-words", className)}><h2 className="x-s24-title">{t.story.kyoto}</h2></div>
}

/** Nadia's art from public/art (ART): her wax seal and gum leaves, as stickers and marks */
export const artSet = (src: string, widths: number[], f: "avif" | "webp") => widths.map((w) => `${import.meta.env.BASE_URL}${src}-${w}.${f} ${w}w`).join(", ")
export function Art({ src, widths, alt = "", className, style, sizes = "120px" }: { src: string; widths: number[]; alt?: string; className?: string; style?: CSSProperties; sizes?: string }) {
  return (
    <picture>
      <source type="image/avif" srcSet={artSet(src, widths, "avif")} sizes={sizes} />
      <img src={`${import.meta.env.BASE_URL}${src}-${widths[0]}.webp`} srcSet={artSet(src, widths, "webp")} sizes={sizes} alt={alt} aria-hidden={alt ? undefined : true} draggable={false} decoding="async" className={className} style={style} />
    </picture>
  )
}

/**
 * The kid opener's three prints (section 2): Griffin's portrait and Nadia's home photo in front, tilted opposite ways,
 * hers leaning into his, tape across the overlap; his first day of school tucked half under his portrait. Sized by --kw.
 */
export function KidPrints({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={cn("x-s24-kids", className)} style={style}>
      <Polaroid pic={KIDS.behind} tilt={-8} className="x-s24-kid-b" sizes="200px" />
      <Polaroid pic={KIDS.front[0]} cap="griffin" tilt={4} className="x-s24-kid-g" sizes="260px" eager />
      <Polaroid pic={KIDS.front[1]} cap="nadia" tilt={-5} className="x-s24-kid-n" sizes="260px" eager><span aria-hidden className="x-s24-kid-tape" /></Polaroid>
    </div>
  )
}

/** What every take shares: the polaroid, the blank paper print, the controls, the words, the list */
export const KIT_CSS = `
.x-s24-blank { display: block; width: 100%; height: 100%; background: color-mix(in oklab, var(--surface-fill) 70%, var(--brand-paper-bright)); }
.x-s24-pol { --pw: 200px; position: relative; display: block; width: var(--pw); padding: calc(var(--pw) * .05) calc(var(--pw) * .05) calc(var(--pw) * .18); border-radius: 2px; rotate: var(--tilt);
  background: radial-gradient(rgb(var(--tint-shadow) / .07) .5px, transparent .6px) 0 0 / 3px 3px, color-mix(in oklab, var(--brand-paper-bright) 86%, var(--brand-kinari));
  box-shadow: 0 0 0 .5px rgb(66 26 5 / .14), 0 1px 2px rgb(66 26 5 / .18), 0 14px 28px -14px rgb(66 26 5 / .42); }
[data-theme="lantern"] .x-s24-pol { background: radial-gradient(rgb(66 26 5 / .08) .5px, transparent .6px) 0 0 / 3px 3px, color-mix(in oklab, var(--brand-paper-bright) 78%, var(--brand-wara));
  box-shadow: 0 0 0 .5px rgb(0 0 0 / .3), 0 1px 2px rgb(20 8 0 / .5), 0 16px 30px -12px rgb(30 12 0 / .7); }
.x-s24-pol-photo { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; background: var(--brand-wara); }
.x-s24-pol-photo img, .x-s24-pol-photo .x-s24-blank { display: block; width: 100%; height: 100%; }
/* Printed on, not pasted: a hairline inner shadow, and a faint still gloss on the photo only */
.x-s24-pol-photo::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 0 .5px rgb(42 18 6 / .35), inset 0 1px 3px rgb(42 18 6 / .25);
  background: linear-gradient(155deg, rgb(255 255 255 / .12), transparent 38%); }
.x-s24-cap { position: absolute; left: 6%; right: 6%; bottom: 0; height: calc(var(--pw) * .18); display: grid; place-items: center; overflow: hidden; white-space: nowrap;
  font: italic 400 calc(var(--pw) * .085) / 1 var(--font-display); color: var(--brand-kuri); letter-spacing: .01em; rotate: -1.2deg; }
.x-s24-tape { position: absolute; z-index: 2; top: calc(var(--pw) * -.06); left: 50%; width: 42%; height: calc(var(--pw) * .12); translate: -50% 0; rotate: -4deg; opacity: .8;
  background: color-mix(in oklab, var(--brand-sabi) 30%, var(--brand-paper-bright)); mask: linear-gradient(90deg, transparent 0, #000 3px calc(100% - 3px), transparent 100%); box-shadow: 0 1px 1px rgb(66 26 5 / .12); }
.x-s24-controls { display: flex; flex-direction: column; align-items: center; gap: 0; }
.x-s24-row { display: flex; align-items: center; gap: var(--space-3); }
.x-s24-words { display: flex; flex-direction: column; gap: var(--space-1); max-width: 34rem; }
.x-s24-meta { font: 500 var(--type-small-size) / var(--type-small-leading) var(--font-label); color: var(--ink-soft); }
.x-s24-title { font: 400 var(--type-heading-size) / 1.15 var(--font-display); color: var(--ink); margin: 0; text-wrap: balance; }
.x-s24-body { color: var(--ink-soft); max-width: 62ch; margin-top: var(--space-1); }
.x-s24-body.is-lead { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.x-s24-journey { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); width: 100%; }
.x-s24-list { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; max-width: 44rem; margin: 0 auto; padding: var(--space-5) var(--space-4) var(--space-9);
  background: var(--letter-bg); color: var(--ink-soft); border-radius: var(--radius-section); }
.x-s24-list ol { display: flex; flex-direction: column; gap: var(--space-4); }
.x-s24-list li { display: flex; align-items: flex-start; gap: var(--space-3); }
.x-s24-thumb { flex: none; width: 72px; height: 72px; border-radius: var(--radius-control); background: var(--surface-fill); object-fit: cover; }
.x-s24-root { position: relative; isolation: isolate; min-height: 100svh; display: flex; flex-direction: column; align-items: center; overflow: hidden; color: var(--ink-soft);
  background: var(--paper-live, none) center / cover, var(--surface-paper); background-blend-mode: var(--paper-blend); padding: var(--space-4) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom)); }
.x-s24-h1 { margin: 0; font: 400 var(--type-heading-size) / 1.1 var(--font-display); color: var(--ink); text-align: center; }
.x-s24-region { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); outline: none; touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.x-s24-words { user-select: text; -webkit-user-select: text; }
.x-s24-region:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 4px; border-radius: var(--radius-section); }
.x-s24-kids { --kw: 150px; position: relative; width: calc(var(--kw) * 1.9); height: calc(var(--kw) * 1.62); }
.x-s24-kids .x-s24-pol { --pw: var(--kw); position: absolute; }
.x-s24-kid-b { --pw: calc(var(--kw) * .82) !important; left: 0; top: 0; z-index: 0; }
.x-s24-kid-g { left: calc(var(--kw) * .12); top: calc(var(--kw) * .22); z-index: 1; }
.x-s24-kid-n { left: calc(var(--kw) * .86); top: calc(var(--kw) * .1); z-index: 2; }
.x-s24-kid-tape { position: absolute; z-index: 3; left: -14%; top: 22%; width: 34%; height: calc(var(--kw) * .11); rotate: 58deg; opacity: .82;
  background: color-mix(in oklab, var(--brand-koke) 32%, var(--brand-paper-bright)); mask: linear-gradient(90deg, transparent 0, #000 3px calc(100% - 3px), transparent 100%); }
.x-s24-focus:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 4px; }
`
