import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Photo } from "@/components/photo"
import { STORY_PLAN } from "@/content/story-plan"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { getSpeed, spring, still } from "../../motion"

/**
 * Experiment: the prints scattered on an endless paper table. Drag anywhere to pan (it carries on with the speed you
 * let go at, then slows); the table wraps, so it never ends. Tap a print and it lifts to the middle with its chapter
 * words; Done, Escape or a tap outside puts it back. Light on phones: only transforms move, and prints off screen
 * aren't drawn. Keyboard: Tab moves through the prints (the table pans to each), the arrow keys pan.
 * Reduced motion: no glide after a drag, and the print fades up in place of the lift.
 */
const css = `
.x-table { position: relative; isolation: isolate; height: 100svh; min-height: 100svh; overflow: hidden; background-color: color-mix(in oklab, var(--letter-bg) 55%, var(--surface-alt)); touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; outline: none; }
.x-table[data-dragging] { cursor: grabbing; }
.x-table::before { content: ""; position: absolute; inset: 0; z-index: -1; background-image: var(--texture-fibre), var(--texture-grain); background-size: 512px, 256px; background-position: var(--bg-pos); opacity: var(--texture-opacity); mix-blend-mode: var(--texture-blend); pointer-events: none; }
.x-table-print { position: absolute; left: 0; top: 0; width: var(--card-w); padding: 0; border-radius: var(--radius-control); background: none; will-change: transform; cursor: pointer; }
.x-table-print:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 6px; }
.x-table-print img { -webkit-user-drag: none; pointer-events: none; }
.x-table-print .photo-print { --tilt: 0deg; transition: box-shadow 200ms var(--ease-paper); }
.x-table-print:hover .photo-print { box-shadow: 0 30px 50px -24px rgb(var(--tint-shadow) / 0.4); }
.x-table-kyoto { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; aspect-ratio: 3 / 4; padding: 16px; text-align: center; background: var(--brand-paper-bright); border-radius: var(--radius-control); box-shadow: var(--elevation-paper); color: var(--brand-kogecha); font-family: var(--font-display); font-size: 1.125rem; line-height: 1.2; }
.x-table-seal { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 10px; background: var(--action); color: var(--action-ink); font: 22px/1 var(--font-ja); }
.x-table-label { position: absolute; left: 16px; top: 16px; z-index: 3; margin: 0; padding: 6px 14px; border-radius: var(--radius-pill); background: var(--letter-bg); box-shadow: var(--elevation-raised); font-family: var(--font-display); font-size: 1.25rem; color: var(--ink); pointer-events: none; }
.x-lift { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; padding: 16px; }
.x-lift-scrim { position: absolute; inset: 0; background: color-mix(in oklab, var(--surface-alt) 60%, transparent); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: x-lift-fade 300ms var(--ease-paper) both; }
.x-lift[data-closing] .x-lift-scrim { animation: x-lift-fade 240ms var(--ease-paper) reverse both; }
@keyframes x-lift-fade { from { opacity: 0; } }
.x-lift-body { position: relative; display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 880px; }
@media (min-width: 900px) { .x-lift-body { flex-direction: row; justify-content: center; gap: 48px; } }
.x-lift-print { width: min(78vw, 40svh, 380px); flex-shrink: 0; transform-origin: 50% 50%; }
.x-lift-print .photo-print { --tilt: 0deg; box-shadow: 0 40px 80px -30px rgb(var(--tint-shadow) / 0.5); }
.x-lift-words { max-width: 22rem; text-align: center; animation: x-lift-words 420ms var(--ease-paper) 220ms both; }
@media (min-width: 900px) { .x-lift-words { text-align: left; } }
.x-lift[data-closing] .x-lift-words { animation: x-lift-fade 160ms linear reverse both; }
@keyframes x-lift-words { from { opacity: 0; transform: translateY(10px); } }
.x-lift-words p:first-child { font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--ink-story); }
.x-lift-words h2 { margin: 6px 0 16px; font-family: var(--font-display); font-size: clamp(1.75rem, 5vw, 2.5rem); line-height: 1.1; color: var(--ink); outline: none; }
.x-lift-done { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding-inline: 18px; border-radius: var(--radius-pill); background: var(--action); color: var(--action-ink); font: 500 var(--type-ui-size) / 1 var(--font-label); }
.x-lift-done:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .x-lift-words { animation: x-lift-fade 240ms linear both; } }
`
// Where each print lies on one tile of the table (in units of a print's width), and how it's turned
const LAY: [number, number, number][] = [[0.3, 0.35, -4], [1.85, 0.15, 3], [3.35, 0.55, -2], [0.75, 1.95, 5], [2.3, 1.75, -3.5], [3.75, 2.15, 2], [0.2, 3.45, 2.5], [1.75, 3.35, -5], [3.2, 3.7, 3.5]]
const TILE = { w: 4.9, h: 4.9 } // a tile, in print widths
const COPIES = [-1, 0, 1]
const mod = (a: number, n: number) => ((a % n) + n) % n

