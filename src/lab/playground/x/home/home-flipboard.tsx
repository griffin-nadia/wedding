import { useEffect, useState } from "react"
import { Letter, SignOff } from "@/components/letter/letter"
import { Scene } from "@/components/letter/scene"
import { COUPLE } from "@/content/en"
import { config } from "@/lib/config"
import { partsAt, sentence } from "@/lib/countdown-parts"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { sceneFor } from "@/lib/scenes"
import { useTheme } from "@/lib/theme"
import { ms, still } from "../../motion"

/**
 * Home's letter with the countdown as a split-flap departure board. Each digit is a flap: when it changes, the top
 * half of the old number falls forward on its hinge (darkening as it goes), and the bottom half of the new one lands
 * with a small bounce, the click-clack of a station board. Digits that change together cascade right to left. On
 * load the board shuffles once before it settles. Reduced motion: the digits just swap.
 */
const css = `
.x-home-flipboard { position: relative; min-height: var(--stage-h, 100svh); padding: 16px 12px 24px; display: grid; align-items: start; }
@media (min-width: 768px) { .x-home-flipboard { padding: var(--letter-top) 24px var(--space-8); } }
@media (min-width: 1024px) { .x-home-flipboard { padding-left: var(--letter-left); } }
.x-home-flipboard .letter { min-height: 0; width: 100%; }
.x-home-flipboard-dear { max-width: 34em; }

.x-home-flipboard-board {
  --w: clamp(26px, 7.6vw, 54px); --h: calc(var(--w) * 1.42); --r: calc(var(--w) * 0.12);
  display: flex; flex-wrap: nowrap; justify-content: space-between; gap: calc(var(--w) * 0.28);
  padding: calc(var(--w) * 0.32); border-radius: var(--radius-section);
  background: color-mix(in oklab, var(--surface-alt) 80%, var(--ink) 4%);
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.14), inset 0 0 0 1px var(--line-hairline);
}
.x-home-flipboard-group { display: grid; justify-items: center; gap: var(--space-2); }
.x-home-flipboard-digits { display: flex; gap: calc(var(--w) * 0.08); }
.x-home-flipboard-unit { font-family: var(--font-label); font-size: var(--type-small-size); line-height: 1; color: var(--ink-soft); letter-spacing: 0.04em; }
.x-home-flipboard-caption { font-family: var(--font-label); font-size: var(--type-small-size); color: var(--ink-soft); }

.x-home-flipboard-flap {
  --card: color-mix(in oklab, var(--letter-bg) 70%, var(--surface-raised));
  position: relative; width: var(--w); height: var(--h); perspective: calc(var(--w) * 7);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-weight: 500; font-size: calc(var(--w) * 0.98); line-height: var(--h); text-align: center;
  font-variant-numeric: lining-nums tabular-nums; letter-spacing: -0.02em; color: var(--ink);
  border-radius: var(--r); box-shadow: 0 1px 1px rgb(0 0 0 / 0.12), 0 2px 6px -2px rgb(0 0 0 / 0.18);
}
.x-home-flipboard-half { position: absolute; left: 0; right: 0; height: 50%; overflow: hidden; backface-visibility: hidden; }
.x-home-flipboard-half > span { display: block; height: var(--h); }
.x-home-flipboard-top { top: 0; border-radius: var(--r) var(--r) 0 0; transform-origin: 50% 100%;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--card) 92%, #fff), var(--card)); box-shadow: inset 0 -1px 0 rgb(0 0 0 / 0.16); }
.x-home-flipboard-bot { bottom: 0; border-radius: 0 0 var(--r) var(--r); transform-origin: 50% 0;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--card) 94%, #000), var(--card)); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.25); }
.x-home-flipboard-bot > span { transform: translateY(-50%); }
/* The hinge pins either side of the split */
.x-home-flipboard-flap::before, .x-home-flipboard-flap::after { content: ""; position: absolute; z-index: 5; top: calc(50% - 2px); width: 3px; height: 4px; border-radius: 1px; background: color-mix(in oklab, var(--ink) 35%, transparent); }
.x-home-flipboard-flap::before { left: -1px; } .x-home-flipboard-flap::after { right: -1px; }

.x-home-flipboard-fall, .x-home-flipboard-rise, .x-home-flipboard-under { position: absolute; }
.x-home-flipboard-fall { z-index: 3; animation: x-home-flipboard-fall 170ms cubic-bezier(.55,0,.9,.4) var(--d, 0ms) both; }
.x-home-flipboard-fall::after, .x-home-flipboard-under::after { content: ""; position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; }
.x-home-flipboard-fall::after { animation: x-home-flipboard-dark 170ms ease-in var(--d, 0ms) both; }
.x-home-flipboard-under { z-index: 2; animation: x-home-flipboard-gone 360ms steps(1, end) var(--d, 0ms) both; }
.x-home-flipboard-under::after { animation: x-home-flipboard-shade 170ms ease-in var(--d, 0ms) both; }
.x-home-flipboard-rise { z-index: 4; animation: x-home-flipboard-rise 210ms cubic-bezier(.2,.7,.3,1) calc(var(--d, 0ms) + 165ms) both; }
@keyframes x-home-flipboard-fall { from { transform: rotateX(0deg); } to { transform: rotateX(-90deg); } }
@keyframes x-home-flipboard-dark { to { opacity: 0.32; } }
@keyframes x-home-flipboard-shade { to { opacity: 0.18; } }
@keyframes x-home-flipboard-gone { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes x-home-flipboard-rise { 0% { transform: rotateX(90deg); } 70% { transform: rotateX(-9deg); } 86% { transform: rotateX(3deg); } 100% { transform: rotateX(0deg); } }
@media (prefers-reduced-motion: reduce) { .x-home-flipboard-fall, .x-home-flipboard-rise, .x-home-flipboard-under { display: none; } }
`

