import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useContent, type Chapter } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { useOption } from "@/lib/options"
import { StoryJourney } from "@/components/story-journey"
import { cn } from "@/lib/utils"

/** Journey A · the letter continues (default): chapters as pages of the letter. Swipe or arrows on phones, side by side from 1024. No photos. */
function StoryLetter({ chapters }: { chapters: Chapter[] }) {
  const { t } = useLang()
  const row = useRef<HTMLOListElement>(null)
  const [i, setI] = useState(0)
  const go = (n: number) => { const el = row.current?.children[n] as HTMLElement | undefined; el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" }); setI(n) }
  return (
    <div className="flex flex-col gap-4">
      <ol ref={row} className="story-pages" onScroll={(e) => { const el = e.currentTarget; setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))) }}>
        {chapters.map((c) => (
          <li key={c.key} className="story-page">
            <p className="text-sm text-muted-foreground">{c.year}</p>
            <h2 className="font-display text-2xl text-foreground">{c.title}</h2>
            {c.body.map((p, k) => <p key={k}>{p}</p>)}
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between lg:hidden">
        <button type="button" className="utility-btn" onClick={() => go(Math.max(0, i - 1))} disabled={i === 0} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span className="text-sm text-muted-foreground" aria-live="polite">{t.story.page(i + 1, chapters.length)}</span>
        <button type="button" className="utility-btn" onClick={() => go(Math.min(chapters.length - 1, i + 1))} disabled={i === chapters.length - 1} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
    </div>
  )
}

/** Journey B · storybook map: stops on one path; tap a stop and the letter shows its chapter. The painted plate replaces the paper strip later. */
function StoryMap({ chapters }: { chapters: Chapter[] }) {
  const [on, setOn] = useState(0)
  const c = chapters[on]
  const xs = chapters.map((_, i) => 14 + (72 * i) / Math.max(1, chapters.length - 1))
  return (
    <div className="flex flex-col gap-6">
      <div className="trail-plate">
        <div className="trail-track">
          <svg viewBox="0 0 600 72" preserveAspectRatio="none" className="trail-svg" aria-hidden>
            <path d="M84 36 C 156 8, 228 64, 300 36 S 444 8, 516 36" pathLength={1} vectorEffect="non-scaling-stroke" className="trail-path is-drawn" />
          </svg>
          <div role="tablist" aria-label="Our story" className="trail-stops is-drawn">
            {chapters.map((ch, i) => (
              <button key={ch.key} role="tab" aria-selected={on === i} onClick={() => setOn(i)} className={cn("trail-stop is-drawn story-stop", on === i && "is-on")} style={{ left: `${xs[i]}%` }}>
                <span className="trail-icon">{i + 1}</span>
                <span className="trail-text"><span className="font-medium text-foreground">{ch.title}</span><span className="text-sm">{ch.year}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <section role="tabpanel" aria-label={c.title} className="flex flex-col gap-3">
        <h2 className="font-display text-2xl text-foreground">{c.title}</h2>
        {c.body.map((p, k) => <p key={k}>{p}</p>)}
      </section>
    </div>
  )
}

/** Journey C · timeline: year on one side, the moment on the other, the line draws in. */
function StoryTimeline({ chapters }: { chapters: Chapter[] }) {
  return (
    <ol className="timeline">
      <span aria-hidden className="timeline-line" />
      <span aria-hidden className="timeline-line timeline-fill" />
      {chapters.map((c, i) => (
        <li key={c.key} className={cn("timeline-row is-seen", i % 2 ? "is-right" : "is-left")}>
          <p className="timeline-time numerals text-foreground">{c.year}</p>
          <span aria-hidden className="timeline-icon">{i + 1}</span>
          <div className="timeline-text"><p className="font-medium text-foreground">{c.title}</p>{c.body.slice(0, 1).map((p, k) => <p key={k} className="text-sm">{p}</p>)}</div>
        </li>
      ))}
    </ol>
  )
}

/**
 * Journey D · card stack (v3 S, the pick): the chapters as paper cards in a loose pile. Drag the top card
 * left or right past a third of its width (or flick it) and it slides to the back; let go short and it
 * springs home. Previous / next buttons and the arrow keys do the same. Still under reduced motion.
 */
function StoryStack({ chapters }: { chapters: Chapter[] }) {
  const { t } = useLang()
  const [top, setTop] = useState(0)
  const [dx, setDx] = useState(0)
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0)
  const start = useRef<{ x: number; t: number } | null>(null)
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const n = chapters.length
  const go = (dir: 1 | -1) => {
    if (still) { setTop((v) => (v + dir + n) % n); setDx(0); return }
    setLeaving(dir)
    window.setTimeout(() => { setTop((v) => (v + dir + n) % n); setLeaving(0); setDx(0) }, 280)
  }
  const order = chapters.map((_, k) => (top + k) % n)
  return (
    <div className="flex flex-col gap-4">
      <div className="story-stack" role="group" aria-roledescription="card stack" aria-label={t.story.title}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1) }}>
        {order.slice().reverse().map((ci) => {
          const depth = order.indexOf(ci), c = chapters[ci], isTop = depth === 0
          const x = isTop ? (leaving ? leaving * -420 : dx) : 0
          return (
            <article key={c.key} aria-hidden={!isTop} tabIndex={isTop ? 0 : -1} className="story-card"
              style={{ transform: `translate(${x}px, ${depth * 8}px) rotate(${isTop ? x / 24 : [0, -2, 2.5, -1.5][depth % 4]}deg) scale(${1 - depth * 0.03})`, zIndex: n - depth, transition: start.current && isTop ? "none" : undefined, opacity: depth > 2 ? 0 : 1 }}
              onPointerDown={isTop ? (e) => { start.current = { x: e.clientX, t: performance.now() }; (e.target as Element).setPointerCapture?.(e.pointerId) } : undefined}
              onPointerMove={isTop ? (e) => { if (start.current) setDx(e.clientX - start.current.x) } : undefined}
              onPointerUp={isTop ? (e) => {
                const s = start.current; start.current = null; if (!s) return
                const d = e.clientX - s.x, v = Math.abs(d) / Math.max(1, performance.now() - s.t), w = (e.currentTarget as HTMLElement).offsetWidth
                if (Math.abs(d) > Math.min(w / 3, 140) || v > 0.6) go(d < 0 ? 1 : -1); else setDx(0)
              } : undefined}
              onPointerCancel={isTop ? () => { start.current = null; setDx(0) } : undefined}>
              <p className="text-sm text-muted-foreground">{c.year}</p>
              <h2 className="font-display text-2xl text-foreground">{c.title}</h2>
              {c.body.map((p, k) => <p key={k}>{p}</p>)}
            </article>
          )
        })}
      </div>
      <div className="flex items-center justify-between">
        <button type="button" className="utility-btn" onClick={() => go(-1)} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span className="text-sm text-muted-foreground" aria-live="polite">{t.story.page(top + 1, n)}</span>
        <button type="button" className="utility-btn" onClick={() => go(1)} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
    </div>
  )
}

/** Our story (hidden until the story text exists in the Content tab): the journey map (their Figma plan) by default; the card stack, letter pages and timeline as options. */
export function StoryPage() {
  const { t } = useLang()
  const { story, ready } = useContent()
  const view = useOption("story")
  const journey = useOption("mapmode") !== "trail"
  const flying = useOption("flying") === "on"
  const mapDrag = useOption("mapdrag") === "drag"
  if (ready && story.length) {
    return (
      <>
        <h1 className="heading">{t.story.title}</h1>
        {view === "d" ? <StoryStack chapters={story} /> : !view || view === "b" ? (journey
          ? <StoryJourney chapters={story} showFlying={flying} drag={mapDrag} />
          : <StoryMap chapters={story} />) : view === "c" ? <StoryTimeline chapters={story} /> : <StoryLetter chapters={story} />}
      </>
    )
  }
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="heading">{t.letter.comingSoon}</h1>
        <p>{t.story.soonBody}</p>
      </div>
    </div>
  )
}
