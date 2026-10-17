import { useEffect, useRef, useState } from "react"
import { Play } from "lucide-react"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { jstLabel } from "@/lib/time"
import { tween } from "../../motion"

/**
 * The day as a map: an illustrated, not-to-scale plate of the venue's grounds in the site's map style (paper land,
 * moss, dotted paths, a few autumn leaves) with only what the copy names for the day: the ceremony in The Garden,
 * the cocktail hour, the reception on The Terrace. A dotted line draws from stop to stop with the times, each pin
 * landing as the line reaches it. Tap a stop (a real button) and the line draws there and its card shows. Reduced
 * motion: the whole route is drawn, nothing moves.
 */
const css = `
.x-day-map { position: relative; min-height: 100svh; padding: var(--space-6) 16px var(--space-7); background: var(--letter-bg); color: var(--ink-soft); }
.x-day-map::before { content: ""; position: absolute; inset: 0; background-image: var(--texture-grain); background-size: 256px; opacity: var(--texture-opacity); mix-blend-mode: var(--texture-blend); pointer-events: none; }
.x-day-map-in { position: relative; display: grid; gap: var(--space-5); max-width: 1180px; margin: 0 auto; }
@media (min-width: 1024px) { .x-day-map { padding-top: var(--space-8); } .x-day-map-in { grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr); align-items: start; column-gap: var(--space-7); } .x-day-map-head { grid-column: 1 / -1; } }
.x-day-map-plate { --land: var(--brand-sage-paper); position: relative; width: 100%; aspect-ratio: 400 / 300; border-radius: var(--radius-section); box-shadow: var(--elevation-paper); }
[data-theme="lantern"] .x-day-map-plate { --land: var(--brand-yoru-sage); }
.x-day-map-plate svg { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; }
.x-day-map-land { fill: var(--land); }
.x-day-map-lawn { fill: color-mix(in oklab, var(--brand-sage) 42%, var(--land)); }
.x-day-map-moss { fill: color-mix(in oklab, var(--brand-koke, var(--ink-moss)) 55%, var(--land)); }
.x-day-map-tree { fill: color-mix(in oklab, var(--ink-moss) 70%, var(--land)); }
.x-day-map-tree-warm { fill: color-mix(in oklab, var(--brand-kabocha) 70%, var(--land)); }
.x-day-map-stone { fill: color-mix(in oklab, var(--letter-bg) 70%, var(--ink-muted)); opacity: 0.6; }
.x-day-map-terrace { fill: color-mix(in oklab, var(--letter-bg) 82%, var(--brand-kare, var(--ink-muted))); stroke: var(--line-hairline); }
.x-day-map-boards { stroke: color-mix(in oklab, var(--ink-muted) 40%, transparent); stroke-width: 0.8; }
.x-day-map-ghost { fill: none; stroke: color-mix(in oklab, var(--ink-muted) 45%, transparent); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 0.1 6; }
.x-day-map-route { fill: none; stroke: var(--brand-sabi); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 0.1 7; }
.x-day-map-reveal { fill: none; stroke: #fff; stroke-width: 12; stroke-linecap: round; }
.x-day-map-area { font-family: var(--font-label); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; fill: var(--ink-soft); }
.x-day-map-note { font-family: var(--font-label); font-size: 9px; fill: var(--ink-muted); }
.x-day-map-title { font-family: var(--font-display); font-size: 15px; fill: var(--ink-soft); }
.x-day-map-pin { position: absolute; translate: -50% -50%; display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; outline: 2px solid transparent; outline-offset: 2px; -webkit-tap-highlight-color: transparent; }
.x-day-map-pin:focus-visible { outline-color: var(--input-focus); }
.x-day-map-dot { width: 18px; height: 18px; border-radius: 50%; background: var(--brand-paper-bright); border: 2px solid var(--ink-soft); box-shadow: 0 1px 3px rgb(0 0 0 / 0.2); transform: scale(0.6); opacity: 0.55;
  transition: transform 420ms var(--ease-spring), opacity 300ms var(--ease-paper), background-color 200ms var(--ease-paper); }
.x-day-map-pin[data-reached] .x-day-map-dot { transform: scale(1); opacity: 1; border-color: var(--brand-sabi); }
.x-day-map-pin[aria-pressed="true"] .x-day-map-dot { background: var(--brand-sabi); border-color: var(--brand-paper-bright); transform: scale(1.3); }
.x-day-map-tag { position: absolute; top: 50%; left: 40px; translate: 0 -50%; pointer-events: none; display: flex; flex-direction: column; padding: 4px 8px; border-radius: var(--radius-control);
  background: color-mix(in oklab, var(--letter-bg) 94%, transparent); box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); font-family: var(--font-label); font-size: 12px; line-height: 1.3; text-align: left; color: var(--ink); white-space: nowrap;
  opacity: 0.5; transition: opacity 300ms var(--ease-paper), box-shadow 200ms; }
.x-day-map-tag b { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--ink-soft); }
.x-day-map-pin[data-reached] .x-day-map-tag { opacity: 1; }
.x-day-map-pin[data-east] .x-day-map-tag { left: auto; right: 40px; text-align: right; }
.x-day-map-pin[aria-pressed="true"] .x-day-map-tag { box-shadow: inset 0 0 0 1.5px var(--brand-sabi), 0 1px 2px rgb(0 0 0 / 0.12); }
.x-day-map-side { display: flex; flex-direction: column; gap: var(--space-4); }
.x-day-map-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-5); border-radius: var(--radius-section); background: var(--surface-alt); box-shadow: inset 0 0 0 1px var(--line-hairline);
  animation: x-day-map-card 360ms var(--ease-paper) both; }
.x-day-map-card-time { font-family: var(--font-display); font-size: var(--type-heading-size); line-height: 1; color: var(--ink); font-variant-numeric: lining-nums tabular-nums; }
@keyframes x-day-map-card { from { opacity: 0; transform: translateY(10px); } }
.x-day-map-steps { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.x-day-map-step { min-height: 44px; padding: 0 var(--space-4); border-radius: var(--radius-pill); box-shadow: inset 0 0 0 1px var(--line-hairline); font: 500 var(--type-small-size) / 1 var(--font-label); color: var(--ink); outline: 2px solid transparent; outline-offset: 2px; }
.x-day-map-step[aria-pressed="true"] { background: var(--ink); color: var(--letter-bg); }
.x-day-map-step:focus-visible, .x-day-map-play:focus-visible { outline-color: var(--input-focus); }
.x-day-map-play { display: inline-flex; align-items: center; gap: var(--space-2); align-self: flex-start; min-height: 44px; font: 500 var(--type-small-size) / 1 var(--font-label); color: var(--link); text-decoration: underline; text-underline-offset: 4px; outline: 2px solid transparent; outline-offset: 2px; border-radius: var(--button-radius); }
@media (prefers-reduced-motion: reduce) { .x-day-map-card { animation: none; } .x-day-map-dot, .x-day-map-tag { transition: none; } }
`

