import { useId, useState, type CSSProperties } from "react"
import { JourneyLand } from "@/components/journey-mini"
import { KYOTO, PLACES, arc } from "@/lib/journey"
import { useLang } from "@/lib/lang"

/**
 * Experiment: the hand-drawn map, inked in. Brisbane, Canada and Kyoto each arrive as a blot of ink that bleeds open
 * into the paper (a turbulent-edged mask growing, with a paler halo spreading behind it), then Nadia's and Griffin's
 * lines draw to Kyoto like a pen, nib first. Tap a place to blot it again; tap Kyoto to ink the whole map again.
 * All CSS animation, so the lab's speed applies. Reduced motion: everything already inked; a tap fades it back in.
 */
const css = `
.x-ink { position: relative; isolation: isolate; min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 24px 16px; background: var(--letter-bg); color: var(--ink); }
.x-ink::before { content: ""; position: absolute; inset: 0; z-index: -1; background-image: var(--paper); background-size: var(--paper-size); opacity: 0.6; pointer-events: none; }
.x-ink-eyebrow { margin: 0; font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--ink-story); }
.x-ink-card { position: relative; width: min(100%, 980px, 125svh); border-radius: var(--radius-section); box-shadow: var(--elevation-paper); }
.x-ink-card svg { display: block; }
.x-ink-pin { position: absolute; width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%; background: transparent; cursor: pointer; }
.x-ink-pin:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.x-ink-pin:hover { background: color-mix(in oklab, var(--ink) 6%, transparent); }
.x-ink-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 20px; margin: 0; padding: 0; list-style: none; font-size: var(--type-small-size); color: var(--ink-soft); }
.x-ink-legend li { display: inline-flex; align-items: center; gap: 8px; }
.x-ink-legend span { display: inline-block; width: 22px; height: 0; border-top: 2px solid; border-radius: 2px; }

.x-ink-grow { transform-box: fill-box; transform-origin: center; animation: x-ink-grow 1500ms cubic-bezier(0.15, 0.7, 0.2, 1) var(--d, 0ms) both; }
.x-ink-halo { transform-box: fill-box; transform-origin: center; animation: x-ink-halo 2400ms cubic-bezier(0.1, 0.6, 0.2, 1) var(--d, 0ms) both; }
@keyframes x-ink-grow { 0% { transform: scale(0); } 18% { transform: scale(0.55); } 100% { transform: scale(1); } }
@keyframes x-ink-halo { 0% { transform: scale(0); opacity: 0.6; } 100% { transform: scale(1); opacity: 0.22; } }
.x-ink-label { opacity: 0; animation: x-ink-fade 600ms var(--ease-paper) calc(var(--d, 0ms) + 700ms) both; }
@keyframes x-ink-fade { from { opacity: 0; } to { opacity: 1; } }
.x-ink-line { fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: x-ink-draw 1700ms cubic-bezier(0.45, 0, 0.25, 1) var(--d, 0ms) both; }
@keyframes x-ink-draw { to { stroke-dashoffset: 0; } }
.x-ink-nib { offset-rotate: 0deg; animation: x-ink-nib 1700ms cubic-bezier(0.45, 0, 0.25, 1) var(--d, 0ms) both; }
@keyframes x-ink-nib { 0% { offset-distance: 0%; opacity: 0; } 6% { opacity: 1; } 92% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
.x-ink-seal { transform-box: fill-box; transform-origin: center; animation: x-ink-stamp 520ms cubic-bezier(0.3, 1.4, 0.5, 1) var(--d, 0ms) both; }
@keyframes x-ink-stamp { 0% { opacity: 0; transform: scale(1.8) rotate(-10deg); } 100% { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .x-ink-grow, .x-ink-halo, .x-ink-seal, .x-ink-line { animation: x-ink-fade 400ms linear both; transform: none; stroke-dashoffset: 0; }
  .x-ink-halo { opacity: 0.22; }
  .x-ink-label { animation: none; opacity: 1; }
  .x-ink-nib { display: none; }
}
`
type Key = "brisbane" | "canada" | "kyoto"

