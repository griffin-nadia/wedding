import { useEffect, useRef, type CSSProperties } from "react"
import { ChevronDown } from "lucide-react"
import { Photo } from "@/components/photo"
import { STORY_PLAN } from "@/content/story-plan"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { still } from "../../motion"

/**
 * Experiment: our story on a strip of film. Scrolling down moves the strip sideways under a window; the frame in the
 * middle grows and its chapter words show underneath. CSS scroll-driven animations (a view timeline on the tall
 * track) where the browser has them; elsewhere a scroll listener on the shared frame loop writes the same values.
 * Sprocket holes are CSS gradients. Reduced motion: no scroll-linked motion, just the strip to swipe through, each
 * frame with its words under it.
 */
const css = `
.x-film { --fw: min(64vw, 52svh, 560px); --gap: 14px; --step: calc(var(--fw) + var(--gap)); --band: 30px; position: relative; isolation: isolate; background: color-mix(in oklab, var(--letter-bg) 60%, var(--surface-alt)); color: var(--ink); min-height: 100svh; }
.x-film::before { content: ""; position: fixed; inset: 0; z-index: -1; background-image: var(--paper); background-size: var(--paper-size); opacity: 0.6; pointer-events: none; }
.x-film-intro { min-height: 72svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px 16px; text-align: center; }
.x-film-intro h1 { margin: 0; font-family: var(--font-display); font-size: clamp(2.5rem, 10vw, 4.5rem); line-height: 1; color: var(--ink); }
.x-film-intro p { color: var(--ink-story); font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; }
.x-film-cue { color: var(--ink-muted); animation: x-film-bob 1.8s ease-in-out infinite; }
@keyframes x-film-bob { 50% { transform: translateY(6px); } }
.x-film-track { position: relative; view-timeline: --x-film block; }
.x-film-sticky { position: sticky; top: 0; height: 100svh; overflow: hidden; }
.x-film-strip { position: absolute; left: 50%; top: 50%; display: flex; gap: var(--gap); padding: var(--band) var(--gap); margin-left: calc(var(--fw) / -2 - var(--gap)); translate: 0 -62%; background: var(--brand-ink-deep, #2a1a10); box-shadow: 0 30px 60px -30px rgb(var(--tint-shadow) / 0.6); will-change: transform; }
.x-film-strip::before, .x-film-strip::after { content: ""; position: absolute; left: 0; right: 0; height: 12px; background: repeating-linear-gradient(90deg, transparent 0 9px, var(--film-hole) 9px 21px, transparent 21px 30px); border-radius: 2px; }
.x-film-strip::before { top: 9px; } .x-film-strip::after { bottom: 9px; }
.x-film { --film-hole: color-mix(in oklab, var(--letter-bg) 60%, var(--surface-alt)); }
[data-theme="lantern"] .x-film { --film-hole: color-mix(in oklab, var(--letter-bg) 70%, var(--ink) 30%); }
[data-theme="lantern"] .x-film-strip { outline: 1px solid color-mix(in oklab, var(--ink) 18%, transparent); }
.x-film-frame { position: relative; width: var(--fw); flex-shrink: 0; transform-origin: 50% 50%; will-change: transform; }
.x-film-frame figure { margin: 0; }
.x-film-frame figure > div { aspect-ratio: 3 / 2 !important; border-radius: 2px !important; }
.x-film-frame .photo-placeholder { background: color-mix(in oklab, var(--brand-wara) 70%, var(--brand-ink-deep, #2a1a10)); }
.x-film-kyoto { display: grid; place-items: center; aspect-ratio: 3 / 2; border-radius: 2px; background: var(--brand-paper-bright); }
.x-film-seal { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 14px; background: var(--action); color: var(--action-ink); font: 32px/1 var(--font-ja); }
.x-film-no { position: absolute; left: 4px; bottom: calc(var(--band) * -1 + 8px); font: 500 10px/1 var(--font-label); letter-spacing: 0.12em; color: var(--brand-hachimitsu, #d9a441); opacity: 0.8; }
.x-film-words { position: absolute; left: 0; right: 0; top: calc(50% + var(--fw) * 0.25 + 40px); display: grid; padding: 0 16px; }
.x-film-word { grid-area: 1 / 1; text-align: center; max-width: 32rem; margin-inline: auto; }
.x-film-word p:first-child, .x-film-cap p:first-child { font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--ink-story); }
.x-film-word h2, .x-film-cap h2 { margin: 6px 0 0; font-family: var(--font-display); font-size: clamp(1.5rem, 5vw, 2.25rem); line-height: 1.15; color: var(--ink); }
.x-film-word p + h2 + p { margin-top: 8px; color: var(--ink-soft); }
.x-film-cap { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.x-film-end { min-height: 40svh; }

/* Scroll-driven: the strip slides along the track's timeline; each frame grows, and its words show, as it passes the middle */
@supports (animation-timeline: view()) {
  .x-film[data-css] .x-film-strip { animation: x-film-move linear both; animation-timeline: --x-film; animation-range: contain 0% contain 100%; }
  .x-film[data-css] .x-film-frame { animation: x-film-focus linear both; animation-timeline: --x-film; }
  .x-film[data-css] .x-film-word { animation: x-film-show linear both; animation-timeline: --x-film; }
}
@keyframes x-film-move { from { transform: translateX(0); } to { transform: translateX(calc((var(--n) - 1) * var(--step) * -1)); } }
@keyframes x-film-focus { 0%, 100% { transform: scale(0.86); } 50% { transform: scale(1); } }
@keyframes x-film-show { 0%, 22% { opacity: 0; transform: translateY(10px); } 42%, 58% { opacity: 1; transform: none; } 78%, 100% { opacity: 0; transform: translateY(-6px); } }

@media (prefers-reduced-motion: reduce) {
  .x-film-cue { animation: none; }
  .x-film-track { height: auto !important; }
  .x-film-sticky { position: static; height: auto; display: block; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 32px; }
  .x-film-strip { position: relative; left: auto; top: auto; translate: none; margin: 0; width: max-content; animation: none !important; transform: none !important; padding-inline: calc(50vw - var(--fw) / 2); background: none; box-shadow: none; }
  .x-film-strip::before, .x-film-strip::after { display: none; }
  .x-film-frame { animation: none !important; transform: none !important; scroll-snap-align: center; }
  .x-film-no { display: none; }
  .x-film-cap { position: static; width: auto; height: auto; overflow: visible; clip-path: none; white-space: normal; padding-top: 16px; text-align: center; }
  .x-film-words { display: none; }
}
`
export default function StoryFilmstrip() {
  const { t } = useLang()
  const frames = STORY_PLAN
  const n = frames.length
  const root = useRef<HTMLDivElement>(null), track = useRef<HTMLElement>(null), strip = useRef<HTMLDivElement>(null)
  // ?js uses the fallback even where the browser has scroll-driven animations (to compare them)
  const css3 = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()") && !new URLSearchParams(location.search).has("js")

  // The fallback: one scroll listener, painting on the shared frame loop at most once a frame
  useEffect(() => {
    if (css3 || still()) return
    const el = track.current, s = strip.current
    if (!el || !s) return
    let queued = false
    const paint = () => {
      queued = false
      const r = el.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)))
      const step = (s.firstElementChild as HTMLElement | null)?.offsetWidth ?? 300
      const gap = 14, at = p * (n - 1)
      s.style.transform = `translateX(${-at * (step + gap)}px)`
      ;[...s.children].forEach((f, i) => { const d = Math.min(1, Math.abs(i - at)); (f as HTMLElement).style.transform = `scale(${1 - d * 0.14})` })
      root.current?.querySelectorAll<HTMLElement>(".x-film-word").forEach((w, i) => { const d = Math.abs(i - at); w.style.opacity = String(Math.max(0, Math.min(1, (0.6 - d) * 3.3))) })
      return false
    }
    const onScroll = () => { if (!queued) { queued = true; loop(paint) } }
    onScroll()
    addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll)
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll) }
  }, [css3, n])

  const range = (i: number): CSSProperties => {
    if (!css3) return {}
    const a = ((i - 1) / (n - 1)) * 100, b = ((i + 1) / (n - 1)) * 100
    return { animationRange: `contain ${a}% contain ${b}%` } as CSSProperties
  }
  const words = (i: number) => {
    const c = frames[i]
    return <>
      <p>{t.story.page(i + 1, n)}, {c.year}{c.place ? ` · ${c.place}` : ""}</p>
      <h2>{c.title}</h2>
      {c.body.map((p, k) => <p key={k}>{p}</p>)}
    </>
  }
  return (
    <div ref={root} className="x-film" data-css={css3 || undefined} style={{ "--n": n } as CSSProperties}>
      <style>{css}</style>
      <header className="x-film-intro">
        <p>{STORY_PLAN[0].year} · {STORY_PLAN[n - 1].year}</p>
        <h1>{t.story.title}</h1>
        <ChevronDown className="x-film-cue size-6" aria-hidden />
      </header>
      <section ref={track} className="x-film-track" style={{ height: `${n * 60 + 100}svh` }} aria-label={t.story.title}>
        <div className="x-film-sticky">
          <div ref={strip} className="x-film-strip">
            {frames.map((c, i) => (
              <div key={c.key} className="x-film-frame" style={range(i)} role="group" aria-roledescription="slide" aria-label={t.story.slide(i + 1, n)}>
                {c.photo
                  ? <Photo name={c.photo} treatment="split" sizes="(min-width: 900px) 560px, 64vw" alt={`${c.title}, ${c.year}`} />
                  : <div className="x-film-kyoto"><span className="x-film-seal" aria-hidden>京</span></div>}
                <span className="x-film-no" aria-hidden>{String(i + 1).padStart(2, "0")}A</span>
                <div className="x-film-cap">{words(i)}</div>
              </div>
            ))}
          </div>
          <div className="x-film-words" aria-hidden>
            {frames.map((c, i) => <div key={c.key} className="x-film-word" style={{ ...range(i), opacity: css3 ? undefined : i ? 0 : 1 }}>{words(i)}</div>)}
          </div>
        </div>
      </section>
      <div className="x-film-end" />
    </div>
  )
}
