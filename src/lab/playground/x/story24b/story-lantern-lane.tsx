import type { CSSProperties } from "react"
import { useLang } from "@/lib/lang"
import { Scene } from "@/components/letter/scene"
import { JourneyStop, KidPrints, Polaroid, StoryFlow, Words, useChapters, useMeta, type Stop } from "./flow"

/**
 * H. Lantern lane (run 24 lab): their prints pegged along a string strung across the night lane from the Lantern
 * arrival photo, each with a small paper lantern above its peg. The one you're on hangs lowest in the middle with its
 * lantern lit and a warm pool behind it; the rest wait along the string in the dark, swaying a little. Moving on slides
 * the prints along the string's curve (each print turns with the string's slope). Their words sit on a paper card at
 * the foot, never on the photo. Reduced motion: no sway, no sliding, the next print and its words fade in.
 */
const P = "x-ll"

const css = `
.${P} { container-type: inline-size; position: relative; isolation: isolate; min-height: 100svh; display: flex; flex-direction: column; color: var(--ink); overflow: hidden; }
.${P} > .scene, .${P} > [class*="scene"] { z-index: -2; }
/* Night over the lane in both modes (Light is the lane at dusk): a scrim that keeps the top and the foot quiet */
.${P}-scrim { position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background: linear-gradient(180deg, rgb(14 8 4 / .78) 0%, rgb(14 8 4 / .25) 26%, rgb(14 8 4 / .2) 55%, rgb(14 8 4 / .7) 100%); }
:root:not([data-theme="lantern"]) .${P}-scrim { background: linear-gradient(180deg, rgb(30 18 10 / .6) 0%, rgb(30 18 10 / .12) 26%, rgb(30 18 10 / .1) 55%, rgb(30 18 10 / .55) 100%); }
.${P}-title { padding: var(--space-5) var(--space-4) 0; text-align: center; font: 400 var(--type-display-size) / var(--type-display-leading) var(--font-display); color: #fbf3e4; text-shadow: 0 1px 12px rgb(0 0 0 / .5); }
.${P} .x-sf { flex: 1; --gap: 46cqw; --sag: 46px; --k: .85; --hang-top: 64px; padding-bottom: var(--space-4); }
.${P} .x-sf-track { flex: 1; min-height: 0; overflow: hidden; border-radius: 0; }
/* The string: one curve across the lane, lowest in the middle */
.${P}-string { grid-area: 1 / 1; position: absolute; left: -2%; width: 104%; top: var(--hang-top); height: calc(var(--sag) * 2); z-index: 0; pointer-events: none; overflow: visible; }
.${P}-string path { fill: none; stroke: color-mix(in oklab, var(--brand-kare) 75%, white); stroke-opacity: .75; stroke-width: 1.4; vector-effect: non-scaling-stroke; }
.${P} .x-sf-stop { position: relative; display: grid; grid-template-rows: 1fr auto; }
/* A print on the string: slid along it by --d, dropped to the curve, turned with its slope */
.${P}-hang { position: relative; justify-self: center; align-self: start; margin-top: calc(var(--hang-top) - 6px);
  transform: translate3d(calc(var(--d) * var(--gap)), calc(var(--sag) * (1 - min(1, var(--d) * var(--d) * var(--k)))), 0) rotate(calc(var(--d) * -4deg)); transform-origin: 50% 0; }
.${P}-sway { display: block; transform-origin: 50% 0; }
@media (prefers-reduced-motion: no-preference) { .${P}-sway { animation: x-ll-sway var(--sw, 5s) ease-in-out infinite alternate; } }
@keyframes x-ll-sway { from { transform: rotate(-1.6deg); } to { transform: rotate(1.6deg); } }
/* The peg: a little wooden clip over the string */
.${P}-peg { position: absolute; z-index: 3; left: 50%; top: -12px; width: 9px; height: 26px; translate: -50% 0; border-radius: 2px;
  background: linear-gradient(90deg, #8a6a4a, #c49a6c 45%, #8a6a4a); box-shadow: 0 1px 2px rgb(0 0 0 / .4); }
/* Its lantern: a small chōchin, ribbed paper with dark caps, lit only on the print you're on */
.${P}-lamp { position: absolute; z-index: 2; left: calc(50% + 26px); top: -10px; width: 26px; height: 34px; }
.${P}-lamp::before { content: ""; position: absolute; left: 50%; top: -10px; width: 1px; height: 12px; background: color-mix(in oklab, var(--brand-kare) 70%, black); }
.${P}-lamp i { position: absolute; inset: 4px 0; border-radius: 45%; background: repeating-linear-gradient(180deg, rgb(0 0 0 / .25) 0 1px, transparent 1px 5px), color-mix(in oklab, var(--brand-kare) 55%, black); }
.${P}-lamp b { position: absolute; inset: 4px 0; border-radius: 45%; background: repeating-linear-gradient(180deg, rgb(120 40 10 / .25) 0 1px, transparent 1px 5px), radial-gradient(closest-side, #fff4dc, var(--brand-hachimitsu) 60%, var(--brand-kabocha));
  opacity: calc(1 - min(1, var(--a) * 1.6)); box-shadow: 0 0 22px 6px color-mix(in oklab, var(--brand-hachimitsu) 55%, transparent); }
.${P}-lamp::after { content: ""; position: absolute; left: 4px; right: 4px; top: 0; height: 5px; border-radius: 2px; background: #2a1a10; box-shadow: 0 29px 0 #2a1a10; }
/* The warm pool behind the lit print, and the dark over the ones still waiting */
.${P}-pool { position: absolute; z-index: -1; left: 50%; top: 45%; width: min(80cqw, 420px); aspect-ratio: 1; translate: -50% -50%; border-radius: 50%; pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--brand-hachimitsu) 48%, transparent), transparent); opacity: calc(1 - min(1, var(--a) * 1.4)); }
.${P} .x-pr::before { content: ""; position: absolute; inset: 0; z-index: 4; pointer-events: none; border-radius: 2px; background: rgb(10 5 2); opacity: calc(min(1, var(--a)) * .62); }
.${P}-hang .x-pr { --pw: min(52cqw, 230px, 30svh); }
/* The opener: the three kid prints pegged side by side */
.${P}-kids { position: relative; width: min(84cqw, 420px); height: min(40svh, 340px); }
.${P}-kids .x-kids { position: absolute; inset: 0; }
.${P}-kids .x-pr { --pw: min(34cqw, 150px, 19svh); }
.${P}-kids .x-kids-back { translate: -92% 6%; --tilt: -4deg; }
.${P}-kids .x-kids-g { translate: -10% -2%; --tilt: 3deg; }
.${P}-kids .x-kids-n { translate: 78% 8%; --tilt: -3deg; }
.${P}-kids .x-kids-tape { display: none; }
/* Kyoto: the lantern alone on the string, big and lit */
.${P}-big { position: relative; width: 74px; height: 98px; margin-top: 8px; }
.${P}-big i, .${P}-big b { position: absolute; inset: 8px 0; border-radius: 45%; }
.${P}-big i { background: repeating-linear-gradient(180deg, rgb(0 0 0 / .18) 0 1px, transparent 1px 8px), color-mix(in oklab, var(--brand-shiro-kinari) 80%, var(--brand-kare)); }
.${P}-big b { background: repeating-linear-gradient(180deg, rgb(120 40 10 / .25) 0 1px, transparent 1px 8px), radial-gradient(closest-side, #fff4dc, var(--brand-hachimitsu) 60%, var(--brand-kabocha));
  opacity: calc(1 - min(1, var(--a) * 1.6)); box-shadow: 0 0 40px 12px color-mix(in oklab, var(--brand-hachimitsu) 45%, transparent); }
.${P}-big::before, .${P}-big::after { content: ""; position: absolute; left: 10px; right: 10px; height: 10px; border-radius: 3px; background: #2a1a10; }
.${P}-big::before { top: 0; } .${P}-big::after { bottom: 0; }
.${P}-big span { position: absolute; inset: 0; display: grid; place-items: center; font: 600 30px / 1 var(--font-ja); color: var(--brand-shu); opacity: .9; }
/* The words: a paper card at the foot, in the theme's paper */
.${P}-card { position: relative; z-index: 120; justify-self: center; width: min(100% - 32px, 560px); margin-top: var(--space-4); padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-card); background: var(--letter-bg); color: var(--ink-soft); box-shadow: var(--elevation-raised);
  opacity: calc(1 - min(1, var(--a) * 2.2)); transform: translate3d(0, calc(var(--a) * 10px), 0); }
.${P}-card .x-sf-words { max-width: none; }
.${P}-card.is-map { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); text-align: center; }
.${P}-card.is-map .x-sf-words { align-items: center; }
.${P}-card .journey-globe { width: min(100%, 220px, 26svh); }
.${P} .x-sf-controls { position: relative; z-index: 130; margin-inline: auto; padding: 2px var(--space-3); border-radius: var(--radius-pill); background: color-mix(in oklab, var(--letter-bg) 92%, transparent); }
.${P} .x-sf > .btn-text { position: relative; z-index: 130; color: #fbf3e4; }
:root:not([data-theme="lantern"]) .${P} .x-sf > .btn-text { color: #fbf3e4; }
.${P} .x-sf-track:focus-visible { outline-offset: -4px; }
@media (min-width: 1024px) {
  .${P} .x-sf { --gap: 22cqw; --sag: 80px; --k: .19; --hang-top: 60px; }
  .${P}-hang .x-pr { --pw: min(14cqw, 230px, 30svh); }
}
@media (prefers-reduced-motion: reduce) { .${P}-hang, .${P}-card { transform: none; } }
`