/** One flap. Keeps the number it showed last, so a change plays old top falling, new bottom landing. */
function Flap({ ch, delay }: { ch: string; delay: number }) {
  const [s, set] = useState({ cur: ch, prev: ch, n: 0 })
  if (s.cur !== ch) set({ cur: ch, prev: s.cur, n: s.n + 1 })
  const d = { ["--d" as string]: `${delay}ms` }
  return (
    <span className="x-home-flipboard-flap">
      <span className="x-home-flipboard-half x-home-flipboard-top"><span>{s.cur}</span></span>
      <span className="x-home-flipboard-half x-home-flipboard-bot"><span>{s.cur}</span></span>
      {s.n > 0 && <>
        <span key={`u${s.n}`} style={d} className="x-home-flipboard-half x-home-flipboard-bot x-home-flipboard-under"><span>{s.prev}</span></span>
        <span key={`f${s.n}`} style={d} className="x-home-flipboard-half x-home-flipboard-top x-home-flipboard-fall"><span>{s.prev}</span></span>
        <span key={`r${s.n}`} style={d} className="x-home-flipboard-half x-home-flipboard-bot x-home-flipboard-rise"><span>{s.cur}</span></span>
      </>}
    </span>
  )
}

/** The same clock as Home's countdown: to config.weddingStart, a tick a second, paused while the tab is hidden. */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let id = 0
    const start = () => { clearInterval(id); id = window.setInterval(() => setNow(new Date()), 1000) }
    const vis = () => (document.hidden ? clearInterval(id) : (setNow(new Date()), start()))
    start(); document.addEventListener("visibilitychange", vis)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis) }
  }, [])
  return now
}

/** On load the board shuffles: each digit spins through a few numbers, left ones settling first. */
function useShuffle(steps = 9) {
  const [step, setStep] = useState(() => (still() ? steps : 0))
  useEffect(() => {
    if (step >= steps) return
    const id = setTimeout(() => setStep((s) => s + 1), ms(step === 0 ? 450 : 110))
    return () => clearTimeout(id)
  }, [step, steps])
  return step
}

export default function HomeFlipboard() {
  const { t } = useLang()
  const { theme } = useTheme()
  const { household } = useHousehold()
  const now = useNow()
  const step = useShuffle()
  const left = Math.max(0, new Date(config.weddingStart).getTime() - now.getTime())
  const days = Math.floor(left / 86_400_000), hours = Math.floor((left % 86_400_000) / 3_600_000)
  const mins = Math.floor((left % 3_600_000) / 60_000), secs = Math.floor((left % 60_000) / 1000)
  const u = t.countdownMore.short
  const groups: [string, string][] = [[String(days).padStart(3, "0"), u.days], [String(hours).padStart(2, "0"), u.hours], [String(mins).padStart(2, "0"), u.mins], [String(secs).padStart(2, "0"), u.secs]]
  const names = household ? household.guests.map((g) => (g.plusOne && /^(guest|plus one|\+1)?$/i.test(g.firstName.trim()) ? t.home.yourPlusOne : g.firstName)).filter(Boolean) : []
  const dear = t.home.dearNames(names) || household?.displayName || ""
  let i = 0
  const total = groups.reduce((n, [v]) => n + v.length, 0)
  return (
    <div className="x-home-flipboard">
      <style>{css}</style>
      <Scene source={sceneFor(theme)} />
      <Letter>
        <header className="flex flex-col gap-4">
          <h1 className="names" aria-label={`${COUPLE.first} & ${COUPLE.second}`}>
            <span aria-hidden>{COUPLE.first} <span className="text-primary">&amp;</span><br />{COUPLE.second}</span>
          </h1>
          <p className="date-badge">{t.home.dateLine}</p>
        </header>
        <p className="x-home-flipboard-dear"><span className="text-foreground">{t.home.dear(dear)}</span> {t.home.greetingLine}</p>
        <section aria-label={t.countdownMore.until} className="flex flex-col gap-3">
          <p className="sr-only">{sentence(partsAt(now))}</p>
          <div aria-hidden className="x-home-flipboard-board">
            {groups.map(([v, unit]) => (
              <div key={unit} className="x-home-flipboard-group">
                <div className="x-home-flipboard-digits">
                  {[...v].map((c, k) => {
                    const at = i++
                    // While shuffling, a digit shows a passing number until its turn to settle (left first)
                    const shown = step * 1.4 > at + 2 ? c : String((Number(c) + step + at * 3) % 10)
                    return <Flap key={k} ch={shown} delay={(total - at) * 22} />
                  })}
                </div>
                <span className="x-home-flipboard-unit">{unit}</span>
              </div>
            ))}
          </div>
          <p aria-hidden className="x-home-flipboard-caption">{t.countdownMore.until}</p>
        </section>
        <SignOff />
      </Letter>
    </div>
  )
}