/** Where each stop sits on the 400 × 300 plate (illustrative, not to scale) */
const AT: [number, number][] = [[104, 214], [206, 156], [302, 92]]
const SEGS = [`M${AT[0][0]} ${AT[0][1]} C 132 180, 168 190, ${AT[1][0]} ${AT[1][1]}`, `M${AT[1][0]} ${AT[1][1]} C 236 128, 262 122, ${AT[2][0]} ${AT[2][1]}`]
const LEAVES: [number, number, number, string][] = [[368, 262, 25, "var(--brand-kabocha)"], [200, 270, 10, "var(--brand-sabi)"], [372, 40, -35, "var(--brand-hachimitsu)"], [248, 200, -12, "var(--brand-sabi)"]]
/** Trees as little clumps: [x, y, size, maple] */
const TREES: [number, number, number, boolean][] = [[58, 116, 15, false], [86, 98, 10, true], [372, 222, 9, false], [176, 250, 12, true], [178, 88, 14, false], [146, 66, 9, true], [354, 168, 15, false], [326, 200, 10, true], [252, 240, 13, false], [228, 60, 9, true]]

export default function DayMap() {
  const { t, lang } = useLang()
  const stops = t.day.schedule
  const [on, setOn] = useState(0)
  const [reached, setReached] = useState(0)
  const prog = useRef(0) // 0 to 2: how far the line has drawn, in segments
  const masks = useRef<(SVGPathElement | null)[]>([])
  const stop = useRef<() => void>(() => {})
  const paint = (p: number) => {
    prog.current = p
    masks.current.forEach((m, i) => m?.setAttribute("stroke-dashoffset", String(1 - Math.max(0, Math.min(1, p - i)))))
    setReached(Math.floor(p + 0.001))
  }
  /** Draw (or undraw) the line to a stop, a segment's worth of time per segment */
  const drawTo = (target: number, after?: () => void) => {
    stop.current()
    const from = prog.current, span = Math.abs(target - from)
    if (!span) return after?.()
    stop.current = tween(900 * span, (k, done) => { paint(from + (target - from) * k); if (done) after?.() }, (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2))
  }
  const go = (i: number) => { setOn(i); drawTo(i) }
  const playDay = () => {
    stop.current(); paint(0); setOn(0)
    drawTo(1, () => { setOn(1); drawTo(2, () => setOn(2)) })
  }
  useEffect(() => {
    paint(0)
    playDay()
    return () => stop.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const s = stops[on]
  const extra = on === 0 ? [t.day.venueFacts, t.day.rainPlan] : []
  return (
    <div className="x-day-map">
      <style>{css}</style>
      <div className="x-day-map-in">
        <header className="x-day-map-head flex flex-col gap-2">
          <h1 className="heading">{t.day.title}</h1>
          <p className="font-medium text-foreground">{t.day.dateLong} · {VENUE.name}</p>
        </header>
        <div className="x-day-map-plate">
          <svg viewBox="0 0 400 300" role="img" aria-label={`${VENUE.name}: ${stops.map((x) => `${jstLabel(x.time, lang)} ${x.label}, ${x.where}`).join("; ")}. Illustrative, not to scale.`}>
            <defs>
              <mask id="x-day-map-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="300">
                {SEGS.map((d, i) => <path key={i} ref={(el) => { masks.current[i] = el }} d={d} pathLength={1} className="x-day-map-reveal" strokeDasharray="1 1" strokeDashoffset={1} />)}
              </mask>
            </defs>
            <rect width="400" height="300" rx="20" className="x-day-map-land" />
            {/* The garden: a lawn, moss and trees (drawn, not surveyed) */}
            <path className="x-day-map-lawn" d="M26 196 C 30 150, 92 138, 140 160 S 196 236, 160 270 S 40 290, 26 250 Z" />
            <path className="x-day-map-moss" d="M60 226 C 70 206, 118 200, 128 222 S 100 256, 72 250 Z" opacity="0.6" />
            {[[150, 222], [162, 206], [176, 192], [190, 176]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="5" ry="3.4" className="x-day-map-stone" transform={`rotate(-30 ${x} ${y})`} />)}
            {/* The terrace: a raised deck of boards */}
            <g transform="rotate(-8 302 92)">
              <rect x="252" y="62" width="104" height="60" rx="6" className="x-day-map-terrace" />
              {[268, 284, 300, 316, 332].map((x) => <line key={x} x1={x} y1="64" x2={x} y2="120" className="x-day-map-boards" />)}
            </g>
            {TREES.map(([x, y, r, warm], i) => (
              <g key={i} className={warm ? "x-day-map-tree-warm" : "x-day-map-tree"}>
                <ellipse cx={x + 2} cy={y + r * 0.9} rx={r * 1.2} ry={r * 0.35} fill="rgb(0 0 0 / 0.08)" />
                <circle cx={x - r * 0.5} cy={y + r * 0.25} r={r * 0.72} opacity="0.75" />
                <circle cx={x + r * 0.55} cy={y + r * 0.2} r={r * 0.78} opacity="0.8" />
                <circle cx={x} cy={y - r * 0.2} r={r * 0.85} opacity="0.92" />
              </g>
            ))}
            <text className="x-day-map-area" x="52" y="272">{stops[0].where}</text>
            <text className="x-day-map-area" x="262" y="146" transform="rotate(-8 262 146)">{stops[2].where.split(",")[0]}</text>
            {LEAVES.map(([x, y, r, c], i) => <path key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(0.8)`} fill={c} opacity="0.85"
              d="M0 -9 L2.4 -3.2 L8.6 -4.4 L5 0.6 L8 6 L2 4.6 L0 10 L-2 4.6 L-8 6 L-5 0.6 L-8.6 -4.4 L-2.4 -3.2 Z" />)}
            {SEGS.map((d, i) => <path key={i} d={d} className="x-day-map-ghost" />)}
            <g mask="url(#x-day-map-mask)">{SEGS.map((d, i) => <path key={i} d={d} className="x-day-map-route" />)}</g>
            <text className="x-day-map-title" x="22" y="34">{VENUE.name}</text>
            <text className="x-day-map-note" x="280" y="288">Illustrative, not to scale</text>
          </svg>
          {stops.map((x, i) => (
            <button key={x.time} type="button" className="x-day-map-pin" aria-pressed={on === i} data-reached={reached >= i || undefined} data-east={AT[i][0] > 260 || undefined}
              style={{ left: `${(AT[i][0] / 400) * 100}%`, top: `${(AT[i][1] / 300) * 100}%` }} onClick={() => go(i)}>
              <span aria-hidden className="x-day-map-dot" />
              <span className="x-day-map-tag"><b>{jstLabel(x.time, lang)}</b><span>{x.label}</span></span>
            </button>
          ))}
        </div>
        <div className="x-day-map-side">
          <div key={on} className="x-day-map-card" aria-live="polite">
            <p className="x-day-map-card-time">{jstLabel(s.time, lang)}</p>
            <p className="font-medium text-foreground">{s.label}</p>
            <p>{s.where}</p>
            {extra.map((l) => <p key={l} className="text-small">{l}</p>)}
          </div>
          <div className="x-day-map-steps" role="group" aria-label={t.day.timelineLabel}>
            {stops.map((x, i) => <button key={x.time} type="button" className="x-day-map-step press" aria-pressed={on === i} onClick={() => go(i)}>{x.label}</button>)}
          </div>
          <button type="button" className="x-day-map-play" onClick={playDay}><Play className="size-4" aria-hidden />{t.day.timelineLabel}</button>
          <p className="text-small text-muted-foreground">{t.day.japanTime}</p>
        </div>
      </div>
    </div>
  )
}
