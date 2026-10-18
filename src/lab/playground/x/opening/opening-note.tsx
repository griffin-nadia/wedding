import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { Stage } from "../../stage"
import { useTake } from "../../params"
import { art } from "./art"

/**
 * The handwritten "Open your invite" under the sealed envelope, with an arrow drawing on toward it (lab run 19).
 * The words write themselves letter by letter (opacity and a small lift per letter, so only the compositor works);
 * the arrow draws along its own line (a stroke on an 80 px SVG: one tiny repaint per frame, measured in the badge).
 * - arrow-first: the arrow curls up to the envelope, then the words write
 * - words-first: the words write, then a short arrow loops up from their end
 * - one-line: the words, then a small upward arrow after them, on one line
 * The arrow is a stand-in drawn here until Nadia draws hers (docs/lab.md, needs Nadia's art). Reduced motion: both
 * are simply there. The whole note is one real button, named by the words.
 */
const P = "x-on"
// A pen line: a slightly uneven curve and a two-stroke head, as a hand would draw it
const ARROW = "M10 74 C 22 72, 40 66, 50 52 C 58 40, 58 26, 54 12"
const HEAD = "M45 20 C 48 17, 51 14, 54 11 C 56 15, 58 19, 61 22"
const SMALL = "M6 22 C 7 16, 8 10, 9 4 M4 9 C 5.5 7, 7.5 5, 9 3.5 C 10.5 5.5, 12 7, 13.5 8.5"
const css = `
.${P}-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); margin-top: auto; margin-bottom: max(5svh, 24px); }
.${P}-env { width: min(66vw, 260px); filter: drop-shadow(0 18px 22px rgb(var(--tint-shadow) / .3)); pointer-events: none; }
.${P}-note { position: relative; display: grid; justify-items: center; min-height: 44px; padding: var(--space-1) var(--space-4); border-radius: var(--radius-pill);
  color: #fff; outline: 2px solid transparent; outline-offset: 2px; filter: drop-shadow(0 1px 3px rgb(0 0 0 / .5)); }
.${P}-note:focus-visible { outline-color: var(--input-focus); }
.${P}-words { font: 400 calc(var(--type-body-size) * 1.25) / 1.2 var(--font-display); letter-spacing: .01em; white-space: nowrap; }
.${P}-words > span { display: inline-block; opacity: 0; translate: 0 3px; animation: x-on-write 260ms cubic-bezier(.2,.7,.3,1) forwards; animation-delay: calc(var(--start) + var(--i) * 55ms); }
@keyframes x-on-write { to { opacity: 1; translate: 0 0; } }
.${P}-arrow { width: 72px; height: 80px; overflow: visible; }
.${P}-arrow path, .${P}-small path { fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 1; stroke-dashoffset: 1; animation: x-on-draw var(--d) cubic-bezier(.45,.05,.3,1) forwards; animation-delay: var(--start); }
.${P}-arrow path + path, .${P}-small path + path { animation-delay: calc(var(--start) + var(--d)); --d: 220ms; }
@keyframes x-on-draw { to { stroke-dashoffset: 0; } }
.${P}-small { display: inline-block; width: 16px; height: 26px; margin-left: 6px; vertical-align: -2px; overflow: visible; }
.${P}-row { display: inline-flex; align-items: flex-end; }
@media (prefers-reduced-motion: reduce) {
  .${P}-words > span { animation: none; opacity: 1; translate: none; }
  .${P}-arrow path, .${P}-small path { animation: none; stroke-dashoffset: 0; }
}
`
function Words({ text, start }: { text: string; start: number }) {
  return <span aria-hidden className={`${P}-words`}>{[...text].map((c, i) => <span key={i} style={{ ["--i" as string]: i, ["--start" as string]: `${start}ms` }}>{c === " " ? "\u00a0" : c}</span>)}</span>
}
function Arrow({ start, d = 700 }: { start: number; d?: number }) {
  return (
    <svg aria-hidden className={`${P}-arrow`} viewBox="0 0 72 80" style={{ ["--start" as string]: `${start}ms`, ["--d" as string]: `${d}ms` }}>
      <path d={ARROW} pathLength={1} /><path d={HEAD} pathLength={1} style={{ ["--start" as string]: `${start}ms` }} />
    </svg>
  )
}

export default function OpeningNote() {
  const take = useTake("arrow-first")
  const { t } = useLang()
  const { household } = useHousehold()
  const first = household?.guests.filter((g) => !g.plusOne).map((g) => g.firstName).join(" & ") ?? ""
  const text = t.letter.note
  const write = text.length * 55 + 260
  return (
    <Stage photo hint="The note under the sealed envelope. The arrow is a stand-in until Nadia draws hers.">
      <style>{css}</style>
      <div className={`${P}-wrap`}>
        <img className={`${P}-env`} src={art("closed")} alt="" draggable={false} />
        <button type="button" className={`${P}-note`} aria-label={t.letter.openLabel(first)}>
          {take === "arrow-first" && <><Arrow start={300} /><Words text={text} start={1200} /></>}
          {take === "words-first" && <><Arrow start={300 + write} d={520} /><Words text={text} start={300} /></>}
          {take === "one-line" && (
            <span className={`${P}-row`}>
              <Words text={text} start={300} />
              <svg aria-hidden className={`${P}-small`} viewBox="0 0 16 26" style={{ ["--start" as string]: `${300 + write}ms`, ["--d" as string]: "320ms" }}><path d={SMALL} pathLength={1} /></svg>
            </span>
          )}
        </button>
      </div>
    </Stage>
  )
}
