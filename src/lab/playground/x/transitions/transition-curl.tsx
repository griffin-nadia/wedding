import { useRef, useState, type ReactNode } from "react"
import { useLang } from "@/lib/lang"
import { DayPage } from "@/pages/day"
import { TravelPage } from "@/pages/travel"
import { FaqsPage } from "@/pages/faqs"
import { Stage } from "../../stage"
import { spring, still } from "../../motion"

/**
 * A letter you turn like a page: catch its right edge (or tap the corner) and it lifts off the next one, turning on
 * its left edge toward you, its paper catching the light as it bends and its shadow sliding across the page beneath.
 * Past half way it turns over; short of that it falls back. The back of the sheet is plain paper with the words
 * faintly showing through. Reduced motion: the next page simply replaces it.
 */
const PAGES: { key: "day" | "travel" | "faqs"; page: () => ReactNode }[] = [{ key: "day", page: () => <DayPage /> }, { key: "travel", page: () => <TravelPage /> }, { key: "faqs", page: () => <FaqsPage /> }]
const css = `
.x-cu { position: relative; width: min(calc(100vw - 24px), 560px); height: min(78svh, 760px); perspective: 1800px; }
.x-cu-sheet { position: absolute; inset: 0; border-radius: var(--letter-radius); background: var(--letter-bg); overflow: hidden; }
.x-cu-sheet .letter-body { padding: var(--letter-pad); }
.x-cu-sheet .page-header { position: static; }
.x-cu-under { box-shadow: var(--elevation-paper); }
.x-cu-turn { position: absolute; inset: 0; transform-style: preserve-3d; transform-origin: 0 50%; will-change: transform; }
.x-cu-face { position: absolute; inset: 0; border-radius: var(--letter-radius); backface-visibility: hidden; -webkit-backface-visibility: hidden; overflow: hidden; background: var(--letter-bg); }
.x-cu-back { transform: rotateY(180deg); background-image: var(--texture-fibre); background-size: 384px; }
.x-cu-back .x-cu-ghost { position: absolute; inset: 0; transform: scaleX(-1); opacity: 0.06; pointer-events: none; }
.x-cu-light { position: absolute; inset: 0; pointer-events: none; }
.x-cu-shadow { position: absolute; top: 0; bottom: 0; left: 0; pointer-events: none; background: linear-gradient(to right, rgb(var(--tint-shadow) / 0.28), transparent); border-radius: var(--letter-radius); }
.x-cu-grab { position: absolute; z-index: 5; top: 0; right: 0; bottom: 0; width: 72px; touch-action: none; cursor: grab; }
.x-cu-corner { position: absolute; z-index: 6; right: 0; bottom: 0; width: 56px; height: 56px; border-radius: 0 0 var(--letter-radius) 0; background: linear-gradient(135deg, transparent 50%, color-mix(in oklab, var(--surface-fill) 70%, transparent) 50%); outline: 2px solid transparent; outline-offset: 2px; }
.x-cu-corner:focus-visible { outline-color: var(--input-focus); }
`

export default function Curl() {
  const { t } = useLang()
  const [at, setAt] = useState(0)
  const [a, setA] = useState(0) // the turn, 0 flat to 1 over
  const ar = useRef(0), stop = useRef<() => void>(() => {}), drag = useRef<{ x0: number; w: number } | null>(null)
  const set = (v: number) => { ar.current = v; setA(v) }
  const next = (at + 1) % PAGES.length
  const finish = (to: 0 | 1, v = 0) => {
    stop.current()
    if (still() || to === 0 && ar.current === 0) { if (to) { setAt(next); set(0) } else set(0); return }
    stop.current = spring(ar.current, to, (x, done) => { set(x); if (done && to === 1) { setAt((n) => (n + 1) % PAGES.length); set(0) } }, { k: to ? 120 : 220, c: to ? 18 : 26, v })
  }
  const deg = -180 * a
  const bend = Math.sin(a * Math.PI) // most bent half way over
  return (
    <Stage photo hint="Pull the right edge of the letter to the left, or tap its corner">
      <style>{css}</style>
      <div className="x-cu">
        <div className="x-cu-sheet x-cu-under" aria-hidden>
          <div className="letter-body">{PAGES[next].page()}</div>
          <span className="x-cu-shadow" style={{ width: `${(1 - a) * 100}%`, opacity: bend }} />
        </div>
        <div className="x-cu-turn" style={{ transform: `rotateY(${deg}deg) skewY(${bend * -2}deg)` }}>
          <div className="x-cu-face">
            <div className="letter-body">{PAGES[at].page()}</div>
            <span className="x-cu-light" style={{ background: `linear-gradient(to left, rgb(255 255 255 / ${bend * 0.35}), transparent 45%), linear-gradient(to right, rgb(0 0 0 / ${bend * 0.18}), transparent 60%)` }} />
          </div>
          <div className="x-cu-face x-cu-back" aria-hidden>
            <div className="x-cu-ghost"><div className="letter-body">{PAGES[at].page()}</div></div>
            <span className="x-cu-light" style={{ background: `linear-gradient(to right, rgb(0 0 0 / ${bend * 0.2}), transparent 50%)` }} />
          </div>
        </div>
        {!still() && <div className="x-cu-grab" aria-hidden
          onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); stop.current(); drag.current = { x0: e.clientX, w: (e.currentTarget.parentElement as HTMLElement).clientWidth } }}
          onPointerMove={(e) => { const d = drag.current; if (!d) return; set(Math.min(1, Math.max(0, (d.x0 - e.clientX) / (d.w * 1.2)))) }}
          onPointerUp={() => { if (!drag.current) return; drag.current = null; finish(ar.current > 0.5 ? 1 : 0) }}
          onPointerCancel={() => { drag.current = null; finish(0) }} />}
        <button type="button" className="x-cu-corner" aria-label={`Turn to ${t.nav[PAGES[next].key]}`} onClick={() => finish(1, 1.2)} />
      </div>
    </Stage>
  )
}
