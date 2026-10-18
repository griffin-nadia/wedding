import { useEffect, useState } from "react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"
import { Stage } from "../../stage"
import { ms, still, tween } from "../../motion"
import { useKnob, useTake } from "../../params"
import { art } from "../opening/art"

/**
 * A loading screen that preloads (lab run 19, Jehan's extra). It only shows if the arrival really is slow: nothing
 * for the first 350 ms, so a fast or cached visit never sees it and never waits for it (it doesn't hold anything
 * back: the envelope shows the moment its art is in). While it shows, it loads exactly what the arrival needs, in
 * the order it's needed: the closed envelope, the open envelope's two layers, the names masks, the wax seal, the
 * first scene photo and the fonts. Then, once the envelope is up and the phone is idle, it warms the later stops
 * quietly: the globe's Three.js and its land, the live paper, and the song only on wifi or 4G without Save-Data.
 * - seal: Nadia's wax seal fills with its red from the bottom as things arrive (a counter-moving transform reveal)
 * - envelope: her closed envelope draws in the same way, with a hairline under it that grows with the progress
 * - leaf: her gum leaf drifts down, side to side, with the words and the hairline
 * role="status" with words ("Opening your invite", then "Ready"); it never takes focus. Reduced motion: a still
 * picture and the words, the hairline stepping. "Pretend it's slow" holds it on screen to look at (the real load
 * on a laptop takes a few ms); the measured numbers on a throttled phone are in the badge and docs/lab.md.
 */
const P = "x-ld"
const css = `
.${P}-room { position: relative; width: 100%; flex: 1; display: grid; place-items: center; }
.${P}-veil { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; align-content: center; gap: var(--space-4); background: var(--surface-paper); transition: opacity 300ms var(--ease-paper); }
.${P}-veil[data-gone] { opacity: 0; pointer-events: none; }
.${P}-words { font: 400 var(--type-body-size) / 1.3 var(--font-display); color: var(--ink-soft); }
.${P}-line { width: 160px; height: 1px; background: var(--line-hairline); overflow: hidden; }
.${P}-line i { display: block; height: 100%; background: var(--ink-soft); transform-origin: left; transform: scaleX(var(--p)); transition: transform 240ms var(--ease-paper); }
/* The reveal: an outer box slides down out of view while the picture inside slides back up, so the picture stays
   still and only the window onto it grows from the bottom. Transforms only */
.${P}-fill { position: relative; overflow: hidden; }
.${P}-fill > .ghost { display: block; opacity: .22; filter: grayscale(1); }
.${P}-win { position: absolute; inset: 0; overflow: hidden; transform: translateY(calc((1 - var(--p)) * 100%)); transition: transform 360ms var(--ease-paper); }
.${P}-win > img { display: block; width: 100%; transform: translateY(calc((var(--p) - 1) * 100%)); transition: transform 360ms var(--ease-paper); }
.${P}-seal { width: 96px; } .${P}-seal img { width: 96px; }
.${P}-env { width: 180px; } .${P}-env img { width: 180px; }
.${P}-leaf { width: 72px; animation: x-ld-fall 3.2s ease-in-out infinite; }
@keyframes x-ld-fall { 0% { transform: translate(-18px, -26px) rotate(-14deg); } 50% { transform: translate(18px, 6px) rotate(12deg); } 100% { transform: translate(-18px, -26px) rotate(-14deg); } }
.${P}-env-site { width: min(66vw, 260px); filter: drop-shadow(0 18px 22px rgb(var(--tint-shadow) / .3)); }
.${P}-log { width: min(100%, 420px); padding: var(--space-2) var(--space-3); border-radius: var(--radius-control); background: color-mix(in oklab, var(--letter-bg) 92%, transparent); font: 500 var(--type-small-size) / 1.5 var(--font-label); color: var(--ink-soft); }
.${P}-log li { display: flex; justify-content: space-between; gap: var(--space-3); border-bottom: 1px solid var(--line-hairline); padding-block: 2px; }
@media (prefers-reduced-motion: reduce) { .${P}-leaf { animation: none; } .${P}-win, .${P}-win > img, .${P}-line i { transition: none; } }
`
const base = import.meta.env.BASE_URL
const dpr = () => (typeof devicePixelRatio === "number" ? devicePixelRatio : 1)
/** What the arrival paints first, in order (the same files the site asks for at a phone's density) */
function arrivalAssets() {
  const w = dpr() > 1 ? 820 : 410, m = dpr() > 1 ? 1040 : 520
  const scene = (window as Window & { __ngScene?: { n: string; b: string } }).__ngScene
  return [
    `${base}${ART.drawnEnvelope.closed}-${w}.avif`, `${base}${ART.drawnEnvelope.open}-${w}.avif`, `${base}${ART.drawnEnvelope.openFront}-${w}.avif`,
    `${base}${ART.names.mask}-${m}.webp`, `${base}${ART.names.amp}-${m}.webp`, `${base}${ART.seal.src}-128.avif`,
    scene ? `${scene.b}${innerWidth * dpr() > 1200 ? 1600 : 1200}.avif` : `${base}scenes/kyoto-view-1200.avif`,
  ]
}
type Log = { label: string; at: number }[]

