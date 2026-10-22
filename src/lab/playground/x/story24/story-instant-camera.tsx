import { useCallback, useRef, useState } from "react"
import { useLang } from "@/lib/lang"
import { Controls, EndWords, Img, JourneyStop, KIT_CSS, KidPrints, ListView, Polaroid, TILTS, Words, arrowKeys, caption, chapterPic, rnd, useAnnounce, useChapters, useMeta, useStops, useSwipe } from "./kit"

/**
 * E. The instant camera: Our story taken one picture at a time. Each chapter, the camera's flash blinks and its print
 * comes out of the slot under the lens (a motor's steady push, a little give as it lets go), milky grey at first,
 * then the picture coming up through it: shapes in grey, then its colour. A print that's been developed stays
 * developed when you come back to it. Prints already taken drop onto a pile beside the camera (on a phone they slide
 * away). The kid opener is the old prints lying there before the first picture; the journey stop is the map laid
 * where the print would be. Swipes, arrows, dots, the arrow keys and See as a list as on the live page.
 * The camera is CSS in the site's tokens (cream and moss by day, walnut by lantern light), no image. Reduced motion:
 * nothing slides; each print fades in already developed.
 */
const P = "x-ic"
const css = `
.${P} { gap: var(--space-3); justify-content: center; }
.${P}-grid { display: grid; width: 100%; max-width: 1200px; justify-items: center; align-items: center; gap: var(--space-3); }
@media (min-width: 1024px) { .${P}-grid { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: var(--space-7); } }
.${P}-stage { --cw: min(236px, 62vw); --pw: min(196px, 52vw, calc((100svh - 470px) / 1.34)); position: relative; display: flex; flex-direction: column; align-items: center; width: 100%; }
@media (min-width: 1024px) { .${P}-stage { --cw: 330px; --pw: min(270px, calc((100svh - 370px) / 1.34)); } }
/* The camera */
.${P}-cam { --cam-a: var(--brand-shiro-kinari); --cam-b: color-mix(in oklab, var(--brand-sage-paper) 80%, var(--brand-kare)); --cam-line: color-mix(in oklab, var(--brand-kare) 60%, var(--brand-nikkei));
  position: relative; z-index: 5; width: var(--cw); aspect-ratio: 1.5; border-radius: calc(var(--cw) * .09);
  background: linear-gradient(180deg, var(--cam-a), var(--cam-b)); box-shadow: inset 0 2px 0 rgb(255 255 255 / .55), inset 0 -3px 0 rgb(66 26 5 / .14), 0 2px 3px rgb(66 26 5 / .2), 0 22px 40px -18px rgb(66 26 5 / .5); }
[data-theme="lantern"] .${P}-cam { --cam-a: var(--brand-yoru-fill); --cam-b: var(--brand-yoru-raised); --cam-line: var(--brand-yoru-line); box-shadow: inset 0 1px 0 rgb(255 240 220 / .12), inset 0 -3px 0 rgb(0 0 0 / .3), 0 2px 3px rgb(0 0 0 / .5), 0 24px 44px -16px rgb(0 0 0 / .8); }
.${P}-cam[data-click] { animation: ${P}-click 260ms var(--ease-paper); }
@keyframes ${P}-click { 30% { transform: translateY(2px) scale(.995); } }
/* A moss band down the front, the camera's one stripe */
.${P}-band { position: absolute; left: 50%; top: 0; bottom: 18%; width: 9%; translate: -50% 0; background: linear-gradient(var(--brand-koke), color-mix(in oklab, var(--brand-koke) 70%, var(--brand-forest))); opacity: .85; }
.${P}-lens { position: absolute; left: 50%; top: 40%; width: 46%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%;
  background: radial-gradient(circle at 36% 32%, rgb(255 255 255 / .35) 0 4%, transparent 9%), radial-gradient(circle, var(--brand-ai) 0 26%, var(--brand-ink-deep) 27% 40%, color-mix(in oklab, var(--brand-ink-deep) 70%, var(--cam-line)) 41% 43%, var(--brand-ink-deep) 44% 62%, var(--cam-line) 63% 66%, var(--cam-a) 67% 74%, var(--cam-line) 75% 76%, color-mix(in oklab, var(--cam-a) 92%, black) 77%);
  box-shadow: 0 2px 4px rgb(66 26 5 / .3); }
.${P}-flash { position: absolute; right: 9%; top: 11%; width: 22%; height: 17%; border-radius: 4px; overflow: hidden;
  background: repeating-linear-gradient(90deg, rgb(255 255 255 / .5) 0 2px, transparent 2px 5px), color-mix(in oklab, var(--brand-paper-bright) 82%, var(--cam-line)); box-shadow: inset 0 0 0 1.5px var(--cam-line); }
.${P}-glow { position: absolute; inset: -40%; background: radial-gradient(var(--brand-paper-bright), transparent 65%); opacity: 0; animation: ${P}-flash 520ms ease-out; }
@keyframes ${P}-flash { 8% { opacity: 1; } 100% { opacity: 0; } }
.${P}-finder { position: absolute; left: 9%; top: 11%; width: 15%; height: 15%; border-radius: 5px; background: radial-gradient(circle at 40% 35%, color-mix(in oklab, var(--brand-ai) 60%, white) 0 8%, var(--brand-ai) 30%, var(--brand-ink-deep)); box-shadow: inset 0 0 0 2px var(--cam-line); }
.${P}-shutter { position: absolute; right: 12%; top: -4%; width: 13%; height: 7%; border-radius: 6px 6px 2px 2px; background: var(--brand-sabi); box-shadow: inset 0 -2px 0 rgb(42 18 6 / .3); }
.${P}-slot { position: absolute; left: 14%; right: 14%; bottom: 9%; height: 5px; border-radius: 3px; background: var(--brand-ink-deep); box-shadow: inset 0 2px 2px rgb(0 0 0 / .6), 0 1px 0 rgb(255 255 255 / .3); }
/* Where the prints come out: clipped at the slot's line, so a print inside the camera can't be seen */
.${P}-out { position: relative; z-index: 4; width: 100%; height: calc(var(--pw) * 1.34 + 20px); margin-top: calc(var(--cw) / -1.5 * .09 - 2px); clip-path: inset(0 -100vw -100vh -100vw); }
.${P}-print { position: absolute; left: 50%; top: 0; margin-left: calc(var(--pw) / -2); transition: transform 520ms var(--ease-paper-in-out), opacity 400ms var(--ease-paper); }
.${P}-print[data-state="in"] { transform: translateY(calc(-100% - 6px)); transition-duration: 420ms; }
.${P}-print[data-state="on"] { transform: translateY(0); transition: transform 1050ms cubic-bezier(.35, .05, .3, 1.04) 300ms; }
.${P}-print[data-state="gone"] { transform: translate(-120vw, 20px) rotate(-14deg); opacity: 0; }
@media (min-width: 1024px) { .${P}-print[data-state="gone"] { transform: translate(var(--px), var(--py)) rotate(var(--pr)) scale(.62); opacity: 1; } }
.${P}-print[data-state="far"] { visibility: hidden; transform: translateY(calc(-100% - 6px)); }
.${P}-print.is-kids[data-state="in"], .${P}-print.is-kids[data-state="on"] { transform: translateY(14px); transition: transform 600ms var(--ease-paper), opacity 400ms; }
.${P}-print.is-kids .x-s24-kids { --kw: calc(var(--pw) * .6); }
.${P}-instant .x-s24-pol { --pw: inherit; }
.${P}-print.is-kids { margin-left: calc(var(--pw) * -.57); }
/* Developing: milky grey over all of it, then the picture in grey, then its colour */
.${P}-dev { position: absolute; left: calc(var(--pw) * .05); right: calc(var(--pw) * .05); top: calc(var(--pw) * .05); height: calc(var(--pw) * .9 * 1.25); overflow: hidden; pointer-events: none; }
.${P}-dev > * { position: absolute; inset: 0; }
.${P}-mono { filter: grayscale(1) contrast(.55) brightness(1.18) sepia(.15); }
.${P}-mono img, .${P}-mono .x-s24-blank { display: block; width: 100%; height: 100%; }
.${P}-milk { background: radial-gradient(ellipse at 50% 45%, color-mix(in oklab, var(--brand-sage-paper) 82%, var(--brand-sage)), color-mix(in oklab, var(--brand-sage-paper) 66%, var(--brand-kare))); }
[data-dev="raw"] .${P}-milk, [data-dev="raw"] .${P}-mono { opacity: 1; }
[data-dev="done"] .${P}-milk, [data-dev="done"] .${P}-mono { opacity: 0; }
[data-dev="run"] .${P}-milk { animation: ${P}-fade 1900ms cubic-bezier(.5, 0, .7, 1) 1500ms both; }
[data-dev="run"] .${P}-mono { animation: ${P}-fade 2600ms cubic-bezier(.4, 0, .6, 1) 2600ms both; }
@keyframes ${P}-fade { from { opacity: 1; } to { opacity: 0; } }
.${P}-map { position: absolute; left: 50%; top: 10px; width: min(100%, 360px); translate: -50% 0; opacity: 0; pointer-events: none; transition: opacity 500ms var(--ease-paper) 200ms; }
.${P}-map[data-on] { opacity: 1; pointer-events: auto; }
.${P}-side { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); width: 100%; max-width: 34rem; text-align: center; }
.${P}-side .x-s24-words { align-items: center; min-height: 8rem; }
@media (min-width: 1024px) { .${P}-side { align-items: flex-start; text-align: left; } .${P}-side .x-s24-words { align-items: flex-start; } .${P}-side .x-s24-controls { align-items: flex-start; } }
@media (prefers-reduced-motion: reduce) {
  .${P}-print, .${P}-print[data-state] { transition: opacity 300ms linear !important; transform: none !important; }
  .${P}-print[data-state="in"], .${P}-print[data-state="gone"], .${P}-print[data-state="far"] { opacity: 0; }
  .${P}-cam[data-click], .${P}-glow { animation: none; }
  [data-dev] .${P}-milk, [data-dev] .${P}-mono { animation: none !important; opacity: 0; }
}
`

