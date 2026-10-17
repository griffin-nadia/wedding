import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowRight, Undo2 } from "lucide-react"
import { Photo } from "@/components/photo"
import { STORY_PLAN } from "@/content/story-plan"
import { useLang } from "@/lib/lang"
import { spring, still } from "../../motion"

/**
 * Experiment: our story as a stack of prints on the table. Drag the top print and it follows the finger, turning
 * with the drag; flick it (or drag it far enough) and it flies off with the speed you gave it, while the next one
 * settles up on a spring. The chapter line under the stack cross-fades. The next button and the right arrow key
 * throw the top print too; Undo (and the left arrow key) brings the last one back. The last card is Kyoto.
 * Reduced motion: nothing follows the finger; a swipe or a tap fades to the next print.
 */
const css = `
.x-stack { position: relative; isolation: isolate; min-height: var(--stage-h, 100svh); display: grid; grid-template-rows: auto 1fr auto auto; justify-items: center; gap: 12px; padding: 20px 16px calc(20px + env(safe-area-inset-bottom)); overflow: hidden; background: color-mix(in oklab, var(--letter-bg) 55%, var(--surface-alt)); color: var(--ink); }
.x-stack::before { content: ""; position: absolute; inset: 0; z-index: -1; background-image: var(--paper); background-size: var(--paper-size); opacity: 0.6; pointer-events: none; }
.x-stack-title { margin: 0; font-family: var(--font-display); font-size: var(--type-heading-size); color: var(--ink); }
.x-stack-pile { position: relative; width: 100%; display: grid; place-items: center; touch-action: none; user-select: none; -webkit-user-select: none; outline: none; }
.x-stack-pile:focus-visible .x-stack-card[data-top] { outline: 2px solid var(--input-focus); outline-offset: 6px; border-radius: var(--radius-control); }
.x-stack-card { position: absolute; width: var(--card-w); will-change: transform; cursor: grab; }
.x-stack-pile[data-dragging] .x-stack-card { cursor: grabbing; }
.x-stack-card img { -webkit-user-drag: none; pointer-events: none; }
.x-stack-card .photo-print { --tilt: 0deg; }
.x-stack-kyoto { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; aspect-ratio: 3 / 4; padding: 24px; text-align: center; background: var(--brand-paper-bright); border-radius: var(--radius-control); box-shadow: var(--elevation-paper); color: var(--brand-kogecha); }
.x-stack-seal { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 12px; background: var(--action); color: var(--action-ink); font: 28px/1 var(--font-ja); }
.x-stack-kyoto h3 { margin: 0; font-family: var(--font-display); font-size: var(--type-heading-size); line-height: 1.15; }
.x-stack-lines { display: grid; width: 100%; max-width: 32rem; min-height: 4.5em; text-align: center; }
.x-stack-line { grid-area: 1 / 1; opacity: 0; transition: opacity 320ms var(--ease-paper); }
.x-stack-line[data-on] { opacity: 1; transition-delay: 120ms; }
.x-stack-line p:first-child { font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--ink-story); }
.x-stack-line h2 { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(1.5rem, 5vw, 2rem); line-height: 1.15; color: var(--ink); }
.x-stack-controls { display: flex; gap: 12px; align-items: center; }
.x-stack-btn { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding-inline: 18px; border-radius: var(--radius-pill); border: 1px solid var(--line-strong); background: var(--letter-bg); color: var(--ink); font: 500 var(--type-ui-size) / 1 var(--font-label); transition: transform 160ms var(--ease-paper); }
.x-stack-btn:active:not(:disabled) { transform: scale(0.96); }
.x-stack-btn:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.x-stack-btn:disabled { opacity: 0.4; }
.x-stack-btn-go { background: var(--action); border-color: var(--action); color: var(--action-ink); }
@media (prefers-reduced-motion: reduce) { .x-stack-card { transition: opacity 240ms linear; } }
`
type Fly = { x0: number; y0: number; r0: number; x1: number; y1: number; r1: number; p: number }
// A hand-laid pile: each print sits a little turned, the same way every visit
const TILTS = [-3.5, 4, -2, 5, -4.5, 2.5, -1.5, 3.5, -3]

