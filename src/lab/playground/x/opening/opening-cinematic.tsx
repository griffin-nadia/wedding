import { useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { useTheme } from "@/lib/theme"
import { photoFor } from "@/lib/scenes"
import { Stage } from "../../stage"
import { ms, still } from "../../motion"

/**
 * A short film before the letter: their photo slowly pushes in between black bars, the names write on, the date
 * fades up, then the bars ease away and the letter rises over the photo. Under four seconds; Skip is always there
 * and any key skips. Reduced motion: the title card, still, then the letter on a tap.
 */
const base = import.meta.env.BASE_URL
const css = `
.x-cn { position: fixed; inset: 0; z-index: 4; overflow: hidden; background: #000; }
.x-cn-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.18); opacity: 0; transition: transform 5200ms cubic-bezier(0.2, 0, 0.1, 1), opacity 1200ms ease; }
.x-cn[data-step="1"] .x-cn-photo, .x-cn[data-step="2"] .x-cn-photo, .x-cn[data-step="3"] .x-cn-photo { opacity: 1; transform: scale(1.04); }
.x-cn-photo-shade { position: absolute; inset: 0; background: linear-gradient(transparent 40%, rgb(0 0 0 / 0.55)); }
.x-cn-bar { position: absolute; left: 0; right: 0; height: 14svh; background: #000; transition: transform 900ms cubic-bezier(0.6, 0, 0.2, 1); }
.x-cn-bar.is-top { top: 0; }
.x-cn-bar.is-bottom { bottom: 0; }
.x-cn[data-step="3"] .x-cn-bar.is-top { transform: translateY(-100%); }
.x-cn[data-step="3"] .x-cn-bar.is-bottom { transform: translateY(100%); }
.x-cn-title { position: absolute; left: 0; right: 0; bottom: 22svh; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: #fff; text-align: center; transition: opacity 600ms ease; }
.x-cn[data-step="3"] .x-cn-title { opacity: 0; }
.x-cn-names { font: 400 clamp(2.6rem, 9vw, 5rem) / 1 var(--font-display); clip-path: inset(0 100% 0 0); transition: clip-path 1400ms cubic-bezier(0.6, 0, 0.2, 1); }
.x-cn[data-step="1"] .x-cn-names, .x-cn[data-step="2"] .x-cn-names, .x-cn[data-step="3"] .x-cn-names { clip-path: inset(0 0 0 0); }
.x-cn-date { font: 500 var(--type-small-size) / 1.4 var(--font-label); letter-spacing: 0.18em; text-transform: uppercase; opacity: 0; transition: opacity 800ms ease; }
.x-cn[data-step="2"] .x-cn-date, .x-cn[data-step="3"] .x-cn-date { opacity: 0.85; }
.x-cn-skip { position: absolute; z-index: 6; right: var(--space-4); bottom: calc(var(--space-5) + env(safe-area-inset-bottom)); min-height: 44px; padding-inline: var(--space-4); border-radius: var(--radius-pill); background: rgb(255 255 255 / 0.14); color: #fff; font: 500 var(--type-small-size) / 1 var(--font-label); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.x-cn-skip:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.x-cn-letter { display: flex; flex-direction: column; gap: var(--space-3); width: min(100%, 520px); padding: var(--space-6); border-radius: var(--letter-radius); background: var(--letter-bg); color: var(--ink-soft); animation: x-cn-rise var(--duration-slow) var(--ease-paper) both; }
@keyframes x-cn-rise { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .x-cn * { transition: none !important; } .x-cn-letter { animation: none; } }
`

export default function Cinematic() {
  const { t } = useLang()
  const { theme } = useTheme()
  const { household } = useHousehold()
  const names = household?.guests.filter((g) => !g.plusOne).map((g) => g.firstName) ?? []
  // 0 dark, 1 the photo and the names, 2 the date, 3 the bars go, then the letter
  const [step, setStep] = useState(still() ? 2 : 0)
  const [film, setFilm] = useState(true)
  const [run, setRun] = useState(0)
  const timers = useRef<number[]>([])
  const skip = () => { timers.current.forEach(clearTimeout); setFilm(false) }
  useEffect(() => {
    if (still()) return
    const at = (t: number, f: () => void) => timers.current.push(window.setTimeout(f, ms(t)))
    at(80, () => setStep(1)); at(1500, () => setStep(2)); at(2700, () => setStep(3)); at(3600, () => setFilm(false))
    const key = () => skip()
    addEventListener("keydown", key)
    return () => { timers.current.forEach(clearTimeout); timers.current = []; removeEventListener("keydown", key) }
  }, [run])
  const replay = () => { setStep(still() ? 2 : 0); setFilm(true); setRun((n) => n + 1) }
  return (
    <Stage photo hint={film ? undefined : "The letter, after the film"}>
      <style>{css}</style>
      {film && (
        <div className="x-cn" data-step={step} onClick={() => still() && skip()}>
          <img className="x-cn-photo" src={`${base}scenes/${photoFor(theme)}-1600.webp`} alt="" />
          <div className="x-cn-photo-shade" />
          <div className="x-cn-bar is-top" /><div className="x-cn-bar is-bottom" />
          <div className="x-cn-title">
            <h1 className="x-cn-names">Griffin &amp; Nadia</h1>
            <p className="x-cn-date">{t.home.dateLine}</p>
          </div>
          <button type="button" className="x-cn-skip" onClick={skip}>{still() ? "Open" : "Skip"}</button>
        </div>
      )}
      {!film && (
        <article className="x-cn-letter paper-feel">
          <h2 className="names">Griffin <span style={{ color: "var(--leaf)" }}>&amp;</span> Nadia</h2>
          <p className="date-badge">{t.home.dateLine}</p>
          <p><span className="text-foreground">{t.home.dear(t.home.dearNames(names))}</span> {t.home.greetingLine}</p>
          <button type="button" className="btn-text inline-flex min-h-11 items-center gap-2 self-start text-small" onClick={replay}><RotateCcw className="size-4" aria-hidden />Play the film again</button>
        </article>
      )}
    </Stage>
  )
}
