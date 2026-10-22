import type { CSSProperties } from "react"
import { useLang } from "@/lib/lang"
import { PageHeader } from "@/components/ui/page-header"
import { Hanko } from "@/components/hanko"
import type { Chapter } from "@/lib/content"
import { useTake } from "../../params"
import { JourneyStop, KidPrints, Polaroid, StoryFlow, Words, useChapters, useMeta, type Stop } from "./flow"
import { STICKER_ALT, useStickers, type Sticker } from "./stickers"

/**
 * F. Passport pages (run 24 lab): Our story as a passport. Each chapter is a page with their print pasted in and a
 * stamp of the place and year inked across its corner; Kyoto's is the 寿 seal. Turning on is a page turn round the
 * spine (rotateY on the page, transform only), the stamp lands once the page is open, and its ink shows faintly through
 * the back of the page you just turned. From 1024 the turned page lies open on the left, so the book reads as a spread.
 * Takes: "stamped" (the stamps alone) or "stickers" (Nadia's map pieces stuck on the Japan pages, lab only).
 */
const P = "x-pp"
const INKS = ["var(--ink-story)", "var(--ink-link)", "var(--ink-moss)", "var(--ink-story)", "var(--ink-link)", "var(--ink-moss)", "var(--ink-story)"]
const SHAPES = ["round", "rect", "oval", "hex", "round", "rect", "oval"] as const

// A guilloche: two families of fine waves, the security print on a passport page (static, drawn once as a background)
const wave = (amp: number, per: number, y: number) => {
  let d = `M0 ${y}`
  for (let x = 0; x <= 240; x += 6) d += ` L${x} ${(y + Math.sin((x / per) * Math.PI * 2) * amp).toFixed(2)}`
  return d
}
const GUILLOCHE = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='120' viewBox='0 0 240 120' fill='none' stroke='black' stroke-width='.5'>${Array.from({ length: 10 }, (_, k) => `<path d='${wave(5, 60, 6 + k * 12)}'/><path d='${wave(4, 40, 12 + k * 12)}' opacity='.6'/>`).join("")}</svg>`)}")`

