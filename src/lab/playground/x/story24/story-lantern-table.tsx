import { useCallback, useEffect, useRef, useState } from "react"
import { useLang } from "@/lib/lang"
import { Controls, EndWords, JourneyStop, KIDS, KIT_CSS, KidPrints, ListView, Polaroid, ReadOn, TILTS, arrowKeys, caption, chapterPic, rnd, useAnnounce, useChapters, useMeta, useStops, useSwipe } from "./kit"

/**
 * D. The lantern table: every print of the story scattered on a walnut table, under a warm pool of lantern light (the
 * honey and nectar tokens, nothing new). The chapter you're on is picked up into the light, bigger, its shadow
 * spreading; moving on puts it back where it lay and picks up the next. Turn the one you're holding over (tap it, or
 * Turn it over) to read their words on the back, in a written-feel hand with the year and place; Escape turns it
 * back. The other prints can be pushed around the table with a finger or the mouse, and tapping one picks it up.
 * At the journey stop the prints are pushed to the edges and the map lies in the light. Swipes on the table, the
 * arrows, dots, the arrow keys and See as a list as on the live page. Reduced motion: prints fade in place instead of
 * moving; the turn over is a cross-fade.
 */
const P = "x-lt"
const css = `
.${P} { --wood-ink: var(--brand-kinari); padding: 0; justify-content: space-between; color: var(--wood-ink);
  background:
    radial-gradient(ellipse 62% 48% at 50% 40%, color-mix(in oklab, var(--brand-mitsu) 42%, transparent), color-mix(in oklab, var(--brand-hachimitsu) 16%, transparent) 55%, transparent 78%),
    radial-gradient(ellipse 120% 90% at 50% 40%, transparent 50%, rgb(14 6 2 / .55)),
    repeating-linear-gradient(178.6deg, transparent 0 5px, rgb(20 8 2 / .12) 5px 6px, transparent 6px 17px, rgb(255 230 200 / .035) 17px 19px, transparent 19px 31px),
    repeating-linear-gradient(181.2deg, transparent 0 57px, rgb(20 8 2 / .16) 57px 60px, transparent 60px 140px),
    linear-gradient(176deg, color-mix(in oklab, var(--brand-kuri) 62%, var(--brand-kogecha)), color-mix(in oklab, var(--brand-kuri) 45%, var(--brand-kogecha)) 55%, color-mix(in oklab, var(--brand-kuri) 55%, var(--brand-kogecha)));
}
[data-theme="lantern"] .${P} {
  background:
    radial-gradient(ellipse 56% 44% at 50% 40%, color-mix(in oklab, var(--brand-hachimitsu) 34%, transparent), color-mix(in oklab, var(--brand-kabocha) 12%, transparent) 55%, transparent 78%),
    radial-gradient(ellipse 110% 85% at 50% 40%, transparent 42%, rgb(6 2 0 / .72)),
    repeating-linear-gradient(178.6deg, transparent 0 5px, rgb(10 4 0 / .16) 5px 6px, transparent 6px 17px, rgb(255 230 200 / .025) 17px 19px, transparent 19px 31px),
    repeating-linear-gradient(181.2deg, transparent 0 57px, rgb(10 4 0 / .2) 57px 60px, transparent 60px 140px),
    linear-gradient(176deg, var(--brand-yoru-raised), var(--brand-yoru) 60%, var(--brand-ink-deep));
}
.${P} .x-s24-h1 { position: relative; z-index: 70; color: var(--wood-ink); padding-top: var(--space-4); text-shadow: 0 1px 2px rgb(0 0 0 / .4); }
.${P}-table { --held: 214px; position: relative; flex: 1; width: 100%; min-height: 360px; touch-action: pan-y; outline: none; }
@media (min-width: 1024px) { .${P}-table { --held: min(300px, calc((100svh - 330px) / 1.5)); } }
.${P}-print { position: absolute; left: 50%; top: 46%; width: var(--held); margin-left: calc(var(--held) / -2); margin-top: calc(var(--held) * -.74);
  transition: transform 760ms var(--ease-paper), opacity 400ms var(--ease-paper); transform-style: preserve-3d; cursor: grab; touch-action: none; -webkit-tap-highlight-color: transparent; }
.${P}-print[data-dragging] { transition: none; cursor: grabbing; }
.${P}-print[data-held] { cursor: pointer; z-index: 50; }
.${P}-card { position: relative; display: block; transform-style: preserve-3d; transition: transform 700ms var(--ease-paper-in-out); }
.${P}-print[data-flipped] .${P}-card { transform: rotateY(180deg); }
.${P}-face { display: block; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.${P}-print .x-s24-pol { --pw: var(--held); rotate: 0deg; }
/* The lift: a second, wide soft shadow that spreads in as the print comes up into the light */
.${P}-lift { position: absolute; inset: 6% 4% -4%; z-index: -1; border-radius: 6px; background: rgb(10 4 0 / .55); filter: blur(18px); opacity: 0; transition: opacity 600ms var(--ease-paper); }
.${P}-print[data-held] .${P}-lift { opacity: 1; }
.${P}-back { position: absolute; inset: 0; transform: rotateY(180deg); display: flex; flex-direction: column; gap: 8px; padding: 9% 9% 7%; border-radius: 2px; overflow: hidden; color: var(--brand-kogecha);
  background: radial-gradient(rgb(66 26 5 / .06) .5px, transparent .6px) 0 0 / 3px 3px, linear-gradient(170deg, var(--brand-paper-bright), color-mix(in oklab, var(--brand-paper-bright) 86%, var(--brand-wara))); box-shadow: 0 0 0 .5px rgb(66 26 5 / .2); }
.${P}-back b { font: italic 400 calc(var(--held) * .1) / 1.1 var(--font-display); rotate: -1.5deg; }
.${P}-back p { margin: 0; font: italic 400 calc(var(--held) * .072) / 1.38 var(--font-display); display: -webkit-box; -webkit-line-clamp: 9; -webkit-box-orient: vertical; overflow: hidden; }
.${P}-back small { margin-top: auto; font: 500 12px / 1.2 var(--font-label); letter-spacing: .06em; color: var(--brand-nikkei); text-transform: uppercase; }
.${P}-back small, .${P}-back b { color: var(--brand-kogecha); }
.${P}-print:focus-visible { outline: none; }
.${P}-print:focus-visible .${P}-card { outline: 2px solid var(--brand-mitsu); outline-offset: 6px; }
.${P}-kids { display: block; width: var(--held); height: calc(var(--held) * 1.4); position: relative; }
.${P}-kids .x-s24-kids { --kw: calc(var(--held) * .55); position: absolute; left: 50%; top: 50%; translate: -50% -50%; }
.${P}-map { position: absolute; left: 50%; top: 44%; width: min(92%, 420px); translate: -50% -50%; padding: var(--space-4); border-radius: 4px; opacity: 0; pointer-events: none; transition: opacity 600ms var(--ease-paper) 300ms;
  background: var(--letter-bg); box-shadow: 0 30px 60px -20px rgb(0 0 0 / .6); }
.${P}-map[data-on] { opacity: 1; pointer-events: auto; }
/* The note card the words sit on, on the table */
.${P}-note { position: relative; z-index: 60; width: min(100% - 24px, 38rem); margin: 0 auto var(--space-3); padding: var(--space-4) var(--space-4) var(--space-2); border-radius: 4px; rotate: -.6deg;
  background: var(--letter-bg); color: var(--ink-soft); box-shadow: 0 1px 2px rgb(0 0 0 / .3), 0 18px 34px -16px rgb(0 0 0 / .6); text-align: center; }
.${P}-note .x-s24-words { align-items: center; margin: 0 auto; min-height: 4.6rem; }
.${P}-turn { min-height: 44px; }
@media (prefers-reduced-motion: reduce) {
  .${P}-print { transition: opacity 300ms linear; } .${P}-card { transition: none; }
  .${P}-print[data-flipped] .${P}-card { transform: none; } .${P}-print[data-flipped] .${P}-face:not(.${P}-back) { opacity: 0; } .${P}-back { transform: none; opacity: 0; transition: opacity 300ms linear; }
  .${P}-print[data-flipped] .${P}-back { opacity: 1; }
}
`

