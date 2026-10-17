import { useRef } from "react"
import { useLang } from "@/lib/lang"
import { Stage } from "../../stage"
import { spring, still } from "../../motion"

/**
 * Three presses on the same button, side by side: a plain CSS ease, a CSS linear() spring, and a script spring from
 * the playground's clock (which also follows a press that lets go early). The press dips to 0.96; letting go comes
 * back a touch past 1 on the springs. Still under reduced motion.
 */
const css = `
.x-sp-row { display: grid; gap: var(--space-5); grid-template-columns: 1fr; width: min(100%, 720px); }
@media (min-width: 720px) { .x-sp-row { grid-template-columns: repeat(3, 1fr); } }
.x-sp-cell { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6) var(--space-4); border-radius: var(--radius-section); background: var(--letter-bg); box-shadow: var(--elevation-paper); }
.x-sp-cell p { font-size: var(--type-small-size); color: var(--ink-muted); text-align: center; max-width: 24ch; }
.x-sp-btn { min-width: 180px; min-height: 48px; padding-inline: var(--space-5); border-radius: var(--button-radius); font: 500 var(--type-body-size) / 1 var(--font-label); -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.x-sp-ease { transition: transform 200ms ease-out; }
.x-sp-ease:active { transform: scale(0.96); }
.x-sp-css { transition: transform 460ms linear(0, 0.5 8%, 1.06 22%, 1.02 32%, 0.99 45%, 1 60%, 1); }
.x-sp-css:active { transform: scale(0.96); transition-duration: 90ms; transition-timing-function: ease-out; }
@media (prefers-reduced-motion: reduce) { .x-sp-btn, .x-sp-btn:active { transition: none !important; transform: none !important; } }
`

function JsSpring({ label }: { label: string }) {
  const el = useRef<HTMLButtonElement>(null)
  const s = useRef(1), stop = useRef<() => void>(() => {})
  const to = (target: number, k: number, c: number) => {
    stop.current()
    stop.current = spring(s.current, target, (v) => { s.current = v; if (el.current) el.current.style.transform = `scale(${v})` }, { k, c })
  }
  return (
    <button ref={el} type="button" className="btn-primary x-sp-btn"
      onPointerDown={() => !still() && to(0.96, 900, 50)} onPointerUp={() => to(1, 380, 14)} onPointerLeave={() => to(1, 380, 14)} onPointerCancel={() => to(1, 380, 14)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") to(0.96, 900, 50) }} onKeyUp={() => to(1, 380, 14)}>{label}</button>
  )
}

export default function SpringPress() {
  const { t } = useLang()
  return (
    <Stage hint="Press and hold each one, then let go">
      <style>{css}</style>
      <div className="x-sp-row">
        <div className="x-sp-cell"><button type="button" className="btn-primary x-sp-btn x-sp-ease">{t.nav.rsvp}</button><p>CSS ease-out, 200 ms. Clean, but it lands flat.</p></div>
        <div className="x-sp-cell"><button type="button" className="btn-primary x-sp-btn x-sp-css">{t.nav.rsvp}</button><p>CSS linear() spring. A small overshoot, no script.</p></div>
        <div className="x-sp-cell"><JsSpring label={t.nav.rsvp} /><p>Script spring. Follows your finger: let go halfway and it turns round from there.</p></div>
      </div>
    </Stage>
  )
}
