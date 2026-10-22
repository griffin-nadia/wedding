import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from "react"
import { Pause, Play } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { loop } from "@/lib/frame"
import type { Chapter } from "@/lib/content"
import { PageHeader } from "@/components/ui/page-header"
import { NamesArt } from "@/components/names-art"
import { Hanko } from "@/components/hanko"
import { HomePage } from "@/pages/home"
import { getParam, setParam, useTake } from "../../params"
import { getSpeed, still } from "../../motion"
import { JourneyStop, KidPrints, Polaroid, StoryFlow, Words, flowCss, flowGo, useChapters, useMeta, type Stop } from "./flow"
import { STICKER_ALT, useStickers } from "./stickers"

/**
 * I. The polaroid strip (run 24 lab): every chapter's print in one slow strip that drifts along by itself, follows your
 * finger or mouse when you drag it and carries on with the flick, and lifts a print when you hover it (the Framer
 * polaroid footer's behaviour, our own build). Three places for it:
 * - story: under Our story's spread, the chapter you're on lifted out of the line; tap a print to go to that chapter
 * - home: along the foot of Home (the site's own shell and page), each print opening Our story at its chapter
 * - keepsake: the keepsake Home after the day (their names, Married, the thank-you), with Nadia's map pieces
 * Drifting stops while you hover, focus or drag it, with Pause for good (WCAG 2.2.2). Reduced motion: no drift and no
 * glide, dragging moves it directly.
 */
const P = "x-ps"

