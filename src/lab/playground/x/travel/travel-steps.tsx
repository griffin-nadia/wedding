import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Letter } from "@/components/letter/letter"
import { Scene } from "@/components/letter/scene"
import { useLang } from "@/lib/lang"
import { sceneFor } from "@/lib/scenes"
import { useTheme } from "@/lib/theme"
import { spring } from "../../motion"

/**
 * Travel as four steps in the order a guest needs them: Fly, Train, Stay, Day. A stepper across the top (APG tabs:
 * arrow keys, Home, End) with a marker that springs from step to step; under it one card per step, built from the
 * copy, on a track that follows your finger when you swipe and springs to the next card when you let go. Next and
 * Back too. Seen steps get a tick, and where you got to is kept for the visit (sessionStorage). Reduced motion: the
 * card and marker jump.
 */
const css = `
.x-travel-steps { position: relative; min-height: 100svh; padding: 16px 12px 24px; }
@media (min-width: 768px) { .x-travel-steps { padding: var(--letter-top) 24px var(--space-8); } }
@media (min-width: 1024px) { .x-travel-steps { padding-left: var(--letter-left); } }
.x-travel-steps .letter { min-height: 0; }
.x-travel-steps-tabs { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); padding: 4px; border-radius: var(--radius-pill); background: var(--surface-alt); box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.08); }
.x-travel-steps-marker { position: absolute; top: 4px; bottom: 4px; left: 0; border-radius: var(--radius-pill); background: var(--letter-bg); box-shadow: 0 1px 2px rgb(0 0 0 / 0.12), 0 4px 12px -4px rgb(0 0 0 / 0.2); will-change: transform, width; }
.x-travel-steps-tab { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; border-radius: var(--radius-pill);
  font: 500 var(--type-small-size) / 1 var(--font-label); color: var(--ink-soft); outline: 2px solid transparent; outline-offset: -2px; -webkit-tap-highlight-color: transparent; transition: color 200ms; }
.x-travel-steps-tab[aria-selected="true"] { color: var(--ink); }
.x-travel-steps-tab:focus-visible { outline-color: var(--input-focus); }
.x-travel-steps-num { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; font-size: 11px; background: color-mix(in oklab, var(--ink) 8%, transparent); }
.x-travel-steps-tab[data-seen] .x-travel-steps-num { background: var(--ink-moss); color: var(--letter-bg); }
.x-travel-steps-bar { height: 2px; border-radius: 2px; background: var(--line-hairline); overflow: hidden; }
.x-travel-steps-bar > span { display: block; height: 100%; background: var(--leaf, var(--ink-moss)); transform-origin: left; }
.x-travel-steps-view { overflow: hidden; margin-inline: calc(var(--letter-pad, 24px) * -1); padding-inline: var(--letter-pad, 24px); padding-block: 4px 12px; touch-action: pan-y; transition: height 420ms var(--ease-paper); box-sizing: content-box; }
@media (prefers-reduced-motion: reduce) { .x-travel-steps-view { transition: none; } }
.x-travel-steps-track { display: flex; align-items: flex-start; gap: var(--space-5); will-change: transform; }
.x-travel-steps-card { flex: 0 0 100%; display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-5); border-radius: var(--radius-section); outline: none;
  background: radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, var(--brand-mitsu) 14%, transparent), transparent 60%), color-mix(in oklab, var(--letter-bg) 55%, var(--surface-raised));
  box-shadow: 0 1px 1px rgb(0 0 0 / 0.06), 0 2px 8px -3px rgb(0 0 0 / 0.16), inset 0 0 0 1px var(--line-hairline); user-select: none; -webkit-user-select: none; }
.x-travel-steps-card { transition: opacity 300ms var(--ease-paper); }
.x-travel-steps-card[inert] { opacity: 0.5; }
.x-travel-steps-card:focus-visible { box-shadow: 0 0 0 3px var(--input-focus); }
.x-travel-steps-card h2 { font-family: var(--font-display); font-size: var(--type-heading-size); line-height: var(--type-heading-leading); color: var(--ink); }
.x-travel-steps-card h3 { font-weight: 500; color: var(--ink); padding-top: var(--space-2); }
.x-travel-steps-link { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; align-self: flex-start; }
.x-travel-steps-nav { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
`

