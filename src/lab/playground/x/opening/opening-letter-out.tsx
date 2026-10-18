import { useState } from "react"
import { ART } from "@/lib/art"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { NamesArt } from "@/components/names-art"
import { Stage } from "../../stage"
import { still } from "../../motion"

/**
 * The letter coming out of Nadia's open envelope (18 Oct, two layers: the back, then the letter, then the pocket and
 * seal), three ways:
 * A: as the site does it, with better timing: the flap opens, a beat, the letter rises clear of the pocket, the envelope settles away.
 * B: the closed flap turns over in 3D with a soft shadow before the letter rises.
 * C: the letter lifts with a slight bend, as paper does, while the envelope eases down and away.
 * Reduced motion: each shows its last frame.
 */
const base = import.meta.env.BASE_URL
const src = (k: "closed" | "open" | "openFront") => `${base}${ART.drawnEnvelope[k]}-820.webp`
const css = `
.x-lo { position: relative; width: min(80vw, 380px); aspect-ratio: ${ART.drawnEnvelope.ratio}; margin-top: 30%; perspective: 900px; }
.x-lo img, .x-lo-letter { position: absolute; left: 0; width: 100%; height: auto; pointer-events: none; user-select: none; }
.x-lo .back, .x-lo .front { bottom: 0; }
.x-lo .back { z-index: 1; } .x-lo .front { z-index: 3; }
.x-lo .closed { top: 0; z-index: 4; transform-origin: 50% 0; }
.x-lo-letter { z-index: 2; left: 8%; width: 84%; top: 18%; aspect-ratio: 1.45; border-radius: 6px; background: var(--letter-bg); box-shadow: 0 1px 2px rgb(0 0 0 / .12), 0 10px 24px -14px rgb(0 0 0 / .4); display: grid; place-items: center; padding: 10%; transform-origin: 50% 100%; }
.x-lo-letter .names-art-wrap { width: 100%; }
/* A */
.x-lo[data-v="A"][data-go] .closed { opacity: 0; transition: opacity 220ms ease-out; }
.x-lo[data-v="A"][data-go] .x-lo-letter { transform: translateY(-62%); transition: transform 720ms cubic-bezier(.22,.9,.24,1) 260ms; }
.x-lo[data-v="A"][data-go] :is(.back, .front) { transform: translateY(14%); opacity: .0; transition: transform 600ms ease-in 900ms, opacity 500ms ease-in 1000ms; }
/* B */
.x-lo[data-v="B"] .closed { clip-path: inset(0 0 52% 0); }
.x-lo[data-v="B"] .closed-body { position: absolute; top: 0; left: 0; width: 100%; z-index: 4; clip-path: inset(48% 0 0 0); }
.x-lo[data-v="B"][data-go] .closed { transform: rotateX(-178deg); filter: drop-shadow(0 -12px 10px rgb(0 0 0 / .18)) brightness(.92); opacity: 0; transition: transform 520ms cubic-bezier(.4,0,.2,1), filter 520ms, opacity 120ms linear 420ms; }
.x-lo[data-v="B"][data-go] .closed-body { opacity: 0; transition: opacity 160ms linear 420ms; }
.x-lo[data-v="B"][data-go] .x-lo-letter { transform: translateY(-62%); transition: transform 720ms cubic-bezier(.22,.9,.24,1) 560ms; }
/* C */
.x-lo[data-v="C"][data-go] .closed { opacity: 0; transition: opacity 220ms ease-out; }
.x-lo[data-v="C"][data-go] .x-lo-letter { animation: x-lo-bend 900ms cubic-bezier(.3,.8,.3,1) 240ms both; }
.x-lo[data-v="C"][data-go] :is(.back, .front) { transform: translateY(26%) scale(.96); opacity: 0; transition: transform 800ms cubic-bezier(.4,0,.6,1) 420ms, opacity 600ms ease-in 600ms; }
@keyframes x-lo-bend { 0% { transform: none; } 45% { transform: translateY(-38%) rotateX(9deg) scaleY(.98); } 100% { transform: translateY(-64%) rotateX(0) scaleY(1); } }
@media (prefers-reduced-motion: reduce) { .x-lo * { transition: none !important; animation: none !important; } }
`
export default function OpeningLetterOut() {
  const [v, setV] = useState<"A" | "B" | "C">("A")
  const [go, setGo] = useState(still())
  const [n, setN] = useState(0)
  const replay = () => { setGo(false); setN((k) => k + 1); if (!still()) setTimeout(() => setGo(true), 400); else setGo(true) }
  return (
    <Stage photo hint="Tap the envelope. A is the site's (with better timing), B turns the flap in 3D, C bends the letter as it lifts.">
      <style>{css}</style>
      <Segmented label="Opening" value={v} onChange={(x) => { setV(x); setGo(still()); setN((k) => k + 1) }} items={[{ value: "A", label: "A · Timing" }, { value: "B", label: "B · 3D flap" }, { value: "C", label: "C · Bend" }]} />
      <button key={`${v}${n}`} type="button" className="x-lo" data-v={v} data-go={go || undefined} onClick={() => setGo(true)} aria-label="Open the envelope">
        <img className="back" src={src("open")} alt="" draggable={false} />
        <span className="x-lo-letter"><NamesArt /></span>
        <img className="front" src={src("openFront")} alt="" draggable={false} />
        <img className="closed" src={src("closed")} alt="" draggable={false} />
        {v === "B" && <img className="closed closed-body" src={src("closed")} alt="" draggable={false} />}
      </button>
      <Button variant="secondary" size="sm" onClick={replay}>Replay</Button>
    </Stage>
  )
}