const css = `
.${P} { container-type: inline-size; width: 100%; }
.${P} .x-sf { --page-w: min(100cqw, 360px); --page-h: min(56svh, 540px); }
.${P} .x-sf-track { overflow: visible; min-height: var(--page-h); perspective: 1800px; margin-top: var(--space-3); }
.${P}-book { position: relative; width: var(--page-w); height: var(--page-h); margin-inline: auto; }
/* The cover behind the pages and the page edges stacked on the right */
.${P}-cover { position: absolute; inset: -7px -9px -7px -4px; border-radius: 4px 10px 10px 4px; background: color-mix(in oklab, var(--brand-ai) 88%, var(--brand-sabi));
  box-shadow: 0 2px 3px rgb(var(--tint-shadow) / .3), 0 24px 40px -22px rgb(var(--tint-shadow) / .6); }
.${P}-edges { position: absolute; top: 3px; bottom: 3px; right: -6px; width: 6px; border-radius: 0 3px 3px 0;
  background: repeating-linear-gradient(90deg, var(--brand-paper-bright) 0 1px, color-mix(in oklab, var(--brand-kare) 60%, transparent) 1px 2px); }
.${P} .x-sf-stop { grid-area: 1 / 1; display: grid; place-items: start center; }
.${P}-leaf { position: relative; width: var(--page-w); height: var(--page-h); transform-style: preserve-3d; transform-origin: 0 50%;
  transform: translateX(calc(max(0, var(--d)) * 3px)) rotateY(calc(min(0, var(--d)) * 178deg)); }
.${P}-face, .${P}-back { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 2px 6px 6px 2px; overflow: hidden;
  background-color: var(--surface-raised); color: var(--ink-soft);
  box-shadow: inset 10px 0 14px -10px rgb(var(--tint-shadow) / .35), 0 0 0 .5px rgb(var(--tint-shadow) / .18); }
.${P}-face::before, .${P}-back::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .06;
  -webkit-mask: ${GUILLOCHE} 0 0 / 240px 120px; mask: ${GUILLOCHE} 0 0 / 240px 120px; background: var(--ink-story); }
.${P}-back { transform: rotateY(180deg); border-radius: 6px 2px 2px 6px; box-shadow: inset -10px 0 14px -10px rgb(var(--tint-shadow) / .35), 0 0 0 .5px rgb(var(--tint-shadow) / .18); }
/* The fold's shade as a page lifts, on the one turning and the one under it */
.${P}-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgb(var(--tint-shadow) / .28), transparent 70%); opacity: calc(min(var(--a), 1 - var(--a)) * 1.6); }
.${P}-no { position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; font: 500 11px / 1 var(--font-label); letter-spacing: .2em; color: var(--ink-muted); }
.${P}-holes { position: absolute; top: 12px; right: 14px; display: flex; gap: 3px; }
.${P}-holes i { width: 3px; height: 3px; border-radius: 50%; background: color-mix(in oklab, var(--ink) 40%, transparent); }
.${P}-in { position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6) var(--space-5) var(--space-6); }
.${P}-in .x-pr { --pw: min(52vw, 200px, calc(var(--page-h) * .36)); flex: none; }
.${P}-in .x-sf-words { text-align: left; align-self: stretch; }
.${P}-in .x-sf-words h2 { font-size: calc(var(--type-heading-size) * .92); }
/* The stamp: inked over the corner of the print, ink unevenly laid (the hanko's texture), multiplied into the paper */
.${P}-stamp { position: absolute; width: 112px; height: 112px; color: var(--ink); opacity: .86; rotate: var(--r);
  -webkit-mask: var(--texture-ink) 0 0 / 96px; mask: var(--texture-ink) 0 0 / 96px; mix-blend-mode: var(--stamp-blend, multiply); }
.${P}-stamp svg { width: 100%; height: 100%; overflow: visible; }
.${P}-in > .${P}-stamp { top: calc(var(--space-6) + min(52vw, 200px, calc(var(--page-h) * .36)) * 1.05); right: 6%; }
.${P}-in .hanko { position: absolute; right: 5%; bottom: 16px; z-index: 1; width: 76px; height: 76px; --hanko-paper: var(--surface-raised); }
.${P}-ghost { position: absolute; width: 112px; height: 112px; scale: -1 1; opacity: .1; color: var(--ink); right: auto; left: 6%; top: calc(var(--space-6) + min(52vw, 200px, calc(var(--page-h) * .36)) * 1.05); }
.${P}-ghost svg { width: 100%; height: 100%; }
@media (prefers-reduced-motion: no-preference) {
  [data-at] .${P}-stamp { animation: x-pp-stamp 420ms cubic-bezier(.3,.7,.2,1) 260ms both; }
  [data-at] .${P}-in .hanko { animation: x-pp-seal 420ms cubic-bezier(.3,.7,.2,1) 300ms both; }
}
@keyframes x-pp-seal { 0% { opacity: 0; transform: scale(1.7) rotate(-16deg); } 55% { opacity: 1; transform: scale(.93) rotate(-7deg); } 100% { opacity: 1; transform: rotate(-8deg); } }
@keyframes x-pp-stamp { 0% { opacity: 0; transform: scale(1.7) rotate(-8deg); } 55% { opacity: .95; transform: scale(.93); } 100% { opacity: .86; transform: none; } }
/* Nadia's map pieces, stuck down with a white die-cut edge */
.${P}-sticker { position: absolute; z-index: 2; height: var(--h); width: auto; rotate: var(--r); filter: drop-shadow(0 0 0 #fff) drop-shadow(1.5px 0 0 #fffaf2) drop-shadow(-1.5px 0 0 #fffaf2) drop-shadow(0 1.5px 0 #fffaf2) drop-shadow(0 -1.5px 0 #fffaf2) drop-shadow(0 3px 3px rgb(0 0 0 / .25)); }
/* The opener: the holder's page, the three kid prints overlapping */
.${P}-kids { position: relative; flex: 1; width: 100%; }
.${P}-kids .x-pr { --pw: min(calc(var(--page-w) * .5), calc(var(--page-h) * .36)); }
.${P}-kids .x-kids-back { translate: -38% -24%; --tilt: 5deg; }
.${P}-kids .x-kids-g { translate: -32% 8%; --tilt: -5deg; z-index: 1; }
.${P}-kids .x-kids-n { translate: 34% 4%; --tilt: 4deg; z-index: 2; }
.${P}-kids .x-kids { position: absolute; inset: 0; }
.${P}-map .story-slide { padding: 0; gap: var(--space-3); }
.${P}-map .journey-globe { width: min(100%, 260px, calc(var(--page-h) * .44)); }
.${P}-map .x-sf-words { text-align: center; align-items: center; }
@media (min-width: 1024px) {
  .${P} .x-sf { --page-w: min(48cqw, 440px); --page-h: min(62svh, 600px); }
  .${P}-book { margin-left: 50%; }
  .${P}-cover { left: calc(-1 * var(--page-w) - 9px); border-radius: 10px; }
  .${P}-cover::after { content: ""; position: absolute; top: 4%; bottom: 4%; left: calc(var(--page-w) + 6px); width: 6px; background: linear-gradient(90deg, rgb(0 0 0 / .35), transparent); }
  .${P} .x-sf-stop { place-items: start start; padding-left: 50%; }
  .${P}-in { padding: var(--space-7) var(--space-6); }
}
@media (max-width: 1023.98px) { .${P}-leaf { opacity: calc(1.6 + min(0, var(--d)) * 1.6); } }
@media (prefers-reduced-motion: reduce) { .${P}-leaf { transform: none; } .${P}-shade { display: none; } }
`

