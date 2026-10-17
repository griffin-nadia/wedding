import { useEffect, useRef, useState, type ReactNode } from "react"
import { BookOpen, CalendarDays, ChevronRight, CircleHelp, Home, TrainFront } from "lucide-react"
import { useLang } from "@/lib/lang"
import { Letter } from "@/components/letter/letter"
import { HomePage } from "@/pages/home"
import { DayPage } from "@/pages/day"
import { TravelPage } from "@/pages/travel"
import { StoryPage } from "@/pages/our-story"
import { FaqsPage } from "@/pages/faqs"
import { Stage } from "../../stage"
import { spring, still } from "../../motion"

/**
 * No tabs: a small paper handle at the bottom with the page you're on. Drag it up (it follows the finger, with
 * resistance past the top) or tap it, and a sheet rises with every page as a big row; let go and it snaps to closed,
 * half or full by where you let go and how fast. Pick a page and it settles closed on that page. Escape closes it
 * and focus goes back to the handle. Reduced motion: it snaps without moving.
 */
const PAGES: { key: "home" | "day" | "travel" | "story" | "faqs"; icon: typeof Home; page: () => ReactNode }[] = [
  { key: "home", icon: Home, page: () => <HomePage /> },
  { key: "day", icon: CalendarDays, page: () => <DayPage /> },
  { key: "travel", icon: TrainFront, page: () => <TravelPage /> },
  { key: "story", icon: BookOpen, page: () => <StoryPage /> },
  { key: "faqs", icon: CircleHelp, page: () => <FaqsPage /> },
]
const PEEK = 76
const css = `
.x-ns-page { position: fixed; inset: 0; overflow-y: auto; padding: var(--space-5) 12px calc(${PEEK}px + 24px); }
.x-ns-page .letter { max-width: var(--letter-width); margin-inline: auto; }
.x-ns-scrim { position: fixed; inset: 0; z-index: 8; background: rgb(var(--tint-shadow) / 0.35); }
.x-ns-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9; height: 92svh; max-width: 640px; margin-inline: auto; display: flex; flex-direction: column; border-radius: var(--radius-letter) var(--radius-letter) 0 0; background: var(--letter-bg); box-shadow: var(--elevation-sheet); will-change: transform; }
.x-ns-head { flex: none; display: flex; flex-direction: column; align-items: center; gap: var(--space-2); width: 100%; min-height: ${PEEK}px; padding: var(--space-2) var(--space-5) var(--space-3); touch-action: none; cursor: grab; border-radius: inherit; outline: 2px solid transparent; outline-offset: -4px; }
.x-ns-head:focus-visible { outline-color: var(--input-focus); }
.x-ns-grip { width: 40px; height: 5px; border-radius: var(--radius-pill); background: var(--line-strong); opacity: 0.6; }
.x-ns-now { display: flex; align-items: center; gap: var(--space-2); font: 500 var(--type-body-size) / 1.2 var(--font-label); color: var(--ink); }
.x-ns-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-2) var(--space-4) calc(var(--space-6) + env(safe-area-inset-bottom)); }
.x-ns-row { display: flex; align-items: center; gap: var(--space-4); min-height: 64px; padding: var(--space-3) var(--space-4); border-radius: var(--radius-section); background: var(--surface-raised); color: var(--ink); font: 400 var(--type-heading-size) / 1.1 var(--font-display); text-align: left; outline: 2px solid transparent; outline-offset: 2px; }
.x-ns-row[aria-current] { box-shadow: inset 0 0 0 2px var(--input-selected-line); background: var(--input-selected-bg); }
.x-ns-row:focus-visible { outline-color: var(--input-focus); }
.x-ns-row svg:first-child { color: var(--ink-moss); }
`

export default function NavSheet() {
  const { t } = useLang()
  const [at, setAt] = useState(0)
  const [y, setY] = useState(0) // how far up the sheet is, in px past the peek
  const yRef = useRef(0), stop = useRef<() => void>(() => {}), drag = useRef<{ y0: number; from: number; t: number; last: number; lt: number } | null>(null)
  const head = useRef<HTMLButtonElement>(null)
  const max = () => innerHeight * 0.92 - PEEK
  const snaps = () => [0, max() * 0.5, max()]
  const set = (v: number) => { yRef.current = v; setY(v) }
  const to = (v: number, vel = 0) => { stop.current(); if (still()) return set(v); stop.current = spring(yRef.current, v, set, { k: 260, c: 30, v: vel }) }
  const open = yRef.current > 4
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && yRef.current > 4) { to(0); head.current?.focus() } }
    addEventListener("keydown", esc); return () => removeEventListener("keydown", esc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const pick = (i: number) => { setAt(i); to(0); document.querySelector(".x-ns-page")?.scrollTo({ top: 0 }); head.current?.focus() }
  const Here = PAGES[at].icon
  return (
    <Stage photo>
      <style>{css}</style>
      <div className="x-ns-page" inert={open || undefined}><Letter id="letter"><div className="letter-body" key={at}>{PAGES[at].page()}</div></Letter></div>
      {open && <div className="x-ns-scrim" style={{ opacity: Math.min(1, y / (max() * 0.5)) }} onClick={() => to(0)} aria-hidden />}
      <div className="x-ns-sheet" role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label="Pages" style={{ transform: `translateY(calc(92svh - ${PEEK}px - ${y}px))` }}>
        <button ref={head} type="button" className="x-ns-head" aria-expanded={open} aria-label={open ? "Close the pages" : `Pages. You're on ${t.nav[PAGES[at].key]}`}
          onClick={() => { if (drag.current) return; to(open ? 0 : snaps()[1]) }}
          onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); stop.current(); drag.current = { y0: e.clientY, from: yRef.current, t: e.timeStamp, last: e.clientY, lt: e.timeStamp } }}
          onPointerMove={(e) => { const d = drag.current; if (!d) return; let v = d.from + (d.y0 - e.clientY); if (v > max()) v = max() + (v - max()) * 0.25; if (v < 0) v *= 0.25; set(v); d.lt = d.t; d.t = e.timeStamp; d.last = e.clientY }}
          onPointerUp={(e) => {
            const d = drag.current; if (!d) return
            const moved = Math.abs(e.clientY - d.y0) > 6
            const vel = (d.last - e.clientY) / Math.max(1, e.timeStamp - d.lt) // px per ms upwards
            if (!moved) { drag.current = null; return } // a tap: the click handles it
            const s = snaps(), projected = yRef.current + vel * 180
            to(s.reduce((a, b) => (Math.abs(b - projected) < Math.abs(a - projected) ? b : a)), vel * 1000)
            setTimeout(() => { drag.current = null }, 0)
          }}>
          <span aria-hidden className="x-ns-grip" />
          <span className="x-ns-now"><Here className="size-5" aria-hidden />{t.nav[PAGES[at].key]}</span>
        </button>
        <nav aria-label="Main" className="x-ns-list" inert={!open || undefined}>
          {PAGES.map((p, i) => (
            <button key={p.key} type="button" className="x-ns-row" aria-current={i === at ? "page" : undefined} onClick={() => pick(i)}>
              <p.icon className="size-6" aria-hidden /><span className="flex-1">{t.nav[p.key]}</span><ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </nav>
      </div>
    </Stage>
  )
}