const css = `
.${P} { container-type: inline-size; width: 100%; display: flex; flex-direction: column; gap: var(--space-4); }
/* The strip: a band wider than the card, prints overlapping a little and each at its own tilt */
.${P}-strip { position: relative; display: flex; flex-direction: column; gap: var(--space-2); }
.${P}-view { position: relative; overflow: hidden; padding-block: 26px 14px; margin-inline: calc(var(--letter-pad, 24px) * -1); touch-action: pan-y; -webkit-user-select: none; user-select: none;
  -webkit-mask: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
@media (hover: hover) and (pointer: fine) { .${P}-view { cursor: grab; } .${P}-view[data-dragging] { cursor: grabbing; } }
.${P}-row { display: flex; width: max-content; padding-inline: 12px; will-change: transform; }
.${P}-print { position: relative; flex: none; margin-inline: calc(var(--sw) * -.06); padding: 0; border: 0; background: none; border-radius: 2px; outline: 2px solid transparent; outline-offset: 6px; }
.${P}-print:focus-visible { outline-color: var(--input-focus); z-index: 3; }
.${P}-print .x-pr { --pw: var(--sw); translate: 0 var(--y, 0px);
  transition: translate .35s cubic-bezier(.34, 1.5, .64, 1), scale .35s cubic-bezier(.34, 1.5, .64, 1), rotate .35s cubic-bezier(.34, 1.5, .64, 1), box-shadow .35s ease; }
.${P}-print img { -webkit-user-drag: none; pointer-events: none; }
@media (hover: hover) and (pointer: fine) {
  .${P}-print:hover { z-index: 2; }
  .${P}-print:hover .x-pr { translate: 0 -18px; scale: 1.04; rotate: calc(var(--tilt) * .3); transition-duration: .35s, .35s, .35s, .35s; box-shadow: 0 2px 3px rgb(var(--tint-shadow) / .2), 0 26px 36px -16px rgb(var(--tint-shadow) / .5); }
}
.${P}-print .x-pr { transition-duration: .4s; }
.${P}-print:active .x-pr { translate: 0 -10px; scale: 1.02; }
.${P}-print[aria-current="true"] .x-pr { translate: 0 -14px; rotate: calc(var(--tilt) * .4); box-shadow: 0 0 0 2px var(--action), 0 22px 30px -16px rgb(var(--tint-shadow) / .5); }
.${P}-bar { display: flex; align-items: center; justify-content: center; gap: var(--space-3); }
.${P}-bar .utility-btn { width: 44px; height: 44px; }
.${P}-label { font: 500 var(--type-small-size) / 1 var(--font-label); color: var(--ink-muted); }
@media (prefers-reduced-motion: reduce) { .${P}-print .x-pr { transition: none; } }

/* story: the chapter you're on, big, coming in turned and settling as it slides (from --d) */
.${P}-spread { display: grid; grid-template-rows: auto auto; justify-items: center; gap: var(--space-4); padding-top: var(--space-2);
  transform: translate3d(calc(var(--d) * 46%), 0, 0) rotate(calc(var(--d) * 7deg)); opacity: calc(1 - var(--a) * 1.4); }
.${P}-spread .x-pr { --pw: min(40cqw, 200px, 19svh); }
.${P}-spread .journey-globe { width: min(100%, 210px, 24svh); }
.${P}-spread .x-sf-map { width: min(80cqw, 260px); }
.${P}-spread .x-sf-words { text-align: center; align-items: center; }
.${P}-kids { position: relative; width: min(80cqw, 380px); height: min(34svh, 290px); }
.${P}-kids .x-kids { position: absolute; inset: 0; }
.${P}-kids .x-pr { --pw: min(36cqw, 150px, 18svh); }
.${P}-kids .x-kids-back { translate: -52% -18%; --tilt: -5deg; }
.${P}-kids .x-kids-g { translate: -30% 10%; --tilt: 4deg; }
.${P}-kids .x-kids-n { translate: 34% 4%; --tilt: -3deg; }
@media (min-width: 1024px) {
  .${P}-spread:not(.is-open) { grid-template-columns: auto minmax(0, 26em); grid-template-rows: none; align-items: center; gap: var(--space-7); }
  .${P}-spread:not(.is-open) .x-sf-words { text-align: left; align-items: flex-start; }
  .${P}-spread .x-pr { --pw: min(26cqw, 230px, 26svh); }
  .${P}-spread .journey-globe { width: min(100%, 250px, 30svh); }
}
@media (prefers-reduced-motion: reduce) { .${P}-spread { transform: none; } }
/* home: the strip along the card's foot */
.${P}-home { display: flex; flex-direction: column; gap: var(--letter-gap, var(--space-6)); }
.${P}-foot { position: sticky; z-index: 5; bottom: calc(var(--letter-pad, 24px) * -1); margin: var(--space-2) calc(var(--letter-pad, 24px) * -1) calc(var(--letter-pad, 24px) * -1); padding: var(--space-2) var(--letter-pad, 24px) var(--space-1);
  background: linear-gradient(transparent, var(--letter-bg) 22%); }
.${P}-foot .${P}-view { padding-top: 22px; }
.${P}-foot a { align-self: center; }
/* keepsake: their names, Married, the thank-you, the strip with Nadia's pieces stuck along it */
.${P}-keep { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); text-align: center; }
.${P}-keep .names-art-wrap { width: min(100%, 420px); }
.${P}-keep .hanko { --hanko-paper: var(--card); }
.${P}-badge { font: 500 var(--type-small-size) / 1.3 var(--font-label); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-story); }
.${P}-keep p.greet { max-width: 30em; }
.${P}-keep .${P}-strip { align-self: stretch; }
.${P}-stick { position: absolute; z-index: 4; height: var(--h); width: auto; rotate: var(--r); pointer-events: none;
  filter: drop-shadow(1.5px 0 0 #fffaf2) drop-shadow(-1.5px 0 0 #fffaf2) drop-shadow(0 1.5px 0 #fffaf2) drop-shadow(0 -1.5px 0 #fffaf2) drop-shadow(0 3px 3px rgb(0 0 0 / .25)); }
`

