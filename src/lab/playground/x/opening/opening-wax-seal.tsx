import { useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { loop } from "@/lib/frame"
import { Stage } from "../../stage"
import { getSpeed, ms, still, tween } from "../../motion"

/**
 * The paper envelope with the G&N wax seal. Press and hold the seal: a ring fills round it, hairline cracks run
 * across the wax, then it breaks into seven pieces that fall away, tumbling, and the flap opens and the letter rises.
 * Let go early and the ring drains away. Skip is always there; Enter or Space breaks it too. Reduced motion: the seal
 * simply lifts and the envelope opens.
 */
const SEAL = `${import.meta.env.BASE_URL}brand/seal.svg`
// Seven wedges from the middle, their edges a little jagged, as wax breaks
const SHARDS = [
  "50% 50%, 52% 0%, 100% 0%, 100% 18%",
  "50% 50%, 100% 18%, 100% 58%, 96% 60%",
  "50% 50%, 96% 60%, 100% 100%, 64% 100%",
  "50% 50%, 64% 100%, 30% 100%, 34% 92%",
  "50% 50%, 34% 92%, 0% 100%, 0% 66%",
  "50% 50%, 0% 66%, 0% 22%, 8% 24%",
  "50% 50%, 8% 24%, 0% 0%, 52% 0%",
].map((p) => `polygon(${p})`)
const css = `
.x-ws { position: relative; display: grid; place-items: center; }
.x-ws .envelope { cursor: default; }
.x-ws.is-open .envelope-flap { transform: rotateX(180deg); }
.x-ws.is-open .envelope-paper { transform: translateY(-52%); transition: transform var(--duration-slow) var(--ease-paper) var(--duration-base); }
.x-ws .envelope:hover { transform: none; }
.x-ws .x-ws-seal { position: absolute; inset: auto; left: 50%; top: 58%; width: 64px; height: 64px; translate: -50% -50%; z-index: 5; border-radius: 50%; touch-action: none; cursor: pointer; outline: 2px solid transparent; outline-offset: 6px; -webkit-tap-highlight-color: transparent; }
.x-ws-seal:focus-visible { outline-color: var(--input-focus); }
.x-ws-shard { position: absolute; inset: 0; background: url(${SEAL}) center / 100% 100%; will-change: transform, opacity; filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.25)); }
.x-ws-ring { position: absolute; inset: -10px; width: calc(100% + 20px); height: calc(100% + 20px); pointer-events: none; overflow: visible; }
.x-ws-ring circle { fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; filter: drop-shadow(0 1px 3px rgb(0 0 0 / 0.4)); }
.x-ws-cracks { position: absolute; inset: 0; pointer-events: none; }
.x-ws-cracks path { fill: none; stroke: rgb(255 240 230 / 0.85); stroke-width: 0.8; }
.x-ws-skip { position: absolute; z-index: 6; right: var(--space-4); bottom: calc(var(--space-5) + env(safe-area-inset-bottom)); min-height: 44px; padding-inline: var(--space-4); border-radius: var(--radius-pill); background: color-mix(in oklab, var(--letter-bg) 90%, transparent); color: var(--ink); font: 500 var(--type-small-size) / 1 var(--font-label); box-shadow: var(--elevation-paper); }
.x-ws-skip:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.x-ws-words { position: absolute; left: 10%; right: 10%; top: 14%; display: flex; flex-direction: column; gap: 4px; color: var(--ink-soft); font-size: var(--type-label-size); text-align: center; }
.x-ws-words strong { font: 400 1.25rem / 1.1 var(--font-display); color: var(--ink); }
`
type Piece = { x: number; y: number; vx: number; vy: number; r: number; vr: number }

export default function WaxSeal() {
  const { t } = useLang()
  const { household } = useHousehold()
  const names = household?.guests.filter((g) => !g.plusOne).map((g) => g.firstName).join(" & ") ?? ""
  const [hold, setHold] = useState(0) // the ring, 0 to 1
  const [phase, setPhase] = useState<"sealed" | "breaking" | "open">("sealed")
  const holdRef = useRef(0), stop = useRef<() => void>(() => {})
  const shards = useRef<(HTMLSpanElement | null)[]>([])
  const fall = useRef<(() => void) | null>(null)

  const breakIt = () => {
    stop.current()
    if (still()) { setPhase("open"); return }
    setPhase("breaking")
    // The pieces fly out from the middle, then fall and tumble
    const pieces: Piece[] = SHARDS.map((_, i) => { const a = ((i + 0.5) / SHARDS.length) * Math.PI * 2 - Math.PI / 2; return { x: 0, y: 0, vx: Math.cos(a) * (90 + Math.random() * 60), vy: Math.sin(a) * (90 + Math.random() * 60) - 60, r: 0, vr: (Math.random() - 0.5) * 540 } })
    let then = performance.now(), life = 0
    fall.current = loop((now) => {
      const dt = Math.min(0.05, (now - then) / 1000) * getSpeed(); then = now; life += dt
      pieces.forEach((p, i) => {
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt
        const el = shards.current[i]; if (el) { el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`; el.style.opacity = String(Math.max(0, 1 - life * 0.9)) }
      })
      if (life > 0.22 && life - dt <= 0.22) setPhase("open") // the flap goes as the pieces leave
      if (life > 1.4) { fall.current = null; return false }
    })
  }
  const down = () => {
    if (phase !== "sealed") return
    if (still()) return breakIt()
    stop.current()
    const from = holdRef.current
    stop.current = tween(700 * (1 - from), (k, done) => { holdRef.current = from + (1 - from) * k; setHold(holdRef.current); if (done) breakIt() }, (x) => x)
  }
  const up = () => {
    if (phase !== "sealed" || holdRef.current >= 1) return
    stop.current(); const from = holdRef.current
    stop.current = tween(300 * from, (k) => { holdRef.current = from * (1 - k); setHold(holdRef.current) })
  }
  const reset = () => { fall.current?.(); fall.current = null; stop.current(); holdRef.current = 0; setHold(0); setPhase("sealed"); shards.current.forEach((el) => { if (el) { el.style.transform = ""; el.style.opacity = "" } }) }
  useEffect(() => () => { fall.current?.(); stop.current() }, [])
  const crack = Math.max(0, (hold - 0.55) / 0.45)
  return (
    <Stage photo hint={phase === "sealed" ? "Press and hold the wax seal" : "Opened"}>
      <style>{css}</style>
      <div className={phase === "open" ? "x-ws is-open" : "x-ws"}>
        <span className="envelope paper">
          <span aria-hidden className="envelope-back" />
          <span aria-hidden className="envelope-paper"><span className="x-ws-words"><strong>Griffin &amp; Nadia</strong>{t.home.dateLine}</span></span>
          <span aria-hidden className="envelope-front" />
          <span aria-hidden className="envelope-flap" />
          <span className="x-ws-seal" role="button" tabIndex={0} aria-label={`${t.letter.openLabel(names)}: hold the seal to break it`}
            onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); down() }} onPointerUp={up} onPointerCancel={up}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); breakIt() } }}
            style={{ opacity: phase === "open" && still() ? 0 : 1, transform: `scale(${1 - hold * 0.06})` }}>
            {SHARDS.map((clip, i) => <span key={i} ref={(el) => { shards.current[i] = el }} className="x-ws-shard" style={{ clipPath: clip }} />)}
            {crack > 0 && phase === "sealed" && <svg viewBox="0 0 64 64" className="x-ws-cracks" style={{ opacity: crack }}><path d="M32 32 L33 4 M32 32 L62 13 M32 32 L60 38 M32 32 L41 62 M32 32 L21 59 M32 32 L4 42 M32 32 L6 15" /></svg>}
            {phase === "sealed" && hold > 0 && <svg viewBox="0 0 84 84" className="x-ws-ring" aria-hidden><circle cx="42" cy="42" r="38" pathLength={1} strokeDasharray={`${hold} 1`} transform="rotate(-90 42 42)" /></svg>}
          </span>
        </span>
      </div>
      {phase === "sealed"
        ? <button type="button" className="x-ws-skip" onClick={breakIt}>Skip</button>
        : <button type="button" className="x-ws-skip inline-flex items-center gap-2" onClick={() => window.setTimeout(reset, ms(0))}><RotateCcw className="size-4" aria-hidden />Seal it again</button>}
    </Stage>
  )
}