/** A passport stamp drawn for a place and year: one of four shapes, a double rim, the place round or across it */
function Stamp({ place, year, i, ghost = false }: { place: string; year: string; i: number; ghost?: boolean }) {
  const shape = SHAPES[i % SHAPES.length], word = place.split(",").pop()!.replace(/\(.*\)/, "").trim().toUpperCase(), id = `x-pp-arc-${i}${ghost ? "g" : ""}`
  const rim = shape === "round"
    ? <><circle cx="50" cy="50" r="46" strokeWidth="3" /><circle cx="50" cy="50" r="33" strokeWidth="1.2" /></>
    : shape === "oval" ? <><ellipse cx="50" cy="50" rx="48" ry="34" strokeWidth="3" /><ellipse cx="50" cy="50" rx="41" ry="27" strokeWidth="1" /></>
    : shape === "hex" ? <><path d="M50 3 L91 26 L91 74 L50 97 L9 74 L9 26 Z" strokeWidth="3" strokeLinejoin="round" /><path d="M50 13 L82 31 L82 69 L50 87 L18 69 L18 31 Z" strokeWidth="1" /></>
    : <><rect x="4" y="16" width="92" height="68" rx="6" strokeWidth="3" /><rect x="10" y="22" width="80" height="56" rx="3" strokeWidth="1" strokeDasharray="3 2" /></>
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden>
      {rim}
      {shape === "round"
        ? <><defs><path id={id} d="M50 50 m-40 0 a40 40 0 1 1 80 0" /></defs>
            <text fill="currentColor" stroke="none" fontSize="9.5" fontFamily="var(--font-label)" fontWeight="700" letterSpacing="2"><textPath href={`#${id}`} startOffset="50%" textAnchor="middle">{word}</textPath></text></>
        : <text x="50" y={shape === "rect" ? 37 : 38} textAnchor="middle" fill="currentColor" stroke="none" fontSize={word.length > 9 ? 8 : 10} fontFamily="var(--font-label)" fontWeight="700" letterSpacing="1.6">{word}</text>}
      <text x="50" y={shape === "round" ? 62 : 64} textAnchor="middle" fill="currentColor" stroke="none" fontSize={year.length > 4 ? 13 : 19} fontFamily="var(--font-display)">{year}</text>
      <path d={shape === "round" ? "M28 70 L72 70" : "M30 72 L70 72"} strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  )
}