export default function StoryCanvas() {
  const { t } = useLang()
  const items = STORY_PLAN.slice(0, LAY.length)
  const total = STORY_PLAN.length
  const table = useRef<HTMLDivElement>(null)
  const els = useRef<(HTMLButtonElement | null)[]>([])
  const off = useRef({ x: 0, y: 0 }), size = useRef({ w: 390, h: 844, cw: 160 })
  const glide = useRef<() => void>(() => {})
  const dragged = useRef(false)
  const [lifted, setLifted] = useState<{ i: number; from: HTMLElement } | null>(null)

  const paint = useCallback(() => {
    const { w, h, cw } = size.current, tw = TILE.w * cw, th = TILE.h * cw
    const el = table.current
    if (el) el.style.setProperty("--bg-pos", `${mod(off.current.x, 512)}px ${mod(off.current.y, 512)}px, ${mod(off.current.x, 256)}px ${mod(off.current.y, 256)}px`)
    const best = new Map<number, [number, HTMLButtonElement]>()
    els.current.forEach((b, n) => {
      if (!b) return
      const i = Math.floor(n / 9), kx = COPIES[n % 3], ky = COPIES[Math.floor(n / 3) % 3]
      const [ux, uy, r] = LAY[i]
      const x = mod(ux * cw + off.current.x, tw) + kx * tw - cw * 0.6, y = mod(uy * cw + off.current.y, th) + ky * th - cw * 0.8
      const on = x > -cw * 1.4 && x < w + cw * 0.2 && y > -cw * 1.6 && y < h + cw * 0.2
      b.style.visibility = on ? "" : "hidden"
      b.tabIndex = -1; b.setAttribute("aria-hidden", "true")
      if (!on) return
      b.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)`
      const dist = Math.hypot(x + cw / 2 - w / 2, y + cw / 2 - h / 2)
      const prev = best.get(i)
      if (!prev || dist < prev[0]) best.set(i, [dist, b])
    })
    // One copy of each print in the tab order: the one nearest the middle
    best.forEach(([, b]) => { b.tabIndex = 0; b.removeAttribute("aria-hidden") })
  }, [])

  useLayoutEffect(() => {
    const el = table.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight
      size.current = { w, h, cw: Math.round(Math.min(260, Math.max(140, Math.min(w, h * 0.8) * 0.4))) }
      el.style.setProperty("--card-w", `${size.current.cw}px`)
      paint()
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el)
    // Tab to a print off screen scrolls the clipped table itself; undo that, the pan brings it into view instead
    const unscroll = () => { el.scrollTop = 0; el.scrollLeft = 0 }
    el.addEventListener("scroll", unscroll)
    return () => { ro.disconnect(); glide.current(); el.removeEventListener("scroll", unscroll) }
  }, [paint])

  const panBy = (dx: number, dy: number) => { off.current = { x: off.current.x + dx, y: off.current.y + dy }; paint() }
  const panTo = (dx: number, dy: number) => {
    glide.current()
    const from = { ...off.current }
    glide.current = spring(0, 1, (p) => { off.current = { x: from.x + dx * p, y: from.y + dy * p }; paint() }, { k: 120, c: 22 })
  }

  // Panning: the table follows the pointer, then glides on with the speed it was let go at
  useEffect(() => {
    const el = table.current
    if (!el) return
    let start: { x: number; y: number; id: number; lx: number; ly: number } | null = null, samples: [number, number, number][] = []
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      glide.current()
      start = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, id: e.pointerId }; dragged.current = false; samples = [[e.timeStamp, e.clientX, e.clientY]]
    }
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      if (!dragged.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return
      if (!dragged.current) { dragged.current = true; el.setPointerCapture(e.pointerId); el.dataset.dragging = "" }
      panBy(e.clientX - start.lx, e.clientY - start.ly)
      start.lx = e.clientX; start.ly = e.clientY
      samples.push([e.timeStamp, e.clientX, e.clientY]); if (samples.length > 6) samples.shift()
    }
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      start = null; delete el.dataset.dragging
      if (!dragged.current || still()) return
      const [t0, x0, y0] = samples[0], [t1, x1, y1] = samples[samples.length - 1]
      const age = e.timeStamp - t1
      if (age > 80) return // held still before letting go: no glide
      let vx = (x1 - x0) / Math.max(1, t1 - t0), vy = (y1 - y0) / Math.max(1, t1 - t0), then = performance.now()
      glide.current()
      glide.current = loop((now) => {
        const dt = Math.min(32, now - then) * getSpeed(); then = now
        panBy(vx * dt, vy * dt)
        const f = Math.pow(0.94, dt / 16.7); vx *= f; vy *= f
        return Math.hypot(vx, vy) > 0.01
      })
    }
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const words = (i: number) => {
    const c = items[i]
    return <>
      <p>{t.story.page(i + 1, total)}, {c.year}{c.place ? ` · ${c.place}` : ""}</p>
      <h2 id="x-lift-title" tabIndex={-1}>{c.title}</h2>
      {c.body.map((p, k) => <p key={k} className="mb-4">{p}</p>)}
    </>
  }

  return (
    <>
      <style>{css}</style>
      <div ref={table} className="x-table" role="region" aria-label={t.story.title} tabIndex={0} inert={lifted ? true : undefined}
        onKeyDown={(e) => {
          const step = 120, k = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key]
          if (k) { e.preventDefault(); panTo(k[0], k[1]) }
        }}>
        <p className="x-table-label">{t.story.title}</p>
        {items.flatMap((c, i) => Array.from({ length: 9 }, (_, n) => (
          <button key={`${c.key}-${n}`} type="button" ref={(el) => { els.current[i * 9 + n] = el }} className="x-table-print" tabIndex={-1}
            aria-label={`${c.title}, ${c.year}`}
            onFocus={(e) => {
              // Bring a print reached by Tab into the middle of the screen
              const r = e.currentTarget.getBoundingClientRect(), { w, h } = size.current
              if (r.left < 0 || r.right > w || r.top < 0 || r.bottom > h) panTo(w / 2 - (r.left + r.width / 2), h / 2 - (r.top + r.height / 2))
            }}
            onClick={(e) => { if (dragged.current && e.detail !== 0) return; glide.current(); setLifted({ i, from: e.currentTarget }) }}>
            {c.photo
              ? <Photo name={c.photo} treatment="print" vary sizes="260px" alt="" />
              : <span className="x-table-kyoto"><span className="x-table-seal" aria-hidden>京</span>{c.title}</span>}
          </button>
        )))}
      </div>
      {lifted && <Lifted key={lifted.i} i={lifted.i} from={lifted.from} words={words(lifted.i)} photo={items[lifted.i].photo} title={items[lifted.i].title}
        done={t.story.done} onClose={() => { const b = lifted.from; setLifted(null); b.focus({ preventScroll: true }) }} />}
    </>
  )
}

/** The lifted print: it rises from where it lay to the middle (FLIP, Web Animations, so the lab's speed applies) */
function Lifted({ i, from, words, photo, title, done, onClose }: { i: number; from: HTMLElement; words: React.ReactNode; photo?: string; title: string; done: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null), print = useRef<HTMLDivElement>(null), btn = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const flip = (reverse: boolean) => {
    const el = print.current
    if (!el) return null
    const a = from.getBoundingClientRect(), b = el.getBoundingClientRect()
    const s = a.width / b.width
    const there = { transform: `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${s}) rotate(${LAY[i][2]}deg)` }
    const here = { transform: "none" }
    if (still()) return el.animate([{ opacity: reverse ? 1 : 0 }, { opacity: reverse ? 0 : 1 }], { duration: 240, fill: "both" })
    return el.animate(reverse ? [here, there] : [there, here], { duration: reverse ? 380 : 560, easing: reverse ? "cubic-bezier(0.4, 0, 0.2, 1)" : "cubic-bezier(0.2, 0.9, 0.2, 1.06)", fill: "both" })
  }
  useLayoutEffect(() => {
    from.style.visibility = "hidden"
    flip(false)
    btn.current?.focus({ preventScroll: true })
    return () => { from.style.visibility = "" }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const close = () => {
    if (closing.current) return
    closing.current = true
    box.current?.setAttribute("data-closing", "")
    const a = flip(true)
    if (a) a.onfinish = onClose; else onClose()
  }
  return (
    <div ref={box} className="x-lift" role="dialog" aria-modal="true" aria-labelledby="x-lift-title" onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); close() } if (e.key === "Tab") { e.preventDefault(); btn.current?.focus() } }}>
      <div className="x-lift-scrim" onClick={close} aria-hidden />
      <div className="x-lift-body">
        <div ref={print} className="x-lift-print">
          {photo
            ? <Photo name={photo} treatment="print" vary sizes="(min-width: 900px) 380px, 78vw" alt={title} />
            : <span className="x-table-kyoto"><span className="x-table-seal" aria-hidden>京</span></span>}
        </div>
        <div className="x-lift-words">
          {words}
          <button ref={btn} type="button" className="x-lift-done" onClick={close}><X className="size-5" aria-hidden />{done}</button>
        </div>
      </div>
    </div>
  )
}