/** The strip itself. `prints`: the chapters with a photo, and the stop each one opens. */
function Strip({ prints, current, onPick, size = 108, label }: { prints: { c: Chapter; stop: number }[]; current?: number; onPick: (stop: number) => void; size?: number; label: string }) {
  const view = useRef<HTMLDivElement>(null), row = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const st = useRef({ x: 0, v: 0, set: 1, hold: 0, drag: null as null | { x0: number; xs: number; id: number; moved: boolean; t: number; last: number }, paused: false })
  st.current.paused = paused

  useEffect(() => {
    const r = row.current!, s = st.current
    const measure = () => { s.set = r.scrollWidth / 2 || 1 }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(r)
    let then = performance.now()
    const stop = loop((now) => {
      const dt = Math.min(0.05, (now - then) / 1000) * getSpeed(); then = now
      if (!s.drag) {
        // Drift (18 px/s) unless held, paused or reduced; the flick's speed eases back into the drift
        const drift = s.hold > 0 || s.paused || still() ? 0 : -18
        s.v += (drift - s.v) * Math.min(1, dt * 1.6)
        s.x += s.v * dt
      }
      s.x = ((s.x % s.set) + s.set) % s.set - s.set // always within one set, so the loop never shows a seam
      r.style.transform = `translate3d(${s.x.toFixed(2)}px, 0, 0)`
    })
    return () => { stop(); ro.disconnect() }
  }, [])

  // Dragging: follows the pointer, then carries on with the flick's speed
  useEffect(() => {
    const el = view.current!, s = st.current
    const down = (e: PointerEvent) => { if (e.button !== 0) return; s.drag = { x0: e.clientX, xs: s.x, id: e.pointerId, moved: false, t: e.timeStamp, last: e.clientX }; s.v = 0 }
    const move = (e: PointerEvent) => {
      const d = s.drag; if (!d || e.pointerId !== d.id) return
      const dx = e.clientX - d.x0
      if (!d.moved && Math.abs(dx) < 6) return
      if (!d.moved) { d.moved = true; el.setPointerCapture(e.pointerId); el.dataset.dragging = "" }
      const dt = Math.max(1, e.timeStamp - d.t)
      s.v = still() ? 0 : ((e.clientX - d.last) / dt) * 1000 * 0.9; d.t = e.timeStamp; d.last = e.clientX
      s.x = d.xs + dx
    }
    const up = (e: PointerEvent) => {
      const d = s.drag; if (!d || e.pointerId !== d.id) return
      s.drag = null; delete el.dataset.dragging
      if (d.moved) { const block = (ev: Event) => { ev.stopPropagation(); ev.preventDefault() }; el.addEventListener("click", block, { capture: true, once: true }); setTimeout(() => el.removeEventListener("click", block, true), 0) }
      s.v = Math.max(-1600, Math.min(1600, s.v))
    }
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up) }
  }, [])

  // A print that takes keyboard focus comes fully into view
  const focusIn = (e: FocusEvent) => {
    st.current.hold++
    const b = (e.target as HTMLElement).closest<HTMLElement>(`.${P}-print`), v = view.current
    if (!b || !v) return
    const vr = v.getBoundingClientRect(), br = b.getBoundingClientRect()
    if (br.left < vr.left + 24) st.current.x += vr.left + 24 - br.left
    else if (br.right > vr.right - 24) st.current.x -= br.right - (vr.right - 24)
  }
  const one = (copy: number) => prints.map(({ c, stop }, k) => (
    <button key={`${copy}-${c.key}`} type="button" className={`${P}-print`} tabIndex={copy ? -1 : undefined} aria-hidden={copy ? true : undefined}
      aria-current={current === stop ? "true" : undefined} aria-label={`${c.title}, ${c.year}`} onClick={() => onPick(stop)}
      style={{ "--sw": `${size}px`, "--y": `${[4, -6, 8, -2, 6, -8, 2][k % 7]}px` } as CSSProperties}>
      <Polaroid c={c} i={k} sizes={`${size * 2}px`} />
    </button>
  ))
  return (
    <div className={`${P}-strip`}>
      <div ref={view} className={`${P}-view`} role="group" aria-label={label}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") st.current.hold++ }} onPointerLeave={(e) => { if (e.pointerType === "mouse") st.current.hold = Math.max(0, st.current.hold - 1) }}
        onFocus={focusIn} onBlur={() => { st.current.hold = Math.max(0, st.current.hold - 1) }}>
        <div ref={row} className={`${P}-row`}>{one(0)}{one(1)}</div>
      </div>
      <div className={`${P}-bar`}>
        <button type="button" className="utility-btn" aria-pressed={paused} aria-label={paused ? "Let the prints drift" : "Stop the prints drifting"} onClick={() => setPaused(!paused)}>
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  )
}

