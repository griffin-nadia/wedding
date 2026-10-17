import { useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { Stage } from "../../stage"
import { NamesArt } from "@/components/names-art"
import { spring, still } from "../../motion"

/**
 * Nadia's drawn envelope on their photo. Pull the letter up out of it: it follows your finger with a little
 * resistance, the flap opens as it comes, and past about half way letting go springs it all the way out while the
 * envelope sinks away. Let go early and it slides back in. Skip is always there; Enter or Space opens it too.
 * Reduced motion: Skip and a tap open it at once.
 */
const base = import.meta.env.BASE_URL
const img = (which: "closed" | "open") => `${base}${ART.drawnEnvelope[which]}-820.webp`
const css = `
.x-ed { position: relative; width: min(82vw, 410px); aspect-ratio: ${ART.drawnEnvelope.ratio}; touch-action: none; user-select: none; cursor: grab; outline: 2px solid transparent; outline-offset: 8px; border-radius: var(--radius-card); -webkit-tap-highlight-color: transparent; }
.x-ed:focus-visible { outline-color: var(--input-focus); }
.x-ed[data-dragging] { cursor: grabbing; }
.x-ed-art { position: absolute; left: 0; width: 100%; height: auto; pointer-events: none; filter: drop-shadow(0 18px 22px rgb(var(--tint-shadow) / 0.3)); }
.x-ed-closed { top: 0; z-index: 3; }
.x-ed-open { bottom: 0; z-index: 1; }
.x-ed-letter { position: absolute; z-index: 2; left: 7%; right: 7%; top: 8%; height: 84%; display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4); border-radius: var(--radius-control); background: var(--letter-bg); color: var(--ink-soft); overflow: hidden; transform-origin: 50% 100%; }
.x-ed-letter h2 { font: 400 clamp(1.6rem, 6vw, 2.4rem) / 1 var(--font-display); color: var(--ink); }
.x-ed-letter p { font-size: var(--type-small-size); }
.x-ed-skip { position: absolute; z-index: 5; right: var(--space-4); bottom: calc(var(--space-5) + env(safe-area-inset-bottom)); min-height: 44px; padding-inline: var(--space-4); border-radius: var(--radius-pill); background: color-mix(in oklab, var(--letter-bg) 90%, transparent); color: var(--ink); font: 500 var(--type-small-size) / 1 var(--font-label); box-shadow: var(--elevation-paper); }
.x-ed-skip:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.x-ed-cue { font: 400 var(--type-body-size) / 1.2 var(--font-display); color: #fff; filter: drop-shadow(0 1px 6px rgb(0 0 0 / 0.45)); }
`

export default function EnvelopeDrag() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [p, setP] = useState(0) // 0 sealed, 1 out
  const pRef = useRef(0), stop = useRef<() => void>(() => {}), drag = useRef<{ y: number; p: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const set = (v: number) => { pRef.current = v; setP(v) }
  const to = (target: number, v = 0) => { stop.current(); stop.current = spring(pRef.current, target, set, { k: target ? 110 : 220, c: target ? 16 : 24, v }) }
  const open = () => (still() ? set(1) : to(1))
  const names = household?.guests.filter((g) => !g.plusOne).map((g) => g.firstName) ?? []
  const flap = Math.min(1, p / 0.3) // the flap is open by a third of the way
  const out = Math.max(0, (p - 0.15) / 0.85)
  const done = p > 0.995
  return (
    <Stage photo hint={done ? "Opened" : "Pull the letter up out of the envelope"}>
      <style>{css}</style>
      {!done && <p className="x-ed-cue" aria-hidden>{t.letter.openLabel?.(names.join(" & ")) ?? ""}</p>}
      <div className="x-ed" role="button" tabIndex={0} aria-label={t.letter.openLabel?.(names.join(" & "))} data-dragging={dragging || undefined}
        style={{ transform: `translateY(${out * 40}px)` }}
        onPointerDown={(e) => { if (done || still()) return; (e.target as Element).setPointerCapture?.(e.pointerId); stop.current(); drag.current = { y: e.clientY, p: pRef.current }; setDragging(true) }}
        onPointerMove={(e) => { const d = drag.current; if (!d) return; const raw = d.p + (d.y - e.clientY) / 260; set(Math.max(0, raw < 1 ? raw : 1 + (raw - 1) * 0.2)) }}
        onPointerUp={() => { const d = drag.current; drag.current = null; setDragging(false); if (!d) return; to(pRef.current > 0.5 ? 1 : 0) }}
        onPointerCancel={() => { drag.current = null; setDragging(false); to(0) }}
        onClick={() => still() && open()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open() } }}>
        <img src={img("open")} alt="" className="x-ed-art x-ed-open" style={{ opacity: flap, transform: `translateY(${out * 30}px)` }} draggable={false} />
        <div className="x-ed-letter paper-feel" aria-hidden={!done} style={{ transform: `translateY(${-out * 78}%) scale(${1 + out * 0.08})`, zIndex: out > 0.5 ? 4 : 2 }}>
          <h2><span className="sr-only">Griffin &amp; Nadia</span><NamesArt tone="light" className="w-4/5" /></h2>
          <p className="font-medium text-foreground">{t.home.dateLine}</p>
          <p>{t.home.dear(t.home.dearNames(names))} {t.home.greetingLine}</p>
        </div>
        <img src={img("closed")} alt="" className="x-ed-art x-ed-closed" style={{ opacity: 1 - flap }} draggable={false} />
      </div>
      {done
        ? <button type="button" className="x-ed-skip inline-flex items-center gap-2" onClick={() => to(0)}><RotateCcw className="size-4" aria-hidden />Seal it again</button>
        : <button type="button" className="x-ed-skip" onClick={open}>Skip</button>}
    </Stage>
  )
}