export default function StoryInstantCamera() {
  const { t } = useLang()
  const s = useChapters()
  const meta = useMeta(s)
  const { at, go, list, setList } = useStops(s.total)
  const end = s.total - 1
  // Which prints have been developed (they stay developed), and the one developing now
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]))
  const [fresh, setFresh] = useState(-1)
  const move = useCallback((i: number) => {
    const n = Math.max(0, Math.min(end, i))
    if (!seen.has(n)) { setFresh(n); setSeen((x) => new Set(x).add(n)) }
    go(n)
  }, [end, seen, go])
  const region = useRef<HTMLDivElement>(null)
  const step = useCallback((d: 1 | -1) => move(at + d), [move, at])
  useSwipe(region, step)
  const said = useAnnounce(s, at)
  if (list) return <div className={`x-s24-root ${P}`}><style>{KIT_CSS + css}</style><ListView s={s} onBack={() => setList(false)} /></div>
  const c = at > 0 && at < end ? s.stops[at - 1] : null
  const state = (i: number) => (i < at ? (at - i > 4 ? "far-gone" : "gone") : i === at && at !== end ? "on" : i === at + 1 ? "in" : "far")
  return (
    <div className={`x-s24-root ${P}`}>
      <style>{KIT_CSS + css}</style>
      <h1 className="x-s24-h1">{t.story.title}</h1>
      <div ref={region} className={`x-s24-region ${P}-grid`} role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0} onKeyDown={arrowKeys(step)}>
        <div className={`${P}-stage`}>
          <div key={at} className={`${P}-cam`} data-click={at > 0 && at < end ? "" : undefined} aria-hidden>
            <span className={`${P}-band`} /><span className={`${P}-finder`} />
            <span className={`${P}-flash`}>{at > 0 && at < end && <span className={`${P}-glow`} />}</span>
            <span className={`${P}-shutter`} /><span className={`${P}-lens`} /><span className={`${P}-slot`} />
          </div>
          <div className={`${P}-out`}>
            {Array.from({ length: end }, (_, i) => {
              const ch = i > 0 ? s.stops[i - 1] : null, st = state(i)
              const pile = { ["--px" as string]: `${-250 - rnd(i, 1) * 60}px`, ["--py" as string]: `${40 + rnd(i, 2) * 120}px`, ["--pr" as string]: `${TILTS[i % TILTS.length] * 2}deg` }
              const live = i === at
              return (
                <div key={ch?.key ?? "kids"} className={`${P}-print${ch ? "" : " is-kids"}`} data-state={st === "far-gone" ? "gone" : st} style={{ ...pile, zIndex: live ? 40 : 10 + i, visibility: st === "far" || st === "far-gone" ? "hidden" : undefined }}
                  role={live ? "group" : undefined} aria-roledescription={live ? "slide" : undefined} aria-label={live ? t.story.slide(at + 1, s.total) : undefined} aria-hidden={!live || undefined}>
                  {ch ? (
                    <span className={`${P}-instant`} data-dev={i === fresh && live ? "run" : seen.has(i) ? "done" : "raw"} style={{ display: "block", position: "relative" }}>
                      <Polaroid pic={chapterPic(ch)} cap={caption(ch)} sizes="(min-width: 1024px) 270px, 196px" eager={i <= 2}>
                        <span aria-hidden className={`${P}-dev`}><span className={`${P}-mono`}>{chapterPic(ch) && <Img pic={{ ...chapterPic(ch)!, alt: "" }} sizes="(min-width: 1024px) 270px, 196px" />}</span><span className={`${P}-milk`} /></span>
                      </Polaroid>
                    </span>
                  ) : <KidPrints />}
                </div>
              )
            })}
            <div className={`${P}-map`} data-on={at === end || undefined} inert={at !== end || undefined}>{at >= end - 1 && <JourneyStop active={at === end} />}</div>
          </div>
        </div>
        <div className={`${P}-side`}>
          {c ? <Words c={c} meta={meta(c)} /> : at === end ? <EndWords s={s} /> : null}
          <Controls at={at} total={s.total} go={move} onList={() => setList(true)} />
        </div>
        <p className="sr-only" aria-live="polite">{said}</p>
      </div>
    </div>
  )
}
