import type { CSSProperties } from "react"
import { useLang } from "@/lib/lang"
import { PageHeader } from "@/components/ui/page-header"
import { Photo } from "@/components/photo"
import { useTake } from "../../params"
import { JourneyStop, KidPrints, StoryFlow, Words, useChapters, useMeta, type Stop } from "./flow"
import { STICKER_ALT, useStickers } from "./stickers"

/**
 * G. Emaki (絵巻), a hand scroll (run 24 lab): Our story painted along one long sheet between two wooden rollers. It
 * unrolls from the left when the page opens, then moves a chapter at a time like a scroll wound by hand: each scene is
 * their photo let into the paper with soft ink edges, a vertical slip with the year, their words beside it, and between
 * scenes an ink-wash landscape (three layers of hills and mist that drift at their own pace). Takes: "sumi" (the ink
 * alone) or "landmarks" (Nadia's map pieces standing in the mist at Kyoto, lab only).
 */
const P = "x-em"

// Three ranges of hills for the wash between scenes, drawn once (a long, uneven ridge in a 400 × 100 box)
const ridge = (seed: number, base: number, amp: number) => {
  let d = `M0 100 L0 ${base}`
  for (let x = 0; x <= 400; x += 20) {
    const y = base - Math.abs(Math.sin((x + seed * 37) / 53) * amp + Math.sin((x + seed * 11) / 19) * amp * 0.35)
    d += ` Q${x - 10} ${(y - 6).toFixed(1)} ${x} ${y.toFixed(1)}`
  }
  return `${d} L400 100 Z`
}
const HILLS = [ridge(1, 70, 40), ridge(4, 80, 30), ridge(7, 92, 18)]

