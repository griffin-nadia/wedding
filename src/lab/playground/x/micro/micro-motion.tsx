import { useEffect, useRef, useState, type ReactNode } from "react"
import { Play, Volume2, VolumeX, Check } from "lucide-react"
import { FORTUNES } from "@/content/en"
import { SlipWords, fortuneIndex } from "@/components/fortune-card"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { ms, still } from "../../motion"
import { useTake } from "../../params"

/**
 * The small things, current against proposed, side by side (lab run 19). The site today mixes three curves
 * (--ease-paper, --ease-out, --ease-spring) at 150, 300 and 600 ms. Proposed: one easing family at three durations,
 * short for presses and markers, medium for things that settle, long for things that unfold:
 * - paper: the site's own --ease-paper for everything, in and out, at 120 / 240 / 480 ms
 * - spring: one spring (damping 0.78, a 2% overshoot) for everything, at 200 / 360 / 640 ms to rest, as CSS linear()
 * Seven: the button's press depth, the tab pill, an accordion opening, a tag ticked off, the fortune unfolding in
 * three like a real omikuji, the countdown's digits, the music toggle. Transforms and opacity only on the proposed
 * side (the accordion moves what's under it with a FLIP, not by animating height). Play runs both sides together;
 * each row has its own. Reduced motion: every change is instant, both sides.
 */
type Fam = { name: string; e: string; d: [number, number, number] }
/** A damped spring's step response as CSS linear(), settling within 0.1% at the end */
function springEase(zeta: number) {
  const w = Math.log(1000) / zeta, wd = w * Math.sqrt(1 - zeta * zeta)
  const pts = Array.from({ length: 41 }, (_, i) => { const t = i / 40; return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t)) })
  return `linear(${pts.map((p) => p.toFixed(4)).join(", ")})`
}
const PAPER = "cubic-bezier(0.22, 1, 0.36, 1)"
const FAMS: Record<string, Fam> = {
  paper: { name: "One curve (--ease-paper)", e: PAPER, d: [120, 240, 480] },
  spring: { name: "One spring (damping 0.78)", e: springEase(0.78), d: [200, 360, 640] },
}
const P = "x-mm"
const css = `
.${P} { width: 100%; display: flex; flex-direction: column; gap: var(--space-4); }
.${P}-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); }
.${P}-tokens { font: 500 var(--type-small-size) / 1.4 var(--font-label); color: var(--ink-soft); }
.${P}-row { display: grid; gap: var(--space-2); padding-block: var(--space-3); border-top: 1px solid var(--line-hairline); }
.${P}-row h3 { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); font: 500 var(--type-body-size) / 1.3 var(--font-label); color: var(--ink); }
.${P}-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.${P}-side { display: grid; justify-items: center; align-content: start; gap: var(--space-2); min-height: 96px; padding: var(--space-3) var(--space-2); border-radius: var(--radius-control); box-shadow: inset 0 0 0 1px var(--line-hairline); overflow: hidden; }
.${P}-side > small { justify-self: stretch; display: flex; justify-content: space-between; gap: var(--space-1); font: 500 11px / 1.3 var(--font-label); color: var(--ink-muted); }
.${P}-side > small b { color: var(--ink-soft); font-weight: 600; }
.${P}-play { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: var(--radius-pill); color: var(--ink); box-shadow: inset 0 0 0 1px var(--line-strong); outline: 2px solid transparent; outline-offset: 2px; }
.${P}-play:focus-visible { outline-color: var(--input-focus); }
/* Proposed: the site's own components with only their timing swapped */
.${P}-prop .btn-primary { transition-duration: var(--d1) !important; transition-timing-function: var(--e) !important; }
.${P}-prop .segmented-mark { transition-duration: var(--d2) !important; transition-timing-function: var(--e) !important; }
/* An accordion row */
.${P}-acc { width: 100%; font: 400 var(--type-small-size) / 1.4 var(--font-label); color: var(--ink-soft); text-align: left; }
.${P}-acc > div { padding: var(--space-2) 0; border-bottom: 1px solid var(--line-hairline); }
.${P}-acc .q { font-weight: 500; color: var(--ink); }
.${P}-acc .a { overflow: hidden; }
/* A tag ticked off */
.${P}-tag { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 12px 0 6px; border-radius: var(--radius-pill); box-shadow: inset 0 0 0 1px var(--line-strong); font: 500 var(--type-small-size) / 1 var(--font-label); color: var(--ink); }
.${P}-tag i { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--line-strong); }
.${P}-tag[data-on] { box-shadow: inset 0 0 0 1px var(--action); }
.${P}-tag[data-on] i { background: var(--action); color: var(--action-ink); box-shadow: none; }
.${P}-tag svg { width: 14px; height: 14px; }
/* The countdown's box */
.${P}-count { position: relative; display: grid; place-items: center; width: 56px; height: 56px; overflow: hidden; border-radius: var(--radius-control); background: var(--letter-bg); box-shadow: inset 0 0 0 1px var(--line-hairline), 0 1px 2px rgb(var(--tint-shadow) / .12); }
.${P}-count span { grid-area: 1 / 1; font: 400 var(--type-heading-size) / 1 var(--font-display); font-variant-numeric: lining-nums tabular-nums; color: var(--ink); }
/* The fortune, at half size */
.${P}-slipbox { zoom: .5; width: 300px; }
.${P}-fold { perspective: 900px; }
.${P}-fold .slip3 { position: relative; height: 140px; margin: 140px 0; transform-style: preserve-3d; }
.${P}-fold .pn { position: absolute; left: 0; right: 0; height: 140px; transform-style: preserve-3d; }
.${P}-fold .pn.t { bottom: 100%; transform-origin: 50% 100%; } .${P}-fold .pn.m { top: 0; } .${P}-fold .pn.b { top: 100%; transform-origin: 50% 0; }
.${P}-fold .fc { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.${P}-fold .fc .omikuji-slip { animation: none !important; position: absolute; left: 0; right: 0; height: 420px; max-width: none; margin: 0; border-radius: 0; box-shadow: none; }
.${P}-fold .t .fc .omikuji-slip { top: 0; } .${P}-fold .m .fc .omikuji-slip { top: -140px; } .${P}-fold .b .fc .omikuji-slip { top: -280px; }
.${P}-fold .bk { transform: rotateX(180deg); background: var(--brand-paper-bright); }
.${P}-music { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; color: var(--ink); box-shadow: inset 0 0 0 1px var(--line-hairline); }
.${P}-music svg { grid-area: 1 / 1; width: 22px; height: 22px; }
`
const anim = (el: Element | null | undefined, k: Keyframe[], d: number, e: string, delay = 0) =>
  still() || !el ? null : el.animate(k, { duration: d, easing: e, delay, fill: "both" })