export default function StoryStack() {
  const { t } = useLang()
  const prints = STORY_PLAN.filter((c) => c.photo)
  const end = STORY_PLAN.find((c) => !c.photo)
  const total = prints.length + (end ? 1 : 0)
  const [top, setTop] = useState(0)
  const topRef = useRef(0), stackPos = useRef(0), drag = useRef({ x: 0, y: 0 }), flies = useRef(new Map<number, Fly>())
  const cancels = useRef(new Map<string, () => void>())
  const pile = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])

  const paint = useCallback(() => {
    const calm = still(), w = pile.current?.clientWidth ?? 400
    cards.current.forEach((el, i) => {
      if (!el) return
      const f = flies.current.get(i)
      if (f) {
        const x = f.x0 + (f.x1 - f.x0) * f.p, y = f.y0 + (f.y1 - f.y0) * f.p, r = f.r0 + (f.r1 - f.r0) * f.p
        el.style.zIndex = String(200 - i)
        el.style.visibility = Math.abs(x) > w / 2 + el.offsetWidth * 1.2 ? "hidden" : ""
        el.style.transform = calm ? "" : `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`
        el.style.opacity = calm ? (f.p > 0.5 ? "0" : "1") : "1"
        return
      }
      const d = Math.max(0, i - stackPos.current), lift = Math.min(1, d)
      const isTop = i === topRef.current
      const dx = isTop ? drag.current.x : 0, dy = isTop ? drag.current.y : 0
      el.style.zIndex = String(100 - i)
      el.style.visibility = d > 4 ? "hidden" : ""
      el.style.opacity = calm ? "1" : String(Math.max(0, Math.min(1, 4 - d)))
      // The top print sits nearly straight and turns with the drag; the ones under it peek out, smaller and turned
      const r = TILTS[i % TILTS.length] * (0.35 + 0.65 * lift) + dx * 0.06
      el.style.transform = calm ? `rotate(${TILTS[i % TILTS.length] * 0.35}deg)` : `translate3d(${dx}px, ${dy + d * 12}px, 0) scale(${1 - d * 0.045}) rotate(${r}deg)`
    })
  }, [])
  useLayoutEffect(() => { paint() })
  useEffect(() => { const c = cancels.current; return () => c.forEach((f) => f()) }, [])

  const run = (name: string, cancel: () => void) => { cancels.current.get(name)?.(); cancels.current.set(name, cancel) }
  const settle = (to: number) => run("stack", spring(stackPos.current, to, (v) => { stackPos.current = v; paint() }, { k: 200, c: 18 }))

  /** Throw the top print off in a direction, with the speed it was let go at (px per ms) */
  const toss = (dir: number, vx = 0, vy = 0) => {
    const i = topRef.current
    if (i >= total - 1) { // the last card (Kyoto) stays: it just springs back
      const from = { ...drag.current }
      run("drag", spring(1, 0, (p) => { drag.current = { x: from.x * p, y: from.y * p }; paint() }, { k: 300, c: 20 }))
      return
    }
    const w = pile.current?.clientWidth ?? 400, el = cards.current[i]
    const f: Fly = { x0: drag.current.x, y0: drag.current.y, r0: TILTS[i % TILTS.length] * 0.35 + drag.current.x * 0.06, x1: dir * (w / 2 + (el?.offsetWidth ?? 300) * 1.4), y1: drag.current.y + Math.max(-240, Math.min(240, vy * 260)), r1: dir * 28, p: 0 }
    flies.current.set(i, f)
    drag.current = { x: 0, y: 0 }
    cancels.current.get("drag")?.()
    const dist = Math.abs(f.x1 - f.x0) || 1
    run(`fly-${i}`, spring(0, 1, (p) => { f.p = p; paint() }, { k: 90, c: 16, v: Math.min(8, Math.abs(vx * 1000) / dist) }))
    topRef.current = i + 1; setTop(i + 1); settle(i + 1)
  }
  const undo = () => {
    const i = topRef.current - 1
    const f = flies.current.get(i)
    if (i < 0 || !f) return
    cancels.current.get(`fly-${i}`)?.()
    topRef.current = i; setTop(i)
    // Back along the way it went, landing on the pile with a little settle
    f.x0 = 0; f.y0 = 0; f.r0 = TILTS[i % TILTS.length] * 0.35
    run(`fly-${i}`, spring(f.p, 0, (p, done) => { f.p = p; if (done) flies.current.delete(i); paint() }, { k: 160, c: 17 }))
    settle(i)
  }

  // Dragging the top print: it follows the finger; a flick or a long drag throws it, otherwise it springs back
  useEffect(() => {
    const el = pile.current
    if (!el) return
    let start: { x: number; y: number; id: number } | null = null, moved = false, samples: [number, number, number][] = []
    const down = (e: PointerEvent) => {
      const card = (e.target as Element).closest<HTMLElement>("[data-card]")
      if (e.button !== 0 || !card || Number(card.dataset.card) !== topRef.current) return
      start = { x: e.clientX, y: e.clientY, id: e.pointerId }; moved = false; samples = [[e.timeStamp, e.clientX, e.clientY]]
      cancels.current.get("drag")?.()
      el.setPointerCapture(e.pointerId); el.dataset.dragging = ""
    }
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const dx = e.clientX - start.x, dy = e.clientY - start.y
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
      samples.push([e.timeStamp, e.clientX, e.clientY]); if (samples.length > 6) samples.shift()
      if (still()) return
      drag.current = { x: dx, y: dy * 0.6 }; paint()
    }
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const s = start; start = null; delete el.dataset.dragging
      const [t0, x0, y0] = samples[0], [t1, x1, y1] = samples[samples.length - 1]
      const vx = (x1 - x0) / Math.max(1, t1 - t0), vy = (y1 - y0) / Math.max(1, t1 - t0)
      const dx = e.clientX - s.x
      if (!moved) return
      if (Math.abs(vx) > 0.45 || Math.abs(dx) > Math.min(140, el.clientWidth * 0.3)) toss(Math.sign(Math.abs(vx) > 0.45 ? vx : dx), vx, vy)
      else { const from = { ...drag.current }; run("drag", spring(1, 0, (p) => { drag.current = { x: from.x * p, y: from.y * p }; paint() }, { k: 320, c: 20 })) }
    }
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const line = (i: number) => {
    const c = i < prints.length ? prints[i] : end!
    return <>
      <p>{t.story.page(i + 1, total)}, {c.year}{c.place ? ` · ${c.place}` : ""}</p>
      <h2>{c.title}</h2>
    </>
  }
  return (
    <div className="x-stack" style={{ "--card-w": "min(68vw, 34svh, 340px)" } as React.CSSProperties}>
      <style>{css}</style>
      <h1 className="x-stack-title">{t.story.title}</h1>
      <div ref={pile} className="x-stack-pile" role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); toss(1, 1.2) }
          if (e.key === "ArrowLeft") { e.preventDefault(); undo() }
        }}>
        {prints.map((c, i) => (
          <div key={c.key} ref={(el) => { cards.current[i] = el }} data-card={i} data-top={i === top || undefined} className="x-stack-card"
            role="group" aria-roledescription="slide" aria-label={t.story.slide(i + 1, total)} aria-hidden={i !== top || undefined}>
            <Photo name={c.photo!} treatment="print" vary sizes="340px" alt={`${c.title}, ${c.year}`} />
          </div>
        ))}
        {end && (
          <div ref={(el) => { cards.current[prints.length] = el }} data-card={prints.length} data-top={top === prints.length || undefined} className="x-stack-card"
            role="group" aria-roledescription="slide" aria-label={t.story.slide(total, total)} aria-hidden={top !== prints.length || undefined}>
            <div className="x-stack-kyoto">
              <span className="x-stack-seal" aria-hidden>京</span>
              <h3>{end.title}</h3>
              {end.body.map((p, k) => <p key={k} className="text-small">{p}</p>)}
            </div>
          </div>
        )}
      </div>
      <div className="x-stack-lines" aria-live="polite">
        {Array.from({ length: total }, (_, i) => <div key={i} className="x-stack-line" data-on={i === top || undefined} aria-hidden={i !== top || undefined}>{line(i)}</div>)}
      </div>
      <div className="x-stack-controls">
        <button type="button" className="x-stack-btn" onClick={undo} disabled={top === 0} aria-label={t.story.prevChapter}><Undo2 className="size-5" aria-hidden /></button>
        <button type="button" className="x-stack-btn x-stack-btn-go" onClick={() => toss(top % 2 ? -1 : 1, 1.2)} disabled={top >= total - 1}>{t.story.nextChapter}<ArrowRight className="size-5" aria-hidden /></button>
      </div>
    </div>
  )
}