const css = `
.${P} { container-type: inline-size; width: 100%; }
.${P} .x-sf { --win: 100cqw; --panel: calc(var(--win) * .9); --scroll-h: min(60svh, 560px); }
.${P} .x-sf-track { overflow: hidden; height: var(--scroll-h); border-radius: 0; margin-top: var(--space-2); }
/* The sheet: washi in the theme's paper, a faint fibre, a hairline at top and bottom like a mounted edge */
.${P}-sheet { grid-area: 1 / 1; position: absolute; inset: 10px 14px; z-index: 0; background: var(--surface-raised);
  box-shadow: 0 1px 2px rgb(var(--tint-shadow) / .18), 0 18px 30px -20px rgb(var(--tint-shadow) / .45); }
.${P}-sheet::before { content: ""; position: absolute; inset: 7px 0; border-block: 1px solid color-mix(in oklab, var(--ink-story) 35%, transparent); }
.${P}-sheet::after { content: ""; position: absolute; inset: 0; opacity: .05; background: var(--ink); -webkit-mask: var(--texture-ink) 0 0 / 140px; mask: var(--texture-ink) 0 0 / 140px; }
/* The rollers (jiku): turned wood with knobs past the paper's edge */
.${P}-roll { position: absolute; z-index: 150; top: 0; bottom: 0; width: 16px; border-radius: 8px;
  background: linear-gradient(90deg, var(--brand-yoru) 0%, color-mix(in oklab, var(--brand-kuri) 80%, white) 38%, var(--brand-kuri) 55%, var(--brand-yoru) 100%);
  box-shadow: 2px 0 6px rgb(0 0 0 / .25); }
.${P}-roll::before, .${P}-roll::after { content: ""; position: absolute; left: 2px; right: 2px; height: 10px; border-radius: 3px; background: var(--brand-yoru); }
.${P}-roll::before { top: -3px; } .${P}-roll::after { bottom: -3px; }
.${P}-roll[data-side="l"] { left: 4px; }
/* The unrolling: the right roller and the paper behind it run out from the left once (outer and inner move opposite ways) */
.${P}-reveal { grid-area: 1 / 1; position: absolute; inset: 0; z-index: 140; pointer-events: none; overflow: hidden; }
.${P}-cover { position: absolute; top: 0; bottom: 0; left: 0; width: 100%; }
.${P}-cover .${P}-roll { left: 0; }
.${P}-cover::after { content: ""; position: absolute; top: 0; bottom: 0; left: 16px; width: 200%; background: var(--card); }
@media (prefers-reduced-motion: no-preference) {
  .${P}-cover { animation: x-em-unroll 1.6s cubic-bezier(.55,.05,.2,1) .25s both; }
}
.${P}-cover { translate: calc(100% - 20px) 0; }
@keyframes x-em-unroll { from { translate: 18px 0; } to { translate: calc(100% - 20px) 0; } }
/* A scene: a panel of the sheet, laid along the scroll by --d */
.${P} .x-sf-stop { grid-area: 1 / 1; position: absolute; top: 10px; bottom: 10px; left: calc((var(--win) - var(--panel)) / 2); width: var(--panel); z-index: 1 !important;
  transform: translate3d(calc(var(--d) * var(--panel)), 0, 0); }
.${P}-scene { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-5) var(--space-6); }
/* Their photo let into the paper: soft, ink-grained edges, like a painting on the sheet */
.${P}-photo { position: relative; flex: none; width: min(64cqw, 300px, calc(var(--scroll-h) * .42)); aspect-ratio: 4 / 5; rotate: var(--lean);
  -webkit-mask: radial-gradient(closest-side, #000 78%, transparent 100%); mask: radial-gradient(closest-side, #000 78%, transparent 100%); }
.${P}-photo figure, .${P}-photo .photo-print { width: 100%; height: 100%; margin: 0; padding: 0; background: none; box-shadow: none; transform: none; }
.${P}-photo figure > div { width: 100%; height: 100%; aspect-ratio: auto !important; border-radius: 0 !important; }
.${P}-photo figcaption { display: none; }
/* The year on a vertical slip, with a vermilion-free seal in the story ink */
.${P}-slip { position: absolute; top: var(--space-5); right: var(--space-4); writing-mode: vertical-rl; text-orientation: upright; padding: 10px 5px; letter-spacing: .1em;
  font: 400 15px / 1 var(--font-display); color: var(--ink); background: color-mix(in oklab, var(--surface-paper) 70%, var(--ink-story) 6%); box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ink-story) 50%, transparent); }
.${P} .x-sf-words { max-width: 30em; text-align: left; }
/* The wash between scenes: ink hills and mist at the panel's right edge, drifting a little faster than the paper */
.${P}-wash { position: absolute; top: 0; bottom: 0; right: calc(var(--panel) * -.25); width: calc(var(--panel) * .5); pointer-events: none; color: var(--ink);
  transform: translate3d(calc(var(--d) * -22px), 0, 0); }
.${P}-wash svg { position: absolute; left: 0; width: 100%; height: 34%; bottom: 0; overflow: visible; }
.${P}-wash svg path:nth-child(1) { opacity: .09; } .${P}-wash svg path:nth-child(2) { opacity: .14; transform: translateX(calc(var(--d) * -14px)); } .${P}-wash svg path:nth-child(3) { opacity: .2; transform: translateX(calc(var(--d) * -30px)); }
.${P}-blot { position: absolute; border-radius: 50%; background: radial-gradient(closest-side, color-mix(in oklab, var(--ink) 18%, transparent), transparent); }
.${P}-mist { position: absolute; left: -20%; right: -20%; height: 18%; border-radius: 50%; background: radial-gradient(closest-side, var(--surface-raised), transparent); opacity: .9; }
.${P}-wash { -webkit-mask: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent), var(--texture-ink) 0 0 / 120px; -webkit-mask-composite: source-in;
  mask: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent) intersect, var(--texture-ink) 0 0 / 120px; }
/* What's on a scene fades as it winds away; the wash stays on the paper */
.${P}-scene > :not(.${P}-wash) { opacity: calc(1 - var(--a) * 1.3); }
/* The opener: three kid photos let in, overlapping */
.${P}-kids { position: relative; width: min(80cqw, 380px); height: calc(var(--scroll-h) * .62); }
.${P}-kids .x-kids { position: absolute; inset: 0; }
.${P}-kids .x-pr { --pw: min(40cqw, 170px, calc(var(--scroll-h) * .3)); background: none; box-shadow: none; padding: 0; }
.${P}-kids .x-pr::after, .${P}-kids .x-kids-tape { display: none; }
.${P}-kids .x-pr-photo { -webkit-mask: radial-gradient(closest-side, #000 74%, transparent 100%); mask: radial-gradient(closest-side, #000 74%, transparent 100%); }
.${P}-kids .x-pr-photo::after { display: none; }
.${P}-kids .x-kids-back { translate: -40% -30%; --tilt: 0deg; opacity: .8; }
.${P}-kids .x-kids-g { translate: -26% 10%; --tilt: 0deg; }
.${P}-kids .x-kids-n { translate: 30% 0%; --tilt: 0deg; }
/* Kyoto: the map in the mist, Nadia's pieces standing round it (landmarks take) */
.${P}-end { gap: var(--space-3); }
.${P}-end .x-sf-words { text-align: center; align-items: center; }
.${P}-end .journey-globe { width: min(100%, 250px, calc(var(--scroll-h) * .42)); }
.${P}-land { position: absolute; z-index: 2; height: var(--h); width: auto; opacity: .92; mix-blend-mode: var(--stamp-blend, multiply); }
@media (min-width: 1024px) {
  .${P} .x-sf { --panel: calc(var(--win) * .82); --scroll-h: min(60svh, 600px); }
  .${P}-scene:not(.${P}-end):not(.${P}-open) { flex-direction: row; gap: var(--space-7); }
  .${P}-photo { width: min(30cqw, 300px, calc(var(--scroll-h) * .5)); }
}
@media (prefers-reduced-motion: reduce) {
  .${P} .x-sf-stop { transform: none; }
  .${P}-wash, .${P}-wash svg path { transform: none !important; }
}
`