type SideProps = { tick: number; f: Fam | null } // f null: the site as it is today
const CUR = { e: PAPER, fast: 150, base: 300 }

function Press({ tick, f }: SideProps) {
  const b = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!tick || !b.current) return
    b.current.dataset.force = "pressed"
    const id = setTimeout(() => { if (b.current) delete b.current.dataset.force }, ms(f ? f.d[0] + 90 : 240))
    return () => clearTimeout(id)
  }, [tick, f])
  const { t } = useLang()
  return <Button ref={b} tabIndex={-1}>{t.letter.note}</Button>
}
function Pill({ tick }: SideProps) {
  const { t } = useLang()
  const items = [{ value: "details", label: t.nav.home }, { value: "travel", label: t.nav.faqs }]
  return <Segmented label="Tab pill" size="sm" value={tick % 2 ? "travel" : "details"} onChange={() => {}} items={items as { value: string; label: string }[]} />
}
function Acc({ tick, f }: SideProps) {
  const box = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const first = useRef(true)
  useEffect(() => { if (tick) setOpen((o) => !o) }, [tick])
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const a = box.current?.querySelector<HTMLElement>(".a"), next = box.current?.querySelector<HTMLElement>(".next")
    if (!a || !next) return
    const h = a.scrollHeight
    if (!f) { anim(a, open ? [{ height: "0px" }, { height: `${h}px` }] : [{ height: `${h}px` }, { height: "0px" }], CUR.base, CUR.e); return } // the site: height
    // Proposed: the layout changes at once; the row under it is moved back and eased into place (FLIP), the answer fades in
    anim(next, [{ transform: `translateY(${open ? -h : h}px)` }, { transform: "none" }], f.d[1], f.e)
    if (open) anim(a, [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], f.d[1], f.e)
  }, [open, f])
  const { t } = useLang()
  return (
    <div ref={box} className={`${P}-acc`}>
      <div><p className="q">{t.nav.travel}</p><div className="a" style={{ height: open ? "auto" : 0 }}><p>{t.letter.phoneBody}</p></div></div>
      <div className="next"><p className="q">{t.nav.faqs}</p></div>
    </div>
  )
}
function Tag({ tick, f }: SideProps) {
  const on = tick % 2 === 1
  const box = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!tick || !on) return
    const i = box.current?.querySelector("svg")
    if (!f) { anim(i, [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "none" }], CUR.fast, CUR.e); return }
    anim(i, [{ opacity: 0, transform: "scale(.4) rotate(-20deg)" }, { opacity: 1, transform: "none" }], f.d[0], f.e)
    anim(box.current, [{ transform: "scale(1)" }, { transform: "scale(1.05)", offset: 0.4 }, { transform: "scale(1)" }], f.d[1], f.e)
  }, [tick, on, f])
  const { t } = useLang()
  return <span ref={box} className={`${P}-tag`} data-on={on || undefined}><i>{on && <Check aria-hidden strokeWidth={3} />}</i>{t.home.pills.replied}</span>
}
function Count({ tick, f }: SideProps) {
  const box = useRef<HTMLSpanElement>(null)
  const n = 41 - (tick % 10), prev = n + 1
  useEffect(() => {
    if (!tick) return
    const [old, now] = [box.current?.children[0], box.current?.children[1]]
    if (!f) { anim(now, [{ transform: "translateY(-45%)", opacity: 0 }, { transform: "none", opacity: 1 }], CUR.base, CUR.e); anim(old, [{ opacity: 0 }, { opacity: 0 }], 1, "linear"); return }
    anim(old, [{ transform: "none", opacity: 1 }, { transform: "translateY(-60%)", opacity: 0 }], f.d[0], f.e)
    anim(now, [{ transform: "translateY(60%)", opacity: 0 }, { transform: "none", opacity: 1 }], f.d[1], f.e)
  }, [tick, f])
  return <span ref={box} className={`${P}-count`} aria-hidden><span key={`o${tick}`} style={{ opacity: tick ? undefined : 0 }}>{prev}</span><span key={`n${tick}`}>{n}</span></span>
}
function Music({ tick, f }: SideProps) {
  const on = tick % 2 === 1
  const box = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!tick || !f) return // the site swaps the icon at once
    anim(box.current?.querySelector("svg"), [{ opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: "none" }], f.d[0], f.e)
    anim(box.current, [{ boxShadow: "0 0 0 0 color-mix(in oklab, var(--action) 45%, transparent)" }, { boxShadow: "0 0 0 8px color-mix(in oklab, var(--action) 0%, transparent)" }], f.d[2], f.e)
  }, [tick, on, f])
  return <span ref={box} className={`${P}-music`} aria-hidden>{on ? <Volume2 key="on" /> : <VolumeX key="off" />}</span>
}
function Fortune({ tick, f }: SideProps) {
  const { household } = useHousehold()
  const i = fortuneIndex(household?.token ?? "sample", FORTUNES.length)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!tick) return
    if (!f) { anim(box.current?.querySelector(".omikuji-slip"), [{ opacity: 0, transform: "scaleY(.2)", transformOrigin: "top" }, { opacity: 1, transform: "none", transformOrigin: "top" }], CUR.base, CUR.e); return }
    // Proposed: folded in three, the top third opens toward you, then the bottom, each on its crease
    const top = box.current?.querySelector(".pn.t"), bot = box.current?.querySelector(".pn.b")
    anim(top, [{ transform: "rotateX(-180deg)" }, { transform: "none" }], f.d[2], f.e)
    anim(bot, [{ transform: "rotateX(180deg)" }, { transform: "none" }], f.d[2], f.e, f.d[2] * 0.6)
  }, [tick, f])
  const slip = <div className="omikuji-slip paper-feel"><SlipWords i={i} of={FORTUNES.length} text={FORTUNES[i]} /></div>
  if (!f) return <div ref={box} className={`${P}-slipbox`} key={tick}>{slip}</div>
  return (
    <div ref={box} className={`${P}-slipbox ${P}-fold`} key={tick}>
      <div className="slip3">
        <div className="pn m"><div className="fc">{slip}</div></div>
        <div className="pn b" style={{ zIndex: 2 }}><div className="fc">{slip}</div><div className="fc bk" /></div>
        <div className="pn t" style={{ zIndex: 3 }}><div className="fc">{slip}</div><div className="fc bk" /></div>
      </div>
    </div>
  )
}

