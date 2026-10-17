import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLang } from "@/lib/lang"
import { Letter } from "@/components/letter/letter"
import { DayPage } from "@/pages/day"
import { TravelPage } from "@/pages/travel"
import { FaqsPage } from "@/pages/faqs"
import { Stage } from "../../stage"
import { spring, still } from "../../motion"

/**
 * The phone page turn, refined: three letters on one strip with a strip of paper between them. Drag sideways and the
 * strip follows your finger flat; let go past a quarter (or flick) and it springs on, short of that it springs back.
 * The arriving letter leads by a hair (its words fade up as it lands), so the change reads as the next page coming
 * to you. The tabs below use the same spring. Reduced motion: it cuts.
 */
const PAGES: { key: "day" | "travel" | "faqs"; page: () => ReactNode }[] = [{ key: "day", page: () => <DayPage /> }, { key: "travel", page: () => <TravelPage /> }, { key: "faqs", page: () => <FaqsPage /> }]
const GAP = 12
const css = `
.x-psl { position: fixed; inset: 0; overflow: hidden; touch-action: pan-y; }
.x-psl-strip { position: absolute; top: 0; left: 0; height: 100%; display: flex; gap: ${GAP}px; will-change: transform; }
.x-psl-slot { width: 100vw; height: 100%; overflow-y: auto; padding: var(--space-5) 12px 120px; }
.x-psl-slot .letter { max-width: var(--letter-width); margin-inline: auto; min-height: auto; }
.x-psl-tabs [data-on="true"] { background: var(--input-selected-bg); box-shadow: inset 0 0 0 2px var(--input-selected-line); }
.x-psl-tabs { position: fixed; box-shadow: var(--elevation-paper); background: var(--letter-bg); z-index: 5; left: 50%; bottom: calc(var(--space-4) + env(safe-area-inset-bottom)); translate: -50% 0; }
`

export default function PaperSlide() {
  const { t } = useLang()
  const [at, setAt] = useState(0)
  const [x, setX] = useState(0) // the strip's position, in pages (fractional while moving)
  const xr = useRef(0), stop = useRef<() => void>(() => {})
  const drag = useRef<{ x0: number; y0: number; from: number; on: boolean; v: number; t: number; last: number } | null>(null)
  const set = (v: number) => { xr.current = v; setX(v) }
  const go = (i: number, vel = 0) => {
    const n = Math.max(0, Math.min(PAGES.length - 1, i)); setAt(n)
    stop.current(); if (still()) return set(n)
    stop.current = spring(xr.current, n, set, { k: 190, c: 25, v: vel })
  }
  useEffect(() => () => stop.current(), [])
  const w = typeof window !== "undefined" ? innerWidth + GAP : 400
  return (
    <Stage photo className="!p-0">
      <style>{css}</style>
      <div className="x-psl"
        onPointerDown={(e) => { if (still() || (e.target as Element).closest("button, a, input")) return; stop.current(); drag.current = { x0: e.clientX, y0: e.clientY, from: xr.current, on: false, v: 0, t: e.timeStamp, last: e.clientX } }}
        onPointerMove={(e) => {
          const d = drag.current; if (!d) return
          const dx = e.clientX - d.x0
          if (!d.on) { if (Math.abs(e.clientY - d.y0) > 12) { drag.current = null; return } if (Math.abs(dx) < 10) return; d.on = true; (e.currentTarget as Element).setPointerCapture?.(e.pointerId) }
          let p = d.from - dx / w
          if (p < 0) p *= 0.3; if (p > PAGES.length - 1) p = PAGES.length - 1 + (p - PAGES.length + 1) * 0.3
          d.v = (e.clientX - d.last) / Math.max(1, e.timeStamp - d.t); d.t = e.timeStamp; d.last = e.clientX
          set(p)
        }}
        onPointerUp={(e) => {
          const d = drag.current; drag.current = null; if (!d?.on) return
          const dx = e.clientX - d.x0, from = Math.round(d.from)
          const next = Math.abs(d.v) > 0.4 ? from + (d.v < 0 ? 1 : -1) : Math.abs(dx) > w * 0.25 ? from + (dx < 0 ? 1 : -1) : from
          go(next, (-d.v * 1000) / w)
        }}>
        <div className="x-psl-strip" style={{ transform: `translate3d(${-x * w}px, 0, 0)` }}>
          {PAGES.map((p, i) => {
            const d = Math.abs(i - x)
            return (
              <div key={p.key} className="x-psl-slot" inert={i !== at || undefined}>
                {/* The arriving letter leads by a hair: a few px ahead and its words fading up as it lands */}
                <div style={{ transform: `translate3d(${(i - x) * -10}px, 0, 0)`, opacity: 1 - Math.min(1, d) * 0.25 }}>
                  <Letter id={i === at ? "letter" : undefined}><div className="letter-body">{p.page()}</div></Letter>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="x-psl-tabs segmented" role="tablist" aria-label="Pages">
        {PAGES.map((p, i) => <button key={p.key} type="button" role="tab" aria-selected={i === at} data-on={i === at} className="segmented-item" onClick={() => go(i)}>{t.nav[p.key]}</button>)}
      </div>
    </Stage>
  )
}
