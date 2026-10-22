import { useCallback, useRef } from "react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"
import { useTake } from "../../params"
import { Art, Controls, EndWords, JourneyStop, KIT_CSS, KidPrints, ListView, Polaroid, TILTS, Words, arrowKeys, caption, chapterPic, useAnnounce, useChapters, useMeta, useStops, useSwipe } from "./kit"

/**
 * A. Kamishibai (紙芝居): Our story told from a street storyteller's little wooden theatre. The doors open at the start
 * (they swing out flat to the sides like a butai's), then each chapter is a card in the frame: moving on pulls the card
 * out sideways through the slot in the frame and the next one is already there beneath it; going back slides it home.
 * - pull: one smooth draw
 * - half: the storyteller's half pull (naka-nuki): out to about half, a held beat, then away
 * The journey stop: the doors close on the last card and the theatre steps back for the globe. Reduced motion: the
 * doors are simply open and cards cross-fade. Both themes from the tokens (the wood darkens in Lantern).
 */
const P = "x-ka"
const css = `
.${P} { gap: var(--space-3); justify-content: center; }
.${P}-stage { display: grid; width: 100%; place-items: center; }
.${P}-stage > * { grid-area: 1 / 1; }
.${P}-butai { --ww: min(318px, calc(100vw - 72px)); --wr: 1.12; position: relative; margin-top: 28px; padding: 18px 20px 26px; perspective: 1100px; transition: opacity 600ms var(--ease-paper) 500ms, transform 700ms var(--ease-paper) 500ms;
  --wood-a: var(--brand-nikkei); --wood-b: var(--brand-kuri); --wood-c: color-mix(in oklab, var(--brand-kuri) 70%, var(--brand-kogecha));
  background:
    repeating-linear-gradient(91deg, transparent 0 7px, rgb(42 18 6 / .07) 7px 8px, transparent 8px 19px, rgb(255 240 220 / .05) 19px 21px),
    repeating-linear-gradient(89.4deg, transparent 0 31px, rgb(42 18 6 / .09) 31px 33px),
    linear-gradient(180deg, var(--wood-a), var(--wood-b) 60%, var(--wood-c));
  border-radius: 6px; box-shadow: inset 0 1px 0 rgb(255 240 220 / .25), inset 0 -2px 0 rgb(42 18 6 / .3), 0 2px 3px rgb(42 18 6 / .35), 0 28px 50px -24px rgb(42 18 6 / .6); }
[data-theme="lantern"] .${P}-butai { --wood-a: color-mix(in oklab, var(--brand-nikkei) 70%, var(--brand-yoru)); --wood-b: var(--brand-yoru-fill); --wood-c: var(--brand-yoru-raised);
  box-shadow: inset 0 1px 0 rgb(255 240 220 / .12), inset 0 -2px 0 rgb(0 0 0 / .4), 0 2px 3px rgb(0 0 0 / .5), 0 30px 60px -20px rgb(0 0 0 / .8); }
@media (min-width: 768px) { .${P}-butai { --ww: min(600px, 52vw, calc((100svh - 400px) * 1.43)); --wr: 1.43; padding: 26px 30px 38px; } }
/* The roof board, with Nadia's wax seal on it, and the legs' feet */
.${P}-roof { position: absolute; left: -14px; right: -14px; top: -16px; height: 22px; border-radius: 4px 4px 2px 2px;
  background: repeating-linear-gradient(90.5deg, transparent 0 11px, rgb(42 18 6 / .1) 11px 12px), linear-gradient(var(--wood-a), var(--wood-c)); box-shadow: 0 3px 5px -2px rgb(42 18 6 / .5); }
.${P}-seal { position: absolute; left: 50%; top: -24px; width: 46px; height: 46px; translate: -50% 0; z-index: 3; filter: drop-shadow(0 2px 2px rgb(42 18 6 / .4)); }
.${P}-seal img { width: 100%; height: 100%; }
.${P}-foot { position: absolute; bottom: -8px; width: 34px; height: 10px; border-radius: 2px; background: var(--wood-c); box-shadow: 0 2px 3px rgb(42 18 6 / .4); }
.${P}-foot.is-l { left: 10px; } .${P}-foot.is-r { right: 10px; }
/* The window: the cards stand in it; its right stile is the slot they're drawn out through */
.${P}-window { position: relative; width: var(--ww); aspect-ratio: var(--wr); overflow: hidden; border-radius: 2px; background: var(--brand-yoru);
  box-shadow: inset 0 0 0 3px var(--wood-c), inset 0 6px 10px rgb(0 0 0 / .45); }
.${P}-window::after { content: ""; position: absolute; inset: 0; z-index: 50; pointer-events: none; box-shadow: inset 0 0 0 3px var(--wood-c), inset 0 8px 14px -6px rgb(0 0 0 / .5), inset -10px 0 12px -10px rgb(0 0 0 / .6); }
.${P}-card { position: absolute; inset: 5px; display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; gap: 4%; padding: 5% 6%; border-radius: 2px; translate: 0 0;
  background: radial-gradient(rgb(66 26 5 / .06) .5px, transparent .6px) 0 0 / 3px 3px, linear-gradient(170deg, var(--brand-paper-bright), color-mix(in oklab, var(--brand-paper-bright) 88%, var(--brand-wara)));
  box-shadow: 0 0 0 .5px rgb(66 26 5 / .2), -6px 0 14px -6px rgb(42 18 6 / .45);
  transition: transform 720ms var(--ease-paper-in-out); }
.${P}[data-take="half"] .${P}-card { transition: transform 1500ms linear(0, .08 8%, .3 18%, .46 30%, .5 38%, .51 58%, .6 66%, .82 80%, .96 92%, 1); }
.${P}-card[data-state="out"] { transform: translateX(112%); }
.${P}-card[data-state="far"] { visibility: hidden; }
/* The card beneath sits a touch in the shade of the one in front, and comes up into the light as that one leaves */
.${P}-card::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: rgb(42 18 6 / .22); opacity: 0; transition: opacity 600ms var(--ease-paper); }
.${P}-card[data-state="under"]::after { opacity: 1; }
.${P}-card .x-s24-pol { --pw: calc(var(--ww) / var(--wr) * .58); justify-self: center; }
.${P}-card .x-s24-kids { --kw: calc(var(--ww) / var(--wr) * .5); grid-column: 1 / -1; justify-self: center; }
.${P}-card-cap { display: flex; flex-direction: column; gap: 6px; color: var(--brand-kogecha); }
.${P}-card-cap b { font: italic 400 calc(var(--ww) * .072) / 1.05 var(--font-display); rotate: -2deg; }
.${P}-card-cap svg { width: 80%; height: 8px; overflow: visible; }
.${P}-card-cap path { fill: none; stroke: var(--brand-sabi); stroke-width: 1.6; stroke-linecap: round; }
.${P}-card-cap small { font: 500 calc(var(--ww) * .036) / 1.2 var(--font-label); letter-spacing: .06em; text-transform: uppercase; color: var(--brand-nikkei); }
/* The doors: closed over the window at first, then swung out flat to the sides */
.${P}-door { position: absolute; top: 18px; bottom: 26px; width: calc(50% - 20px); z-index: 60; transform-style: preserve-3d; animation: 1300ms var(--ease-paper-in-out) 450ms both; }
@media (min-width: 768px) { .${P}-door { top: 26px; bottom: 38px; width: calc(50% - 30px); } }
.${P}-door.is-l { left: 20px; transform-origin: 0 50%; animation-name: ${P}-open-l; }
.${P}-door.is-r { right: 20px; transform-origin: 100% 50%; animation-name: ${P}-open-r; }
@media (min-width: 768px) { .${P}-door.is-l { left: 30px; } .${P}-door.is-r { right: 30px; } }
.${P}[data-end] .${P}-door.is-l { animation-name: ${P}-close-l; animation-delay: 0ms; }
.${P}[data-end] .${P}-door.is-r { animation-name: ${P}-close-r; animation-delay: 0ms; }
@keyframes ${P}-open-l { from { transform: rotateY(0) } to { transform: rotateY(-172deg) } }
@keyframes ${P}-open-r { from { transform: rotateY(0) } to { transform: rotateY(172deg) } }
@keyframes ${P}-close-l { from { transform: rotateY(-172deg) } to { transform: rotateY(0) } }
@keyframes ${P}-close-r { from { transform: rotateY(172deg) } to { transform: rotateY(0) } }
.${P}-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 2px;
  background: repeating-linear-gradient(0.6deg, transparent 0 9px, rgb(42 18 6 / .08) 9px 10px, transparent 10px 23px), linear-gradient(90deg, var(--wood-b), var(--wood-a) 50%, var(--wood-b));
  box-shadow: inset 0 0 0 1px rgb(42 18 6 / .35), inset 0 0 0 8px rgb(255 240 220 / .05), inset 0 0 0 9px rgb(42 18 6 / .25); }
.${P}-face.is-back { transform: rotateY(180deg); filter: brightness(.82); }
.${P}-knob { position: absolute; top: 50%; width: 10px; height: 10px; border-radius: 50%; translate: 0 -50%; background: var(--brand-kare); box-shadow: inset -1px -1px 1px rgb(42 18 6 / .5), 0 1px 1px rgb(42 18 6 / .4); }
.is-l .${P}-face:not(.is-back) .${P}-knob { right: 10px; } .is-r .${P}-face:not(.is-back) .${P}-knob { left: 10px; }
.${P}[data-end] .${P}-butai { opacity: 0; transform: translateY(16px) scale(.96); pointer-events: none; }
.${P}-journey { width: 100%; opacity: 0; transition: opacity 500ms var(--ease-paper); pointer-events: none; }
.${P}[data-end] .${P}-journey { opacity: 1; pointer-events: auto; transition-delay: 1000ms; }
.${P}-words { width: 100%; max-width: 40rem; min-height: 8.5rem; text-align: center; align-items: center; }
.${P}-words .x-s24-words { align-items: center; }
@media (prefers-reduced-motion: reduce) {
  .${P}-door { animation: none !important; opacity: 0; } .${P}[data-end] .${P}-door { opacity: 0; }
  .${P}-card, .${P}[data-take="half"] .${P}-card { transition: opacity 300ms linear; } .${P}-card[data-state="out"] { transform: none; opacity: 0; }
  .${P}-butai, .${P}-journey, .${P}[data-end] .${P}-journey { transition: opacity 300ms linear; transform: none !important; }
}
`
const UNDER = ["M2 4 C 22 1, 44 6, 64 3 S 92 5, 98 2", "M3 3 C 25 6, 45 1, 66 4 S 88 2, 97 5"]