const ROWS: { id: string; title: string; cur: string; prop: (f: Fam) => string; C: (p: SideProps) => ReactNode }[] = [
  { id: "press", title: "Button press depth", cur: "150 ms, paper", prop: (f) => `${f.d[0]} ms (short)`, C: Press },
  { id: "pill", title: "Tab pill", cur: "150 ms, paper", prop: (f) => `${f.d[1]} ms (medium)`, C: Pill },
  { id: "acc", title: "Accordion open", cur: "300 ms, height", prop: (f) => `${f.d[1]} ms, FLIP`, C: Acc },
  { id: "tag", title: "Tag ticked off", cur: "150 ms tick", prop: (f) => `${f.d[0]} + ${f.d[1]} ms`, C: Tag },
  { id: "fortune", title: "Fortune unfolding", cur: "300 ms, scaleY", prop: (f) => `${f.d[2]} ms per fold`, C: Fortune },
  { id: "count", title: "Countdown digits", cur: "300 ms, in only", prop: (f) => `${f.d[0]} out, ${f.d[1]} in`, C: Count },
  { id: "music", title: "Music toggle", cur: "instant", prop: (f) => `${f.d[0]} ms + ${f.d[2]} ms ring`, C: Music },
]

export default function MicroMotion() {
  const fam = FAMS[useTake("paper")] ?? FAMS.paper
  const [ticks, setTicks] = useState<Record<string, number>>({})
  const play = (id?: string) => setTicks((t) => Object.fromEntries(ROWS.map((r) => [r.id, (t[r.id] ?? 0) + (!id || id === r.id ? 1 : 0)])))
  // Once on arrival, so there's something to see
  useEffect(() => { const id = setTimeout(() => play(), ms(600)); return () => clearTimeout(id) }, [])
  const vars = { ["--e" as string]: fam.e, ["--d1" as string]: `${fam.d[0]}ms`, ["--d2" as string]: `${fam.d[1]}ms`, ["--d3" as string]: `${fam.d[2]}ms` }
  return (
    <div className={P}>
      <style>{css}</style>
      <div className={`${P}-head`}>
        <p className={`${P}-tokens`}>Proposed: <b>{fam.name}</b>, {fam.d.join(" / ")} ms. Today: three curves at 150 / 300 / 600 ms.</p>
        <Button variant="secondary" size="sm" onClick={() => play()}><Play aria-hidden />Play all</Button>
      </div>
      {ROWS.map((r) => (
        <section key={r.id} className={`${P}-row`} aria-labelledby={`${P}-${r.id}`}>
          <h3 id={`${P}-${r.id}`}>{r.title}<button type="button" className={`${P}-play`} onClick={() => play(r.id)} aria-label={`Play ${r.title}`}><Play className="size-4" aria-hidden /></button></h3>
          <div className={`${P}-pair`}>
            <div className={`${P}-side`}><small><b>Current</b>{r.cur}</small><r.C tick={ticks[r.id] ?? 0} f={null} /></div>
            <div className={`${P}-side ${P}-prop`} style={vars}><small><b>Proposed</b>{r.prop(fam)}</small><r.C tick={ticks[r.id] ?? 0} f={fam} /></div>
          </div>
        </section>
      ))}
    </div>
  )
}
