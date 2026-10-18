import { useState } from "react"
import { Photo } from "@/components/photo"
import { STORY_PLAN } from "@/content/story-plan"
import { useTake } from "../../params"

/**
 * Our story's prints, three ways to hold them (lab run 19). Their photos and the planner's chapters (title, year,
 * place: their working words), nothing invented.
 * - scrapbook: a spread, each print held its own way: washi tape (two colours, its own length and angle), photo
 *   corners, or nothing, overlapping a little as if laid by hand
 * - polaroid: each print in an instant-film frame, the chapter written under it in a drawn hand with a pen underline
 * - linen: plain prints with thin white borders laid on a linen cloth, the weave showing in their shadows
 * Tap a print to lift it (a transform and its shadow only). Seeded, so the layout is the same every time. Reduced
 * motion: the lift is instant. Both themes from the tokens; the linen dims under the lamp in Lantern.
 */
const P = "x-sp"
// One seed per print: each gets its own lean, fastening and tape (stable, never random per visit)
const rnd = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
const css = `
.${P} { width: 100%; display: flex; flex-direction: column; gap: var(--space-4); }
.${P}-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-5) var(--space-4); padding: var(--space-4) var(--space-2); }
@media (min-width: 768px) { .${P}-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.${P}-print { position: relative; display: block; width: 100%; padding: 0; border: 0; background: none; text-align: left; rotate: var(--lean); translate: var(--dx) var(--dy);
  transition: transform var(--duration-base) var(--ease-paper), box-shadow var(--duration-base) var(--ease-paper); border-radius: 2px; outline: 2px solid transparent; outline-offset: 4px; }
.${P}-print:focus-visible { outline-color: var(--input-focus); }
.${P}-print[aria-pressed="true"] { transform: scale(1.06) translateY(-6px); z-index: 3; }
.${P}-paper { display: block; background: var(--brand-paper-bright, #fffaf2); padding: 5px 5px 7px;
  box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .16), 0 1px 2px rgb(var(--tint-shadow) / .14), 0 10px 22px -12px rgb(var(--tint-shadow) / .4); transition: box-shadow var(--duration-base) var(--ease-paper); }
.${P}-print[aria-pressed="true"] .${P}-paper { box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .16), 0 4px 8px rgb(var(--tint-shadow) / .16), 0 26px 40px -16px rgb(var(--tint-shadow) / .5); }
.${P}-paper figure > div { aspect-ratio: 3 / 4 !important; }
/* Washi tape: translucent, a torn end each side, its own length and turn */
.${P}-tape { position: absolute; z-index: 2; top: -10px; left: var(--tx); width: var(--tw); height: 20px; translate: -50% 0; rotate: var(--tt); opacity: .82;
  background: var(--tape); mask: linear-gradient(90deg, transparent 0, #000 3px calc(100% - 3px), transparent 100%); box-shadow: 0 1px 1px rgb(var(--tint-shadow) / .1); }
.${P}-tape[data-c="0"] { --tape: color-mix(in oklab, var(--brand-hachimitsu) 60%, white); }
.${P}-tape[data-c="1"] { --tape: color-mix(in oklab, var(--brand-sabi) 45%, white); }
/* Photo corners: four small dark paper triangles over the print's corners */
.${P}-corner { position: absolute; z-index: 2; width: 18px; height: 18px; background: color-mix(in oklab, var(--ink) 82%, transparent); }
.${P}-corner:nth-of-type(1) { left: -3px; top: -3px; clip-path: polygon(0 0, 100% 0, 0 100%); }
.${P}-corner:nth-of-type(2) { right: -3px; top: -3px; clip-path: polygon(0 0, 100% 0, 100% 100%); }
.${P}-corner:nth-of-type(3) { left: -3px; bottom: -3px; clip-path: polygon(0 0, 0 100%, 100% 100%); }
.${P}-corner:nth-of-type(4) { right: -3px; bottom: -3px; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
.${P}-label { display: block; margin-top: var(--space-2); font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink-soft); }
.${P}-label b { font-weight: 500; color: var(--ink); }
/* Polaroid: the deep bottom edge, the chapter in a drawn hand */
[data-take="polaroid"] .${P}-paper { padding: 8px 8px 0; }
.${P}-hand { display: block; padding: 8px 4px 10px; text-align: center; rotate: var(--hand); color: #3b2a1e; font: 400 calc(var(--type-small-size) * 1.12) / 1.15 var(--font-display); }
.${P}-hand svg { display: block; width: 70%; height: 6px; margin: 3px auto 0; overflow: visible; }
.${P}-hand path { fill: none; stroke: #8a3b26; stroke-width: 1.4; stroke-linecap: round; opacity: .8; }
.${P}-hand small { display: block; margin-top: 2px; font: 400 11px / 1 var(--font-label); color: #6b5442; letter-spacing: .04em; }
/* Linen: a woven cloth under the prints, its threads in two directions, and the prints' shadows sitting in the weave */
[data-take="linen"] .${P}-grid { border-radius: var(--radius-section); padding: var(--space-6) var(--space-4);
  background:
    repeating-linear-gradient(0deg, rgb(255 255 255 / .07) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, rgb(90 70 50 / .07) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(0deg, rgb(90 70 50 / .05) 0 2px, transparent 2px 7px),
    linear-gradient(var(--linen-a, #ddd3bf), var(--linen-b, #d3c8b2));
  box-shadow: inset 0 0 0 1px rgb(var(--tint-shadow) / .08), inset 0 20px 40px -30px rgb(var(--tint-shadow) / .35); }
[data-theme="lantern"] [data-take="linen"] .${P}-grid { --linen-a: #4b4235; --linen-b: #40382c; }
[data-take="linen"] .${P}-paper { padding: 4px; box-shadow: 0 1px 1px rgb(40 30 20 / .22), 0 8px 16px -8px rgb(40 30 20 / .45); }
@media (prefers-reduced-motion: reduce) { .${P}-print, .${P}-paper { transition: none; } }
`
const chapters = STORY_PLAN.filter((c) => c.photo)
const UNDER = ["M2 3 C 20 1, 40 5, 60 2 S 90 4, 98 2", "M3 4 C 25 2, 45 1, 65 4 S 88 3, 97 1", "M1 2 C 18 4, 42 3, 62 1 S 86 5, 99 3"]