type Spot = { x: number; y: number; r: number }

export default function StoryLanternTable() {
  const { t } = useLang()
  const s = useChapters()
  const meta = useMeta(s)
  const { at, go, list, setList } = useStops(s.total)
  const end = s.total - 1
  const [flipped, setFlipped] = useState(false)
  const table = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 390, h: 520 })
  useEffect(() => {
    const el = table.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el)
    return () => ro.disconnect()
  }, [list])
  // Where each print lies on the table (a hand-laid ring round the light, the same every visit), and where it's been pushed
  const n = s.total - 1 // the kids' prints and every chapter's
  const [moved, setMoved] = useState<Record<number, { x: number; y: number }>>({})
  const spot = (i: number): Spot => {
    const wide = size.w >= 1024, a = (i / n) * Math.PI * 2 + rnd(i, 1) * 0.5 - Math.PI / 2
    const rx = size.w * (wide ? 0.34 : 0.37) + rnd(i, 2) * 14, ry = size.h * (wide ? 0.4 : 0.33) + rnd(i, 3) * 14
    // On a wide table they lie to the sides of the light, never under the one you're holding
    const cx = wide ? Math.sign(Math.cos(a) || 1) * Math.max(Math.abs(Math.cos(a)), 0.55) : Math.cos(a)
    const m = moved[i]
    return { x: m?.x ?? cx * rx, y: m?.y ?? Math.sin(a) * ry, r: TILTS[i % TILTS.length] * 2.2 + (rnd(i, 4) - 0.5) * 16 }
  }
  const small = size.w >= 1024 ? 0.42 : 0.38
  const step = useCallback((d: 1 | -1) => { setFlipped(false); go(at + d) }, [go, at])
  useSwipe(table, step)
  useEffect(() => { if (!flipped) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") setFlipped(false) }; addEventListener("keydown", k); return () => removeEventListener("keydown", k) }, [flipped])
  const said = useAnnounce(s, at)

  // Pushing a print around: it follows the pointer (written straight to it), stays where it's let go; a tap picks it up
  const drag = (i: number) => (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || i === at) return
    const el = e.currentTarget, from = spot(i), x0 = e.clientX, y0 = e.clientY
    let dx = 0, dy = 0, on = false
    el.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => {
      dx = ev.clientX - x0; dy = ev.clientY - y0
      if (!on && Math.hypot(dx, dy) < 6) return
      on = true; el.dataset.dragging = ""
      el.style.transform = `translate3d(${from.x + dx}px, ${from.y + dy}px, 0) rotate(${from.r}deg) scale(${small * 1.06})`
    }
    const up = () => {
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up)
      delete el.dataset.dragging
      if (on) setMoved((m) => ({ ...m, [i]: { x: from.x + dx, y: from.y + dy } }))
      else { setFlipped(false); go(i) }
    }
    el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
  }
  if (list) return <div className={`x-s24-root ${P}`}><style>{KIT_CSS + css}</style><ListView s={s} onBack={() => setList(false)} /></div>
  const c = at > 0 && at < end ? s.stops[at - 1] : null
  const lift = size.w >= 1024 ? -12 : -18
  return (
    <div className={`x-s24-root ${P}`}>
      <style>{KIT_CSS + css}</style>
      <h1 className="x-s24-h1">{t.story.title}</h1>
      <div ref={table} className={`x-s24-region ${P}-table`} role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0} onKeyDown={arrowKeys(step)}>
        {Array.from({ length: n }, (_, i) => {
          const held = i === at, ch = i > 0 ? s.stops[i - 1] : null, p = spot(i)
          // At the journey stop everything is pushed out towards the edges, clear of the map
          const out = at === end ? 1.28 : 1
          const style = { transform: held ? `translate3d(0, ${lift}px, 0) rotate(${(TILTS[i % TILTS.length] * 0.25).toFixed(1)}deg)` : `translate3d(${p.x * out}px, ${p.y * out}px, 0) rotate(${p.r}deg) scale(${small})`, zIndex: held ? 50 : 10 + i }
          const face = ch ? <Polaroid pic={chapterPic(ch)} cap={caption(ch)} tape={i % 3 === 1} sizes="(min-width: 1024px) 300px, 214px" eager={i <= 2} /> : <span className={`${P}-kids`}><KidPrints /></span>
          const body = (
            <span className={`${P}-card`}>
              <span className={`${P}-face`}>{face}</span>
              {ch && <span className={`${P}-face ${P}-back`} aria-hidden={!(held && flipped)}><b lang="en">{ch.title}</b>{ch.body[0] && <p lang="en">{ch.body[0]}</p>}<small>{caption(ch)}</small></span>}
              <span aria-hidden className={`${P}-lift`} />
            </span>
          )
          return held && ch
            ? <button key={i} type="button" className={`${P}-print`} style={style} data-held="" data-flipped={flipped || undefined} aria-pressed={flipped} aria-label={`${ch.title}, ${ch.year}. ${flipped ? "Turn it back" : "Turn it over to read the back"}`} onClick={() => setFlipped((f) => !f)}>{body}</button>
            : <div key={i} className={`${P}-print`} style={style} data-held={held || undefined} aria-hidden={!held || undefined} role={held ? "img" : undefined} aria-label={held ? `${KIDS.front[0].alt}; ${KIDS.front[1].alt}` : undefined} onPointerDown={drag(i)} data-own-drag="">{body}</div>
        })}
        <div className={`${P}-map`} data-on={at === end || undefined} inert={at !== end || undefined}>{at >= end - 1 && <JourneyStop active={at === end} />}</div>
        <p className="sr-only" aria-live="polite">{said}</p>
      </div>
      <div className={`${P}-note`}>
        {c ? (
          <div className="x-s24-words">
            <p className="x-s24-meta">{meta(c)}</p>
            <h2 lang="en" className="x-s24-title">{c.title}</h2>
            <div className="flex flex-wrap items-center justify-center gap-x-4">
              <button type="button" className={`btn-text ${P}-turn`} aria-pressed={flipped} onClick={() => setFlipped((f) => !f)}>{flipped ? "Turn it back" : "Turn it over"}</button>
              {(c.body.length > 1 || (c.body[0]?.length ?? 0) > 220) && <ReadOn c={c} meta={meta(c)} />}
            </div>
          </div>
        ) : at === end ? <EndWords s={s} /> : null}
        <Controls at={at} total={s.total} go={(i) => { setFlipped(false); go(i) }} onList={() => setList(true)} />
      </div>
    </div>
  )
}
