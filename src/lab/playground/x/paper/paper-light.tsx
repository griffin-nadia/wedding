import { useEffect, useRef } from "react"
import { PaperTexture } from "@paper-design/shaders-react"
import { useTheme } from "@/lib/theme"
import { useLang } from "@/lib/lang"
import { PAPER, inkFor, nightOf } from "@/lib/paper"
import { NamesArt } from "@/components/names-art"
import { Button } from "@/components/ui/button"
import { Stage } from "../../stage"
import { still } from "../../motion"
import { useKnob, useTake } from "../../params"

/**
 * Paper and light (lab run 19).
 * - side-by-side: Paper's own live PaperTexture beside the site's, same settings, same card: on the left the shader
 *   running live (as on shaders.paper.design), on the right the site's way, drawn once at this screen's size and laid
 *   over the card (--paper-live, src/lib/paper-live.ts). They should look alike; any difference is what ours costs.
 * - sweep: a very soft band of light crosses the site's card once when the theme changes (after the circle reveal),
 *   as if a lamp went on or the sun came round. One element, a transform and opacity, on its own layer: it should cost
 *   nothing measurable (the badge has the numbers). Change the light here or with the sun or moon in the bar.
 * Reduced motion: no sweep.
 */
const P = "x-pl"
const css = `
.${P} { display: grid; gap: var(--space-4); grid-template-columns: repeat(2, minmax(0, 1fr)); width: min(100%, 760px); }
.${P}-card { position: relative; isolation: isolate; aspect-ratio: 3 / 4; border-radius: var(--letter-radius); overflow: hidden; background: var(--letter-bg); color: var(--ink); box-shadow: var(--elevation-paper); display: grid; align-content: end; padding: var(--space-4); }
.${P}-card > div:first-child { position: absolute !important; inset: 0; z-index: 2; pointer-events: none; }
.${P}-ours::after { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; background: var(--paper-live, none) center / cover no-repeat; mix-blend-mode: var(--paper-blend); opacity: var(--paper-on, var(--paper-strength)); }
.${P}-card p { position: relative; z-index: 1; font: 500 var(--type-small-size) / 1.4 var(--font-label); }
.${P}-sweep { position: fixed; z-index: 25; pointer-events: none; overflow: hidden; border-radius: var(--letter-radius); contain: strict; }
.${P}-sweep::before { content: ""; position: absolute; top: -20%; bottom: -20%; left: -60%; width: 60%; rotate: 12deg; will-change: transform, opacity; opacity: 0;
  background: linear-gradient(90deg, transparent, rgb(255 246 222 / var(--a)), transparent); mix-blend-mode: soft-light; animation: x-pl-sweep 1100ms cubic-bezier(.4,0,.2,1) var(--delay) both; }
@keyframes x-pl-sweep { 0% { transform: translateX(0); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateX(380%); opacity: 0; } }
.${P}-names { width: min(80%, 300px); }
`
function Sweep({ strength }: { strength: number }) {
  const { theme } = useTheme()
  const first = useRef(true)
  const layer = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (still() || strength <= 0) return
    const card = document.getElementById("letter")
    if (!card) return
    // Over the card exactly, once, after the mode's circle reveal (about 600 ms)
    const r = card.getBoundingClientRect()
    const el = document.createElement("div")
    el.className = `${P}-sweep`
    Object.assign(el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
    el.style.setProperty("--a", String(strength)); el.style.setProperty("--delay", "620ms")
    document.body.appendChild(el); layer.current?.remove(); layer.current = el
    const done = () => el.remove()
    el.addEventListener("animationend", done, { once: true })
    return () => { el.removeEventListener("animationend", done); el.remove() }
  }, [theme, strength])
  return null
}

export default function PaperLight() {
  const take = useTake("side-by-side")
  const strength = useKnob("sweep", 0.35)
  const { theme, setTheme } = useTheme()
  const { t } = useLang()
  const night = theme === "lantern"
  if (take === "sweep") return (
    <Stage hint="Change the light (here, or the sun or moon in the bar): a soft band of light crosses the card once.">
      <style>{css}</style>
      <Sweep strength={strength} />
      <NamesArt className={`${P}-names`} />
      <p className="text-small">{t.meta.shortTitle}</p>
      <Button variant="secondary" onClick={() => setTheme(night ? "autumn" : "lantern")}>{night ? "Change to Light" : "Change to Lantern"}</Button>
    </Stage>
  )
  const strengthOf = night ? 0.2 : 0.14
  return (
    <Stage hint="Left: Paper's own shader, live. Right: the site's, made once and laid over. Same settings.">
      <style>{css}</style>
      <div className={P}>
        <div className={`${P}-card`}>
          <PaperTexture speed={0} fit="cover" {...(night ? nightOf(PAPER) : PAPER)} {...inkFor(night)} style={{ mixBlendMode: night ? "screen" : "multiply", opacity: strengthOf }} />
          <p>{t.meta.shortTitle} · Paper, live</p>
        </div>
        <div className={`${P}-card ${P}-ours`}><p>{t.meta.shortTitle} · the site's</p></div>
      </div>
    </Stage>
  )
}
