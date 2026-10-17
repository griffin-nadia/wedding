import { useEffect, useRef, useState } from "react"
import { Flower2, UtensilsCrossed, Wine } from "lucide-react"
import { useLang } from "@/lib/lang"
import { jstLabel } from "@/lib/time"
import { DATES } from "@/lib/wedding-dates"
import { spring } from "../../motion"

/**
 * The day as a strip you scrub. A ruler of the hours runs under a fixed playhead, from the first time on the
 * schedule to the end of the day (DATES.endsAt). Drag the strip (it carries on a little and settles on the nearest
 * five minutes) or use the arrow keys (an APG slider). Each part of the day lifts into view as the head reaches it,
 * its card filling as the time passes, and the sky behind tints softly from late morning to afternoon while a sun
 * arcs over. The cards jump the head to their time. Reduced motion: the head jumps and nothing eases.
 */
const css = `
.x-day-scrub { --p: 0; position: relative; min-height: var(--stage-h, 100svh); display: flex; flex-direction: column; overflow: hidden; color: var(--ink);
  --sky-top: color-mix(in oklab, var(--brand-hachimitsu) calc(var(--p) * 34%), color-mix(in oklab, var(--brand-sage) 22%, var(--letter-bg)));
  --sky-low: color-mix(in oklab, var(--brand-kabocha) calc(var(--p) * 18%), var(--letter-bg));
  background: linear-gradient(to bottom, var(--sky-top), var(--sky-low) 58%, var(--letter-bg)); }
.x-day-scrub::before { content: ""; position: absolute; inset: 0; background-image: var(--paper); background-size: var(--paper-size); opacity: 0.6; pointer-events: none; }
.x-day-scrub-sun { position: absolute; width: 220px; height: 220px; margin: -110px 0 0 -110px; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, color-mix(in oklab, var(--brand-hachimitsu) 70%, var(--brand-paper-bright)) 0 17%, color-mix(in oklab, var(--brand-hachimitsu) 34%, transparent) 21%, transparent 66%); opacity: 0.7; }
.x-day-scrub-head { position: relative; padding: var(--space-6) 16px 0; display: flex; flex-direction: column; gap: var(--space-2); }
@media (min-width: 1024px) { .x-day-scrub-head { padding: var(--space-8) var(--letter-left) 0; } }
.x-day-scrub-clock { font-family: var(--font-display); font-size: clamp(48px, 13vw, 132px); line-height: 1; letter-spacing: -0.01em; font-variant-numeric: lining-nums tabular-nums; color: var(--ink); }
.x-day-scrub-note { font-family: var(--font-label); font-size: var(--type-small-size); color: var(--ink-soft); }
.x-day-scrub-cards { position: relative; flex: 1; display: grid; gap: var(--space-3); align-content: center; padding: var(--space-5) 16px; }
@media (min-width: 1024px) { .x-day-scrub-cards { grid-template-columns: repeat(3, minmax(0, 300px)); gap: var(--space-5); padding-inline: var(--letter-left); align-content: center; } }
.x-day-scrub-card { position: relative; display: grid; grid-template-columns: 40px 1fr; gap: 2px var(--space-3); align-items: start; text-align: left; min-height: 72px;
  padding: var(--space-4); border-radius: var(--radius-card, 16px); background: var(--letter-bg); color: var(--ink-soft); overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--line-hairline); outline: 2px solid transparent; outline-offset: 3px;
  opacity: 0.4; transform: translateY(14px) scale(0.98);
  transition: opacity 420ms var(--ease-paper), transform 520ms var(--ease-spring), box-shadow 420ms var(--ease-paper); }
.x-day-scrub-card:focus-visible { outline-color: var(--input-focus); }
.x-day-scrub-card[data-state="done"] { opacity: 0.72; transform: none; }
.x-day-scrub-card[data-state="now"] { opacity: 1; transform: translateY(-4px); box-shadow: var(--elevation-paper), inset 0 0 0 1px var(--line-hairline); color: var(--ink); }
.x-day-scrub-icon { grid-row: span 3; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-alt); color: var(--ink-moss); }
.x-day-scrub-time { font-family: var(--font-label); font-size: var(--type-small-size); color: var(--ink-muted); font-variant-numeric: tabular-nums; }
.x-day-scrub-label { font-weight: 500; color: var(--ink); }
.x-day-scrub-fill { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; transform-origin: left; background: var(--ink-moss); }

.x-day-scrub-strip { position: relative; height: 128px; flex: none; touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; outline: none;
  border-top: 1px solid var(--line-hairline); background: color-mix(in oklab, var(--letter-bg) 70%, transparent);
  -webkit-mask: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent); mask: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent); }
.x-day-scrub-strip:active { cursor: grabbing; }
.x-day-scrub-wrap { position: relative; }
.x-day-scrub-wrap:has(.x-day-scrub-strip:focus-visible) .x-day-scrub-headline { box-shadow: 0 0 0 3px var(--input-focus); }
.x-day-scrub-ruler { position: absolute; left: 50%; top: 0; bottom: 0; will-change: transform; }
.x-day-scrub-tick { position: absolute; bottom: 30px; width: 1px; height: 12px; background: var(--ink-muted); opacity: 0.5; }
.x-day-scrub-tick[data-hour] { height: 26px; opacity: 0.9; background: var(--ink-soft); }
.x-day-scrub-hour { position: absolute; bottom: 8px; translate: -50% 0; font-family: var(--font-label); font-size: 12px; color: var(--ink-soft); white-space: nowrap; font-variant-numeric: tabular-nums; }
.x-day-scrub-mark { position: absolute; top: 18px; translate: -50% 0; display: flex; flex-direction: column; align-items: center; gap: 6px; font-family: var(--font-label); font-size: 12px; color: var(--ink); white-space: nowrap; }
.x-day-scrub-mark::after { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--ink-moss); box-shadow: 0 0 0 3px var(--letter-bg); }
.x-day-scrub-headline { position: absolute; z-index: 2; left: 50%; top: -10px; bottom: 0; width: 2px; margin-left: -1px; background: var(--action); border-radius: 2px; pointer-events: none; }
.x-day-scrub-headline::before { content: ""; position: absolute; top: 0; left: 50%; width: 30px; height: 30px; translate: -50% -50%; border-radius: 50%; background: var(--action); box-shadow: 0 2px 8px rgb(0 0 0 / 0.28), inset 0 1px 0 rgb(255 255 255 / 0.3); }
.x-day-scrub-headline::after { content: ""; position: absolute; top: 0; left: 50%; width: 8px; height: 10px; translate: -50% -50%; border-inline: 2px solid color-mix(in oklab, var(--action-ink, #fff) 80%, transparent); }
.x-day-scrub-headline[data-touched]::before { animation: none; }
.x-day-scrub-headline:not([data-touched])::before { animation: x-day-scrub-nudge 1600ms var(--ease-paper) 900ms 2 both; }
@keyframes x-day-scrub-nudge { 0%, 100% { translate: -50% -50%; } 30% { translate: calc(-50% + 8px) -50%; } 60% { translate: calc(-50% - 6px) -50%; } }
@media (prefers-reduced-motion: reduce) { .x-day-scrub-headline::before { animation: none !important; } }
@media (prefers-reduced-motion: reduce) { .x-day-scrub-card { transition: opacity 200ms linear; transform: none !important; } }
`