export default function LoadingPreload() {
  const take = useTake("seal")
  const hold = useKnob("hold", 2.5)
  const { t } = useLang()
  const [p, setP] = useState(0)
  // While pretending, the shown progress follows the held time too, so the fill can be watched
  const [ramp, setRamp] = useState(1)
  useEffect(() => { if (hold <= 0) return; setRamp(0); return tween(hold * 1000, (v) => setRamp(v), (x) => x) }, [hold])
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)
  const [log, setLog] = useState<Log>([])
  useEffect(() => {
    const t0 = performance.now(), note = (label: string) => { if (alive) setLog((l) => [...l, { label, at: Math.round(performance.now() - t0) }]) }
    setLog([]); setShow(false); setDone(false); setP(0)
    let alive = true
    // Only after 350 ms: a quick visit never sees it
    const showAt = setTimeout(() => { if (alive) { setShow(true); note("Loading screen shown (still loading at 350 ms)") } }, 350)
    const list = arrivalAssets()
    let n = 0
    const one = (u: string) => fetch(u, { priority: "high" } as RequestInit).then((r) => r.blob()).catch(() => null).finally(() => { n++; if (alive) setP(n / (list.length + 1)) })
    const fonts = document.fonts.ready.then(() => { n++; if (alive) setP(n / (list.length + 1)) })
    // "Pretend it's slow": hold the screen up so it can be looked at (zero adds nothing)
    const pretend = new Promise((r) => setTimeout(r, ms(hold * 1000)))
    void Promise.all([...list.map(one), fonts]).then(async () => {
      note(`Arrival art in (${list.length} files and the fonts)`)
      await pretend
      if (!alive) return
      clearTimeout(showAt); setP(1); setDone(true); note("Envelope up")
      // Then the later stops, quietly, when the phone is idle
      const idle = (cb: () => void) => ((window as Window & { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200)))(cb)
      idle(() => {
        void Promise.all([import("three"), import("world-atlas/land-110m.json"), import("@/lib/paper-live")]).then(() => alive && note("Warm: the globe (Three.js, its land) and the paper"))
        const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
        if (!c || (!c.saveData && c.effectiveType === "4g")) void fetch(`${base}${ART.music.src}`, { priority: "low" } as RequestInit).then((r) => r.blob()).then(() => alive && note("Warm: the song (fast connection, no Save-Data)"))
        else note("Song left for later (slow connection or Save-Data)")
      })
    })
    return () => { alive = false; clearTimeout(showAt) }
  }, [hold])
  const words = done ? "Ready" : "Opening your invite"
  const reveal = (src: string, cls: string) => (
    <span className={`${P}-fill ${cls}`} aria-hidden>
      <img className="ghost" src={src} alt="" />
      <span className={`${P}-win`}><img src={src} alt="" /></span>
    </span>
  )
  return (
    <Stage photo hint="A cold first visit. It only appears if loading takes over 350 ms. Replay is in Options.">
      <style>{css}</style>
      <div className={`${P}-room`} style={{ ["--p" as string]: done ? 1 : still() ? Math.round(Math.min(p, ramp) * 4) / 4 : Math.min(p, ramp) }}>
        <img className={`${P}-env-site`} src={art("closed")} alt="" />
        {show && (
          <div className={`${P}-veil`} data-gone={done || undefined} role="status" aria-live="polite">
            {take === "seal" && reveal(`${base}${ART.seal.src}-256.webp`, `${P}-seal`)}
            {take === "envelope" && reveal(art("closed", 410), `${P}-env`)}
            {take === "leaf" && <img aria-hidden className={`${P}-leaf`} src={`${base}${ART.leaves.src}-160.webp`} alt="" />}
            <p className={`${P}-words`}>{words}</p>
            {take !== "seal" && <span aria-hidden className={`${P}-line`}><i /></span>}
          </div>
        )}
      </div>
      <ol className={`${P}-log`} aria-label="What loaded when">
        {log.map((l) => <li key={l.label}><span>{l.label}</span><span className="numerals">{l.at} ms</span></li>)}
      </ol>
      <p className="sr-only">{t.letter.note}</p>
    </Stage>
  )
}