/** Which stop of the flow each print opens: the opener is stop 0, chapter n is stop n + 1 */
function usePrints() {
  const chapters = useChapters()
  const last = chapters[chapters.length - 1]
  const body = last && !last.photo ? chapters.slice(0, -1) : chapters
  return body.map((c, n) => ({ c, stop: n + 1 })).filter((p) => p.c.photo)
}

/** Our story opened at a chapter from elsewhere (Home, the keepsake): the story take at ?at= */
const openStory = (stop: number) => { setParam("at", String(stop)); setParam("take", "story") }

function StoryTake() {
  const { t } = useLang()
  const chapters = useChapters()
  const meta = useMeta(chapters)
  const prints = usePrints()
  const [at, setAt] = useState(() => Number(getParam("at") ?? 0) || 0)
  const scene = (s: Stop, i: number, now: number) => (
    <div className={`${P}-spread${s.kind === "opener" ? " is-open" : s.kind === "journey" ? " is-map" : ""}`}>
      {s.kind === "opener" ? <div className={`${P}-kids`}><KidPrints /></div>
        : s.kind === "chapter" ? <><Polaroid c={s.c} i={s.n} sizes="(min-width: 1024px) 260px, 46vw" /><Words c={s.c} meta={meta(s.c)} /></>
        : <><JourneyStop active={now === i} />{s.c ? <Words c={s.c} meta={meta(s.c)} /> : <h2 className="font-display text-heading">{t.story.kyoto}</h2>}</>}
    </div>
  )
  return <>
    <PageHeader title={t.story.title} lettering="ourStory" />
    <StoryFlow reach={1} render={scene} start={at} onAt={setAt} />
    <Strip prints={prints} current={at} onPick={(n) => flowGo(n)} label={t.story.title} size={matchMedia("(min-width: 1024px)").matches ? 100 : 80} />
  </>
}

function HomeTake() {
  const { t } = useLang()
  const prints = usePrints()
  return (
    <div className={`${P}-home`}>
      <HomePage />
      <div className={`${P}-foot`}>
        <Strip prints={prints} onPick={openStory} size={matchMedia("(min-width: 1024px)").matches ? 96 : 72} label={t.nav.story} />
      </div>
    </div>
  )
}

function KeepsakeTake() {
  const { t } = useLang()
  const { household } = useHousehold()
  const prints = usePrints()
  const stickers = useStickers()
  const where: [keyof typeof stickers, CSSProperties][] = [
    ["pagoda", { left: "1%", top: "-6px", "--h": "92px", "--r": "-6deg" } as CSSProperties],
    ["tower", { right: "2%", top: "-2px", "--h": "80px", "--r": "7deg" } as CSSProperties],
    ["kiyomizu", { right: "8%", bottom: "50px", "--h": "40px", "--r": "-4deg" } as CSSProperties],
  ]
  return (
    <div className={`${P}-keep`}>
      <h1 className="sr-only">{t.meta.shortTitle}</h1>
      <NamesArt />
      <p className={`${P}-badge`}>{t.home.keepsake.badge}</p>
      {household && <p className="greet"><span className="text-foreground">{t.home.dear(household.displayName)}</span> {t.home.keepsake.greeting}</p>}
      <div className={`${P}-strip`} style={{ position: "relative" }}>
        <Strip prints={prints} onPick={openStory} size={112} label={t.nav.story} />
        {where.map(([k, style]) => stickers[k] && <img key={k} src={stickers[k]} alt={STICKER_ALT[k as "pagoda"]} className={`${P}-stick`} style={style} draggable={false} />)}
      </div>
      <Hanko size="sm" />
      <button type="button" className="btn-text min-h-11" onClick={() => openStory(0)}>{t.home.keepsake.story}</button>
    </div>
  )
}

export default function StoryStrip() {
  const take = useTake("story")
  return (
    <div className={P} data-take={take}>
      <style>{css}</style>
      {take !== "story" && <style>{flowCss}</style>}
      {take === "home" ? <HomeTake /> : take === "keepsake" ? <KeepsakeTake /> : <StoryTake />}
    </div>
  )
}