export default function StoryEmaki() {
  const { t } = useLang()
  const take = useTake("sumi")
  const chapters = useChapters()
  const meta = useMeta(chapters)
  const stickers = useStickers(take === "landmarks")

  const wash = (i: number) => (
    <span aria-hidden className={`${P}-wash`}>
      <span className={`${P}-blot`} style={{ left: "10%", top: `${18 + (i % 3) * 12}%`, width: "70%", height: "40%" }} />
      <span className={`${P}-blot`} style={{ left: "30%", top: `${50 - (i % 2) * 14}%`, width: "60%", height: "30%" }} />
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" fill="currentColor">{HILLS.map((d, k) => <path key={k} d={d} style={{ transform: `scaleX(${k % 2 ? -1 : 1})`, transformOrigin: "50% 50%" }} />)}</svg>
      <span className={`${P}-mist`} style={{ top: `${56 + (i % 3) * 6}%` }} />
    </span>
  )

  const scene = (s: Stop, i: number, at: number) => {
    if (s.kind === "opener") return <div className={`${P}-scene ${P}-open`}><div className={`${P}-kids`}><KidPrints /></div>{wash(i)}</div>
    if (s.kind === "chapter") return (
      <div className={`${P}-scene`}>
        <span className={`${P}-photo`} style={{ "--lean": `${[-1.5, 1, -0.5, 1.5, -1, 0.5, -1.2][s.n % 7]}deg` } as CSSProperties}>
          {s.c.photo && <Photo name={s.c.photo} treatment="print" sizes="(min-width: 1024px) 300px, 64vw" alt={`${s.c.title}, ${s.c.year}`} />}
        </span>
        <Words c={s.c} meta={meta(s.c)} />
        <span aria-hidden className={`${P}-slip`}>{s.c.year.replace("–", "|")}</span>
        {wash(i)}
      </div>
    )
    return (
      <div className={`${P}-scene ${P}-end`}>
        <JourneyStop active={at === i} />
        {s.c ? <Words c={s.c} meta={meta(s.c)} /> : <h2 className="font-display text-heading">{t.story.kyoto}</h2>}
        {take === "landmarks" && (["pagoda", "kiyomizu", "tower", "gate"] as const).map((k, n) => stickers[k] && (
          <img key={k} src={stickers[k]} alt={STICKER_ALT[k]} draggable={false} className={`${P}-land`}
            style={[{ left: "0%", top: "6%", "--h": "26%" }, { right: "0%", top: "36%", "--h": "11%" }, { left: "3%", top: "35%", "--h": "14%" }, { right: "1%", top: "4%", "--h": "13%" }][n] as unknown as CSSProperties} />
        ))}
      </div>
    )
  }

  return (
    <div className={P} data-take={take}>
      <style>{css}</style>
      <PageHeader title={t.story.title} lettering="ourStory" />
      <StoryFlow reach={1} render={scene} stride={(w) => w * 0.82}
        before={<span aria-hidden className={`${P}-sheet`} />}
        after={<>
          <span aria-hidden className={`${P}-roll`} data-side="l" />
          <span aria-hidden className={`${P}-reveal`}><span className={`${P}-cover`}><span className={`${P}-roll`} /></span></span>
        </>} />
    </div>
  )
}