export default function StoryPrints() {
  const take = useTake("scrapbook")
  const [lifted, setLifted] = useState<string | null>(null)
  return (
    <div className={P} data-take={take}>
      <style>{css}</style>
      <ul className={`${P}-grid`}>
        {chapters.map((c, i) => {
          // scrapbook: tape on about half, corners on a third, the rest plain (tape never on the same print twice in a row)
          const r = rnd(i, 1), hold = take !== "scrapbook" ? "none" : r < 0.5 ? "tape" : r < 0.8 ? "corners" : "none"
          const lean = take === "linen" ? (rnd(i, 2) - 0.5) * 3 : (rnd(i, 2) - 0.5) * 6
          const style = { ["--lean" as string]: `${lean.toFixed(2)}deg`, ["--dx" as string]: take === "scrapbook" ? `${((rnd(i, 3) - 0.5) * 10).toFixed(1)}px` : "0px", ["--dy" as string]: `${((rnd(i, 4) - 0.5) * (take === "scrapbook" ? 16 : 6)).toFixed(1)}px` }
          return (
            <li key={c.key}>
              <button type="button" className={`${P}-print`} style={style} aria-pressed={lifted === c.key} onClick={() => setLifted(lifted === c.key ? null : c.key)}
                aria-label={`${c.title}, ${c.year}`}>
                {hold === "tape" && <span aria-hidden className={`${P}-tape`} data-c={i % 2} style={{ ["--tx" as string]: `${30 + rnd(i, 5) * 40}%`, ["--tw" as string]: `${32 + rnd(i, 6) * 24}%`, ["--tt" as string]: `${((rnd(i, 7) - 0.5) * 14).toFixed(1)}deg` }} />}
                {hold === "corners" && <><span aria-hidden className={`${P}-corner`} /><span aria-hidden className={`${P}-corner`} /><span aria-hidden className={`${P}-corner`} /><span aria-hidden className={`${P}-corner`} /></>}
                <span className={`${P}-paper`}>
                  <Photo name={c.photo!} treatment="print" sizes="(min-width: 768px) 200px, 45vw" />
                  {take === "polaroid" && (
                    <span aria-hidden className={`${P}-hand`} style={{ ["--hand" as string]: `${((rnd(i, 8) - 0.5) * 3).toFixed(1)}deg` }}>
                      {c.title}
                      <svg viewBox="0 0 100 6" preserveAspectRatio="none"><path d={UNDER[i % 3]} /></svg>
                      <small>{c.year}</small>
                    </span>
                  )}
                </span>
                {take !== "polaroid" && <span className={`${P}-label`} aria-hidden><b>{c.year}</b> · {c.title}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