export default function StoryLanternLane() {
  const { t } = useLang()
  const chapters = useChapters()
  const meta = useMeta(chapters)

  const stop = (s: Stop, i: number, at: number) => {
    const hang = s.kind === "opener"
      ? <div className={`${P}-kids`}><KidPrints /></div>
      : s.kind === "chapter"
        ? <Polaroid c={s.c} i={s.n} sizes="(min-width: 1024px) 260px, 52vw" />
        : <span aria-hidden className={`${P}-big`}><i /><b /><span>寿</span></span>
    return <>
      <div className={`${P}-hang`}>
        <span className={`${P}-sway`} style={{ "--sw": `${4.2 + (i % 4) * 0.7}s`, animationDelay: `${-(i * 1.3)}s` } as CSSProperties}>
          <span aria-hidden className={`${P}-pool`} />
          {s.kind === "chapter" && <><span aria-hidden className={`${P}-peg`} /><span aria-hidden className={`${P}-lamp`}><i /><b /></span></>}
          {hang}
        </span>
      </div>
      {s.kind === "chapter" ? <div className={`${P}-card`}><Words c={s.c} meta={meta(s.c)} /></div>
        : s.kind === "journey" ? <div className={`${P}-card is-map`}><JourneyStop active={at === i} />{s.c ? <Words c={s.c} meta={meta(s.c)} /> : <h2 className="font-display text-heading">{t.story.kyoto}</h2>}</div>
        : null}
    </>
  }

  return (
    <div className={P}>
      <style>{css}</style>
      <Scene source={{ photo: "night-lane" }} />
      <span aria-hidden className={`${P}-scrim`} />
      <h1 className={`${P}-title`}>{t.story.title}</h1>
      <StoryFlow reach={2} render={stop} stride={(w) => (w >= 1024 ? w * 0.22 : w * 0.46)}
        before={<svg aria-hidden className={`${P}-string`} viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 0 Q50 100 100 0" /></svg>} />
    </div>
  )
}
