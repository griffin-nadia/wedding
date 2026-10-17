import { useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { useHousehold } from "@/lib/household"
import { FORTUNES } from "@/content/en"
import { SlipWords, fortuneIndex } from "@/components/fortune-card"
import { Stage } from "../../stage"
import { spring, still } from "../../motion"

/**
 * The omikuji slip arrives folded in three, as a real one is. Tap it: the top third opens out toward you, then the
 * bottom third, each a sheet turning on its crease with the light moving across it, and the slip settles flat with
 * a last small give. The words are the household's own fortune. Reduced motion: it opens flat at once.
 */
const H = 420
const css = `
.x-fu { perspective: 1100px; width: min(100%, 320px); }
.x-fu-slip { position: relative; height: ${H / 3}px; margin-top: ${H / 3}px; margin-bottom: ${H / 3}px; transform-style: preserve-3d; cursor: pointer; outline: 2px solid transparent; outline-offset: 6px; border-radius: var(--radius-control); -webkit-tap-highlight-color: transparent; }
.x-fu-slip:focus-visible { outline-color: var(--input-focus); }
.x-fu-panel { position: absolute; left: 0; right: 0; height: ${H / 3}px; transform-style: preserve-3d; }
.x-fu-top { bottom: 100%; transform-origin: 50% 100%; }
.x-fu-mid { top: 0; }
.x-fu-bot { top: 100%; transform-origin: 50% 0; }
.x-fu-face { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.x-fu-face .omikuji-slip { animation: none !important; position: absolute; left: 0; right: 0; height: ${H}px; max-width: none; margin: 0; border-radius: 0; box-shadow: none; }
.x-fu-top .x-fu-face .omikuji-slip { top: 0; }
.x-fu-mid .x-fu-face .omikuji-slip { top: -${H / 3}px; }
.x-fu-bot .x-fu-face .omikuji-slip { top: -${(2 * H) / 3}px; }
.x-fu-back { transform: rotateX(180deg); background: var(--brand-paper-bright); background-image: var(--texture-hatch); background-size: 512px; background-blend-mode: var(--paper-blend); }
.x-fu-back::after { content: "大吉"; position: absolute; inset: 0; display: grid; place-items: center; font: 2.6rem/1 var(--font-ja); color: var(--brand-doro); opacity: 0.08; transform: scaleY(-1); } /* the ink showing through the paper */
.x-fu-shade { position: absolute; inset: 0; pointer-events: none; }
.x-fu-mid { box-shadow: 0 18px 30px -18px rgb(var(--tint-shadow) / 0.4); }
.x-fu-cue { font: 500 var(--type-small-size) / 1.4 var(--font-label); color: var(--ink-muted); text-align: center; }
`

export default function FortuneUnfold() {
  const { household } = useHousehold()
  const i = fortuneIndex(household?.token ?? "sample", FORTUNES.length)
  // u runs 0 → 2: the top third opens over 0 → 1, then the bottom third over 1 → 2
  const [u, setU] = useState(0)
  const stop = useRef<() => void>(() => {})
  const open = u > 1.98
  const go = (to: number) => { stop.current(); if (still()) { setU(to); return } stop.current = spring(u, to, setU, { k: 70, c: 13 }) }
  const top = -180 * (1 - Math.min(1, Math.max(0, u))), bot = 180 * (1 - Math.min(1, Math.max(0, u - 1)))
  const shade = (deg: number) => Math.abs(Math.sin((deg * Math.PI) / 180)) * 0.35
  const slip = <div className="omikuji-slip paper-feel"><SlipWords i={i} of={FORTUNES.length} text={FORTUNES[i]} /></div>
  return (
    <Stage hint={open ? "Your fortune" : "Tap the folded slip to open it"}>
      <style>{css}</style>
      <div className="x-fu">
        <div className="x-fu-slip" role="button" tabIndex={0} aria-label={open ? "The fortune, open" : "Open the fortune"} aria-expanded={open}
          onClick={() => !open && go(2)} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !open) { e.preventDefault(); go(2) } }}>
          <div className="x-fu-panel x-fu-mid"><div className="x-fu-face">{slip}</div></div>
          <div className="x-fu-panel x-fu-bot" style={{ transform: `rotateX(${bot}deg)`, zIndex: u < 1 ? 1 : 2 }}>
            <div className="x-fu-face">{slip}<span className="x-fu-shade" style={{ background: `linear-gradient(to bottom, rgb(0 0 0 / ${shade(bot)}), transparent)` }} /></div>
            <div className="x-fu-face x-fu-back" />
          </div>
          <div className="x-fu-panel x-fu-top" style={{ transform: `rotateX(${top}deg)`, zIndex: u < 1 ? 3 : 1 }}>
            <div className="x-fu-face">{slip}<span className="x-fu-shade" style={{ background: `linear-gradient(to top, rgb(0 0 0 / ${shade(top)}), transparent)` }} /></div>
            <div className="x-fu-face x-fu-back" />
          </div>
        </div>
      </div>
      {open
        ? <button type="button" className="btn-text inline-flex min-h-11 items-center gap-2 text-small" onClick={() => go(0)}><RotateCcw className="size-4" aria-hidden />Fold it again</button>
        : <p className="x-fu-cue" aria-hidden>Folded in three</p>}
    </Stage>
  )
}