const ICONS = [Flower2, Wine, UtensilsCrossed]
const PPM = 6 // px per minute on the ruler
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m }
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`

export default function DayScrub() {
  const { t, lang } = useLang()
  const sched = t.day.schedule
  const start = toMin(sched[0].time), end = toMin(DATES.endsAt), total = end - start
  const events = sched.map((s, i) => ({ ...s, i, at: toMin(s.time) - start, until: (i + 1 < sched.length ? toMin(sched[i + 1].time) : end) - start }))
  const [pos, setPos] = useState(0)
  const [touched, setTouched] = useState(false)
  const at = useRef(0)
  const goal = useRef(0) // where the head is heading, so quick key presses add up
  const stop = useRef<() => void>(() => {})
  const drag = useRef<{ x: number; from: number; lastX: number; lastT: number; v: number } | null>(null)
  const clamp = (m: number) => Math.max(0, Math.min(total, m))
  const show = (m: number) => { at.current = m; setPos(m) }
  const glide = (to: number, v = 0) => { goal.current = clamp(to); stop.current(); stop.current = spring(at.current, clamp(to), (m) => show(m), { k: 120, c: 22, v }) }
  useEffect(() => () => stop.current(), [])
  // A first sweep through the morning, so the strip reads as something to drag
  useEffect(() => { const s = spring(0, 22, (m) => show(m), { k: 40, c: 9 }); return s }, [])

  const down = (e: React.PointerEvent) => {
    stop.current(); setTouched(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, from: at.current, lastX: e.clientX, lastT: e.timeStamp, v: 0 }
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = 0.7 * d.v + 0.3 * ((-(e.clientX - d.lastX) / PPM) / (dt / 1000)); d.lastX = e.clientX; d.lastT = e.timeStamp
    show(clamp(d.from - (e.clientX - d.x) / PPM))
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    // Carry on with the throw a little, then settle on the nearest five minutes
    const v = Math.max(-400, Math.min(400, d.v))
    glide(Math.round((at.current + v * 0.18) / 5) * 5, v)
  }
  const key = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 30, PageDown: -30 }
    let to: number | null = null
    if (e.key in step) to = Math.round(goal.current / 5) * 5 + step[e.key]
    if (e.key === "Home") to = 0
    if (e.key === "End") to = total
    if (to === null) return
    e.preventDefault(); setTouched(true); glide(to)
  }

  const p = pos / total
  const minute = start + Math.round(pos)
  const time = jstLabel(hhmm(minute), lang)
  const current = [...events].reverse().find((ev) => pos >= ev.at - 0.01) ?? events[0]
  const valueText = `${time}, ${current.label}, ${current.where}`
  // The sun climbs to midday and lowers into the afternoon
  const sun = { left: `${52 + p * 40}%`, top: `${26 - Math.sin(Math.PI * (0.25 + p * 0.6)) * 16}%` }
  const ticks = Array.from({ length: Math.floor(total / 15) + 1 }, (_, i) => i * 15)
  return (
    <div className="x-day-scrub" style={{ ["--p" as string]: p.toFixed(3) }}>
      <style>{css}</style>
      <span aria-hidden className="x-day-scrub-sun" style={sun} />
      <header className="x-day-scrub-head">
        <h1 className="heading">{t.day.title}</h1>
        <p className="font-medium text-foreground">{t.day.dateLong}</p>
        <p aria-hidden className="x-day-scrub-clock">{time}</p>
        <p className="x-day-scrub-note">{t.day.japanTime}</p>
      </header>
      <ol className="x-day-scrub-cards" aria-label={t.day.timelineLabel}>
        {events.map((ev) => {
          const Icon = ICONS[ev.i] ?? Flower2
          const state = pos < ev.at - 0.01 ? "ahead" : pos < ev.until || ev.i === events.length - 1 ? "now" : "done"
          const fill = Math.max(0, Math.min(1, (pos - ev.at) / (ev.until - ev.at)))
          return (
            <li key={ev.time} className="contents">
              <button type="button" className="x-day-scrub-card press" data-state={state} aria-current={state === "now" ? "time" : undefined} onClick={() => { setTouched(true); glide(ev.at) }}>
                <span aria-hidden className="x-day-scrub-icon"><Icon className="size-5" /></span>
                <span className="x-day-scrub-time">{jstLabel(ev.time, lang)}</span>
                <span className="x-day-scrub-label">{ev.label}</span>
                <span>{ev.where}</span>
                <span aria-hidden className="x-day-scrub-fill" style={{ transform: `scaleX(${fill})` }} />
              </button>
            </li>
          )
        })}
      </ol>
      <div className="x-day-scrub-wrap">
        <div role="slider" tabIndex={0} aria-label={t.day.timelineLabel} aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.round(pos)} aria-valuetext={valueText}
          className="x-day-scrub-strip" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
          <div aria-hidden className="x-day-scrub-ruler" style={{ transform: `translateX(${(-pos * PPM).toFixed(1)}px)` }}>
            {ticks.map((m) => {
              const hour = (start + m) % 60 === 0
              return (
                <span key={m}>
                  <span className="x-day-scrub-tick" data-hour={hour || undefined} style={{ left: m * PPM }} />
                  {hour && <span className="x-day-scrub-hour" style={{ left: m * PPM }}>{jstLabel(hhmm(start + m), lang)}</span>}
                </span>
              )
            })}
            <span className="x-day-scrub-tick" data-hour style={{ left: total * PPM }} />
            <span className="x-day-scrub-hour" style={{ left: total * PPM }}>{jstLabel(DATES.endsAt, lang)}</span>
            {events.map((ev) => <span key={ev.time} className="x-day-scrub-mark" style={{ left: ev.at * PPM }}>{ev.label}</span>)}
          </div>
        </div>
        <span aria-hidden className="x-day-scrub-headline" data-touched={touched || undefined} />
      </div>
      <p className="sr-only" aria-live="polite">{current.label}</p>
    </div>
  )
}