/** Which of Nadia's pieces go on which page (the stickers take): the Japan chapters and Kyoto */
const STUCK = (c: Chapter): [Sticker, CSSProperties][] => /hirakata/i.test(c.place ?? "") ? [["gate", { left: "4%", top: "38%", "--h": "64px", "--r": "-8deg" } as CSSProperties]]
  : c.place === "Japan" ? [["pagoda", { left: "5%", top: "16%", "--h": "104px", "--r": "-4deg" } as CSSProperties]]
  : c.place === "Kyoto" ? [["kiyomizu", { left: "3%", bottom: "14px", "--h": "46px", "--r": "-3deg" } as CSSProperties], ["tower", { left: "5%", top: "10%", "--h": "84px", "--r": "-6deg" } as CSSProperties]]
  : []

export default function StoryPassport() {
  const { t } = useLang()
  const take = useTake("stamped")
  const chapters = useChapters()
  const meta = useMeta(chapters)
  const stickers = useStickers(take === "stickers")
  const stuck = (c: Chapter) => take === "stickers" ? STUCK(c).map(([k, style]) => stickers[k] && <img key={k} src={stickers[k]} alt={STICKER_ALT[k]} className={`${P}-sticker`} style={style} draggable={false} />) : null
  const page = (s: Stop, i: number, at: number) => {
    let inner
    if (s.kind === "opener") inner = <div className={`${P}-in`}><div className={`${P}-kids`}><KidPrints /></div></div>
    else if (s.kind === "chapter") inner = (
      <div className={`${P}-in`}>
        <Polaroid c={s.c} i={s.n} sizes="(min-width: 1024px) 240px, 52vw" />
        <span className={`${P}-stamp`} style={{ color: INKS[s.n % INKS.length], "--r": `${[-12, 9, -6, 14, -9, 7, -14][s.n % 7]}deg` } as CSSProperties}><Stamp place={s.c.place ?? ""} year={s.c.year} i={s.n} /></span>
        <Words c={s.c} meta={meta(s.c)} />
        {stuck(s.c)}
      </div>
    )
    else inner = (
      <div className={`${P}-in ${P}-map`}>
        <JourneyStop active={at === i} />
        <Hanko />
        {s.c ? <Words c={s.c} meta={meta(s.c)} /> : <h2 className="font-display text-heading">{t.story.kyoto}</h2>}
        {s.c && stuck(s.c)}
      </div>
    )
    return (
      <div className={`${P}-leaf`}>
        <div className={`${P}-face`}>
          {inner}
          <span aria-hidden className={`${P}-holes`}>{Array.from({ length: i + 1 }, (_, k) => <i key={k} />)}</span>
          <span aria-hidden className={`${P}-no`}>{String(i + 1).padStart(2, "0")}</span>
          <span aria-hidden className={`${P}-shade`} />
        </div>
        {/* The back of the page: the stamp's ink coming through, mirrored */}
        <div aria-hidden className={`${P}-back`}>
          {s.kind === "chapter" && <span className={`${P}-ghost`}><Stamp place={s.c.place ?? ""} year={s.c.year} i={s.n} ghost /></span>}
          <span className={`${P}-shade`} />
        </div>
      </div>
    )
  }

  return (
    <div className={P} data-take={take}>
      <style>{css}</style>
      <PageHeader title={t.story.title} lettering="ourStory" />
      <StoryFlow reach={1} render={page}
        stride={(w) => Math.min(w, 460) * 0.9}
        before={<div aria-hidden className={`${P}-book`} style={{ gridArea: "1 / 1" }}><span className={`${P}-cover`} /><span className={`${P}-edges`} /></div>} />
    </div>
  )
}