export default function StoryKamishibai() {
  const { t } = useLang()
  const take = useTake("pull")
  const s = useChapters()
  const meta = useMeta(s)
  const { at, go, list, setList } = useStops(s.total)
  const end = at === s.total - 1
  const region = useRef<HTMLDivElement>(null)
  const step = useCallback((d: 1 | -1) => go(at + d), [go, at])
  useSwipe(region, step)
  const said = useAnnounce(s, at)
  if (list) return <div className={`x-s24-root ${P}`}><style>{KIT_CSS + css}</style><ListView s={s} onBack={() => setList(false)} /></div>
  const cards = s.total - 1 // the opener and each stop; the journey stop is the globe
  const state = (i: number) => (i < at - 1 ? "far" : i < at ? "out" : i === at ? "on" : i === at + 1 ? "under" : "far")
  const c = at > 0 && !end ? s.stops[at - 1] : null
  return (
    <div className={`x-s24-root ${P}`} data-take={take} data-end={end || undefined}>
      <style>{KIT_CSS + css}</style>
      <h1 className="x-s24-h1">{t.story.title}</h1>
      <div ref={region} className="x-s24-region" role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0} onKeyDown={arrowKeys(step)}>
        <div className={`${P}-stage`}>
          <div className={`${P}-butai`} aria-hidden={end || undefined}>
            <span aria-hidden className={`${P}-roof`} />
            <span aria-hidden className={`${P}-seal`}><Art src={ART.seal.src} widths={ART.seal.widths} sizes="46px" /></span>
            <div className={`${P}-window`}>
              {Array.from({ length: cards }, (_, i) => {
                const ch = i > 0 ? s.stops[i - 1] : null
                return (
                  <section key={ch?.key ?? "opener"} className={`${P}-card`} data-state={state(i)} style={{ zIndex: cards - i }} role="group" aria-roledescription="slide"
                    aria-label={t.story.slide(i + 1, s.total)} inert={i !== at || undefined}>
                    {ch ? <>
                      <Polaroid pic={chapterPic(ch)} tilt={TILTS[(i - 1) % TILTS.length] * 0.6} tape={i % 3 !== 2} sizes="(min-width: 768px) 220px, 120px" eager={i <= 2} />
                      <span aria-hidden className={`${P}-card-cap`}>
                        <b>{caption(ch)}</b>
                        <svg viewBox="0 0 100 6" preserveAspectRatio="none"><path d={UNDER[i % 2]} /></svg>
                        <small>{t.story.slide(i + 1, s.total)}</small>
                      </span>
                    </> : <KidPrints />}
                  </section>
                )
              })}
            </div>
            {(["l", "r"] as const).map((d) => <span key={d} aria-hidden className={`${P}-door is-${d}`}><span className={`${P}-face`}><span className={`${P}-knob`} /></span><span className={`${P}-face is-back`} /></span>)}
            <span aria-hidden className={`${P}-foot is-l`} /><span aria-hidden className={`${P}-foot is-r`} />
          </div>
          <div className={`${P}-journey`} aria-hidden={!end || undefined} inert={!end || undefined}>{at >= s.total - 2 && <JourneyStop active={end} />}</div>
        </div>
        <div className={`${P}-words`} aria-live="off">
          {c ? <Words c={c} meta={meta(c)} /> : end ? <EndWords s={s} /> : null}
        </div>
        <p className="sr-only" aria-live="polite">{said}</p>
      </div>
      <Controls at={at} total={s.total} go={go} onList={() => setList(true)} />
    </div>
  )
}