type Step = { key: string; label: string; body: React.ReactNode }
const KEY = "x-travel-steps"
const read = () => { try { const v = JSON.parse(sessionStorage.getItem(KEY) || "{}"); return { at: Number(v.at) || 0, seen: (v.seen as number[]) ?? [0] } } catch { return { at: 0, seen: [0] } } }

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="btn-text x-travel-steps-link" draggable={false}>{children}<ArrowUpRight className="size-4" aria-hidden /></a>
}

export default function TravelSteps() {
  const { t } = useLang()
  const { theme } = useTheme()
  const g = t.getting
  const steps: Step[] = [
    { key: "fly", label: "Fly", body: <>
      <h2>{g.rows.flights}</h2><p>{t.travel.items[1].body}</p><p>{g.flyingBody}</p>
      <div className="flex flex-wrap gap-x-4"><Ext href={g.links.haruka.href}>{g.links.haruka.label}</Ext><Ext href={g.links.flights.href}>{g.links.flights.label}</Ext></div>
    </> },
    { key: "train", label: "Train", body: <>
      <h2>{g.tokyoTitle}</h2><p>{g.tokyoBody}</p><Ext href={g.links.trains.href}>{g.links.trains.label}</Ext>
      <h3>{g.earlyTitle}</h3><p>{g.earlyBody}</p>
    </> },
    { key: "stay", label: "Stay", body: <>
      <h2>{t.stay.title}</h2><p>{t.stay.intro}</p>
      {t.day.stay.map((a) => <div key={a.label} className="flex flex-col gap-1"><h3>{a.label}</h3><p>{t.day.stayGood}: {a.good}</p><p className="text-muted-foreground">{t.day.stayWatch}: {a.watch}</p></div>)}
    </> },
    { key: "day", label: "Day", body: <>
      <h2>{g.onTheDayTitle}</h2>
      <h3>{g.shuttleTitle}</h3><p>{g.shuttleBody}</p><p className="text-small text-muted-foreground">{t.driver.fare}</p>
      <h3>{g.walkingTitle}</h3><p>{g.walkingBody}</p><Ext href={g.links.walk.href}>{g.links.walk.label}</Ext>
    </> },
  ]
  const last = steps.length - 1
  const [{ at, seen }, setProgress] = useState(read)
  const [pos, setPos] = useState(at) // the float the spring drives: marker and track both follow it
  const posRef = useRef(at)
  const stop = useRef<() => void>(() => {})
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const view = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLElement | null)[]>([])
  const [height, setHeight] = useState<number>()
  const [boxes, setBoxes] = useState<{ x: number; w: number }[]>([])
  const drag = useRef<{ x: number; y: number; from: number; on: boolean; v: number; lx: number; lt: number } | null>(null)

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify({ at, seen })) } catch { /* private mode */ } }, [at, seen])
  useEffect(() => () => stop.current(), [])
  // Where each tab sits, for the marker (and again when the letter resizes)
  useLayoutEffect(() => {
    const measure = () => setBoxes(tabs.current.map((b) => ({ x: b?.offsetLeft ?? 0, w: b?.offsetWidth ?? 0 })))
    measure()
    const ro = new ResizeObserver(measure)
    if (tabs.current[0]?.parentElement) ro.observe(tabs.current[0].parentElement)
    return () => ro.disconnect()
  }, [])

  // The window takes the height of the card it shows, so a short step doesn't sit in a tall box
  useLayoutEffect(() => {
    const el = cards.current[at]
    if (!el) return
    const fit = () => setHeight(el.offsetHeight)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [at])

  const show = (p: number) => { posRef.current = p; setPos(p) }
  const go = (i: number, v = 0) => {
    const to = Math.max(0, Math.min(last, i))
    setProgress((s) => ({ at: to, seen: s.seen.includes(to) ? s.seen : [...s.seen, to] }))
    stop.current()
    stop.current = spring(posRef.current, to, (p) => show(p), { k: 210, c: 26, v })
  }
  const keys = (e: React.KeyboardEvent, i: number) => {
    const to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null
    if (to === null) return
    e.preventDefault()
    const j = (to + steps.length) % steps.length
    tabs.current[j]?.focus(); go(j)
  }
  // Swipe: the track follows the finger once the gesture is clearly sideways, then springs to the nearest card
  const down = (e: React.PointerEvent) => { if (e.button === 0) drag.current = { x: e.clientX, y: e.clientY, from: posRef.current, on: false, v: 0, lx: e.clientX, lt: e.timeStamp } }
  const move = (e: React.PointerEvent) => {
    const d = drag.current, w = view.current?.clientWidth ?? 1
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (!d.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) { if (Math.abs(dy) > 10) drag.current = null; return }
      d.on = true; stop.current(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    const dt = Math.max(1, e.timeStamp - d.lt)
    d.v = 0.7 * d.v + 0.3 * (-(e.clientX - d.lx) / w / (dt / 1000)); d.lx = e.clientX; d.lt = e.timeStamp
    let p = d.from - dx / w
    if (p < 0) p *= 0.3
    if (p > last) p = last + (p - last) * 0.3
    show(p)
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d?.on) return
    const flick = Math.abs(d.v) > 0.6 ? Math.sign(d.v) : 0
    go(flick ? Math.round(d.from) + flick : Math.round(posRef.current), d.v)
  }

  // The marker sits between the two tabs either side of pos
  const i0 = Math.max(0, Math.min(last, Math.floor(pos))), i1 = Math.min(last, i0 + 1), f = Math.max(0, Math.min(1, pos - i0))
  const b0 = boxes[i0], b1 = boxes[i1]
  const marker = b0 && b1 ? { transform: `translateX(${b0.x + (b1.x - b0.x) * f}px)`, width: b0.w + (b1.w - b0.w) * f } : { opacity: 0 }
  return (
    <div className="x-travel-steps">
      <style>{css}</style>
      <Scene source={sceneFor(theme)} />
      <Letter>
        <header className="flex flex-col gap-2">
          <h1 className="heading">{t.nav.travel}</h1>
          <p>{g.intro}</p>
        </header>
        <div className="flex flex-col gap-3">
          <div role="tablist" aria-label={g.rowsLabel} className="x-travel-steps-tabs">
            <span aria-hidden className="x-travel-steps-marker" style={marker} />
            {steps.map((s, i) => (
              <button key={s.key} ref={(el) => { tabs.current[i] = el }} type="button" role="tab" id={`x-travel-steps-tab-${s.key}`} aria-controls={`x-travel-steps-panel-${s.key}`}
                aria-selected={at === i} tabIndex={at === i ? 0 : -1} data-seen={seen.includes(i) && at !== i ? "" : undefined}
                className="x-travel-steps-tab" onClick={() => go(i)} onKeyDown={(e) => keys(e, i)}>
                <span aria-hidden className="x-travel-steps-num">{seen.includes(i) && at !== i ? <Check className="size-3" /> : i + 1}</span>{s.label}
              </button>
            ))}
          </div>
          <div aria-hidden className="x-travel-steps-bar"><span style={{ transform: `scaleX(${(pos + 1) / steps.length})` }} /></div>
        </div>
        <div ref={view} className="x-travel-steps-view" style={{ height }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <div className="x-travel-steps-track" style={{ transform: `translateX(calc(${-pos * 100}% - ${pos} * var(--space-5)))` }}>
            {steps.map((s, i) => (
              <section key={s.key} ref={(el) => { cards.current[i] = el }} role="tabpanel" id={`x-travel-steps-panel-${s.key}`} aria-labelledby={`x-travel-steps-tab-${s.key}`} tabIndex={at === i ? 0 : -1}
                inert={at !== i} className="x-travel-steps-card">{s.body}</section>
            ))}
          </div>
        </div>
        <div className="x-travel-steps-nav">
          <Button variant="secondary" size="md" disabled={at === 0} onClick={() => go(at - 1)}><ArrowLeft className="size-4" aria-hidden />{t.rsvp.back}</Button>
          <p className="text-small text-muted-foreground" aria-live="polite">{at + 1} / {steps.length}</p>
          <Button size="md" disabled={at === last} onClick={() => go(at + 1)}>{t.rsvp.next}<ArrowRight className="size-4" aria-hidden /></Button>
        </div>
      </Letter>
    </div>
  )
}