export default function JourneyInkPins() {
  const { t } = useLang()
  const id = useId().replace(/:/g, "")
  // Each place's blot remounts (and so replays) when its count goes up; Kyoto's replays the whole map
  const [n, setN] = useState({ brisbane: 0, canada: 0, kyoto: 0, all: 0 })
  const fresh = n.all === 0
  const places: { key: Key; at: [number, number]; colour: string; name: string; delay: number }[] = [
    { key: "brisbane", at: PLACES.brisbane, colour: "var(--ink-story)", name: t.journey.brisbane, delay: 300 },
    { key: "canada", at: PLACES.canada, colour: "var(--ink-moss)", name: t.journey.canada, delay: 800 },
    { key: "kyoto", at: KYOTO, colour: "var(--action)", name: t.story.kyoto, delay: 1300 },
  ]
  const lines = [
    { from: PLACES.brisbane, lift: 0.3, colour: "var(--ink-story)", delay: 2200 },
    { from: PLACES.canada, lift: 0.2, colour: "var(--ink-moss)", delay: 2700 },
  ]
  const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties
  const replay = (k: Key) => setN((x) => (k === "kyoto" ? { brisbane: 0, canada: 0, kyoto: 0, all: x.all + 1 } : { ...x, [k]: x[k] + 1 }))

  return (
    <div className="x-ink">
      <style>{css}</style>
      <p className="x-ink-eyebrow">{t.journey.kyoto}</p>
      <div className="x-ink-card">
        <svg key={n.all} viewBox="0 0 400 320" className="journey is-in journey-map journey-hifi" role="img" aria-label={`${t.journey.list.nadia}. ${t.journey.list.griffin}.`}>
          <defs>
            {/* Ink on paper: a turbulent edge for the blots, and a faint wobble for the pen */}
            <filter id={`${id}-bleed`} x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="7" /><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G" /></filter>
            <filter id={`${id}-pen`} x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="1" seed="2" /><feDisplacementMap in="SourceGraphic" scale="1.4" /></filter>
            <radialGradient id={`${id}-ink`}><stop offset="0" stopColor="#fff" /><stop offset="0.7" stopColor="#fff" stopOpacity="0.92" /><stop offset="1" stopColor="#fff" stopOpacity="0.55" /></radialGradient>
            {places.map((p) => (
              <mask key={`${p.key}-${n[p.key]}`} id={`${id}-m-${p.key}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320">
                <g filter={`url(#${id}-bleed)`} style={d(n[p.key] || !fresh ? 0 : p.delay)}>
                  <circle cx={p.at[0]} cy={p.at[1]} r="15" fill={`url(#${id}-ink)`} className="x-ink-grow" />
                  <circle cx={p.at[0] + 9} cy={p.at[1] - 8} r="5" fill="#fff" className="x-ink-grow" style={d((n[p.key] || !fresh ? 0 : p.delay) + 160)} />
                  <circle cx={p.at[0] - 10} cy={p.at[1] + 6} r="3.5" fill="#fff" className="x-ink-grow" style={d((n[p.key] || !fresh ? 0 : p.delay) + 260)} />
                </g>
              </mask>
            ))}
          </defs>
          <JourneyLand />

          {lines.map((l, i) => (
            <g key={i} filter={`url(#${id}-pen)`}>
              <path d={arc(l.from, KYOTO, l.lift)} className="x-ink-line" pathLength={1} stroke={l.colour} style={d(fresh ? l.delay : l.delay - 1500)} />
            </g>
          ))}
          {lines.map((l, i) => (
            <circle key={i} r="2.6" fill={l.colour} className="x-ink-nib" style={{ ...d(fresh ? l.delay : l.delay - 1500), offsetPath: `path("${arc(l.from, KYOTO, l.lift)}")` }} />
          ))}

          {places.map((p) => {
            const delay = n[p.key] || !fresh ? 0 : p.delay
            return (
              <g key={`${p.key}-${n[p.key]}`} aria-hidden>
                <circle cx={p.at[0]} cy={p.at[1]} r="34" fill={p.colour} className="x-ink-halo" style={d(delay)} filter={`url(#${id}-bleed)`} />
                <rect x={p.at[0] - 30} y={p.at[1] - 30} width="60" height="60" fill={p.colour} mask={`url(#${id}-m-${p.key})`} />
                {p.key === "kyoto"
                  ? <g className="x-ink-seal" style={d(delay + 700)}>
                      <rect x={KYOTO[0] - 13} y={KYOTO[1] - 13} width="26" height="26" rx="6" className="journey-seal" />
                      <text x={KYOTO[0]} y={KYOTO[1] + 6} textAnchor="middle" className="journey-seal-text">京</text>
                    </g>
                  : <text x={p.at[0] + (p.key === "canada" ? 22 : 36)} y={p.at[1] + (p.key === "canada" ? 54 : 4)} textAnchor={p.key === "canada" ? "middle" : "start"} className="journey-place x-ink-label" style={d(delay)}>{p.name}</text>}
              </g>
            )
          })}
          <text x={KYOTO[0] - 26} y={KYOTO[1] + 4} textAnchor="end" className="journey-place journey-place-kyoto x-ink-label" style={d(fresh ? 1300 : 0)} aria-hidden>{t.story.kyoto}</text>
        </svg>
        {places.map((p) => (
          <button key={p.key} type="button" className="x-ink-pin" style={{ left: `${(p.at[0] / 400) * 100}%`, top: `${(p.at[1] / 320) * 100}%` }}
            aria-label={p.name} onClick={() => replay(p.key)} />
        ))}
      </div>
      <ul className="x-ink-legend" aria-hidden>
        <li><span style={{ borderColor: "var(--ink-story)" }} />{t.journey.list.nadia}</li>
        <li><span style={{ borderColor: "var(--ink-moss)" }} />{t.journey.list.griffin}</li>
      </ul>
    </div>
  )
}
