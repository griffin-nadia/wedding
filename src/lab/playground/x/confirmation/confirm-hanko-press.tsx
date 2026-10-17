import { useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { useLang } from "@/lib/lang"
import { Hanko } from "@/components/hanko"
import { Stage } from "../../stage"
import { spring, still, tween } from "../../motion"

/**
 * You stamp it: press and hold the paper, the hanko lowers out of the air (its shadow tightening), ink gathers under
 * it while you hold, and letting go lands it with a little squash and, on Android, a tiny tick. Let go too soon and
 * it lifts away again. Keyboard: hold Space. Reduced motion: one press lands it.
 */
const css = `
.x-hp-card { position: relative; display: flex; flex-direction: column; gap: var(--space-3); width: min(100%, 420px); padding: var(--space-6); border-radius: var(--letter-radius); background: var(--letter-bg); }
.x-hp-pad { position: relative; display: grid; place-items: center; height: 180px; margin-top: var(--space-2); border-radius: var(--radius-section); border: 1px dashed color-mix(in oklab, var(--ink-muted) 60%, transparent); cursor: pointer; touch-action: none; user-select: none; -webkit-tap-highlight-color: transparent; outline: 2px solid transparent; outline-offset: 3px; }
.x-hp-pad:focus-visible { outline-color: var(--input-focus); }
.x-hp-pad[data-landed] { border-color: transparent; cursor: default; }
.x-hp-ink { position: absolute; width: 96px; height: 96px; border-radius: 50%; background: radial-gradient(circle, color-mix(in oklab, var(--ink-stamp) 30%, transparent), transparent 70%); pointer-events: none; }
.x-hp-stamp { position: relative; display: grid; will-change: transform, filter; }
.x-hp-cue { position: absolute; bottom: var(--space-3); font: 500 var(--type-small-size) / 1.4 var(--font-label); color: var(--ink-muted); }
`

export default function HankoPress() {
  const { t } = useLang()
  const [landed, setLanded] = useState(false)
  const [p, setP] = useState(0) // how far it has come down, 0 (in the air) to 1 (on the paper)
  const [squash, setSquash] = useState(1)
  const stop = useRef<() => void>(() => {}), held = useRef(false), pRef = useRef(0)
  const set = (v: number) => { pRef.current = v; setP(v) }
  const down = () => {
    if (landed) return
    held.current = true
    if (still()) return land()
    stop.current()
    const from = pRef.current
    stop.current = tween(700 * (1 - from), (k) => set(from + (1 - from) * k), (x) => x)
  }
  const land = () => {
    stop.current(); set(1); setLanded(true)
    if (!still()) { navigator.vibrate?.(10); stop.current = spring(0.9, 1, setSquash, { k: 420, c: 18 }) } // a tiny tick on Android; iPhones have none
  }
  const up = () => {
    if (!held.current || landed) return
    held.current = false
    if (pRef.current >= 0.6) return land()
    stop.current(); stop.current = spring(pRef.current, 0, set, { k: 200, c: 22 }) // too soon: it lifts away
  }
  const replay = () => { stop.current(); setLanded(false); set(0); setSquash(1) }
  const lift = 1 - p
  return (
    <Stage hint="Press and hold the paper to stamp it">
      <style>{css}</style>
      <article className="x-hp-card paper-feel">
        <h2 className="heading">{t.rsvp.doneTitle.all}</h2>
        <p>{t.rsvp.sentLine}</p>
        <div className="x-hp-pad" role="button" tabIndex={0} aria-label="Stamp your reply" aria-pressed={landed} data-landed={landed || undefined}
          onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); down() }} onPointerUp={up} onPointerCancel={up}
          onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); down() } }} onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") up() }}>
          <span aria-hidden className="x-hp-ink" style={{ opacity: landed ? 0 : p * 0.9, transform: `scale(${0.6 + p * 0.5})` }} />
          <span aria-hidden className="x-hp-stamp" style={{ opacity: landed ? 1 : 0.15 + p * 0.85, transform: `translateY(${-28 * lift}px) scale(${(1.3 - 0.3 * p) * squash}, ${(1.3 - 0.3 * p) / squash})`, filter: `drop-shadow(0 ${18 * lift}px ${16 * lift + 1}px rgb(0 0 0 / ${0.28 * lift}))` }}>
            <Hanko />
          </span>
          {!landed && <span className="x-hp-cue">{p > 0 ? "Keep holding…" : "Hold here"}</span>}
        </div>
        <p role="status" className="text-small text-muted-foreground">{landed ? "Stamped." : ""}</p>
        {landed && <button type="button" className="btn-text inline-flex min-h-11 items-center gap-2 self-start text-small" onClick={replay}><RotateCcw className="size-4" aria-hidden />Stamp again</button>}
      </article>
    </Stage>
  )
}
