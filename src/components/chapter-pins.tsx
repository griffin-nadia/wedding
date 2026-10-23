import type { CSSProperties, RefObject } from "react"
import { useLang } from "@/lib/lang"
import type { ChapterPin } from "@/lib/journey-names"

/**
 * Run 25: where each chapter happened, as small numbered stamps on the journey map and the globe (the same pins on
 * both): a paper disc with an ink ring and the chapter's number, unlike the guests' line ends (small filled dots) and
 * Kyoto's seal (a filled square). Picked in the lab (journey-chapter-pins: stamp, tag and flag); the stamp won because
 * its number ties the pin to "Chapter 2 of 7" on the stop and it stays readable at 20px without covering the lines.
 * A pin moved off a taken spot (nudge) keeps a hairline back to the real place. Tapping one goes to that chapter's stop.
 * The globe moves them each frame (--x, --y in px); the flat map places them in % of its box (at).
 * Run 26: each pin carries the kotobuki stamp: the hanko's own hand-cut vermilion rims round the number, and a tiny
 * 寿 seal stamped on its shoulder, so a pin reads as a stamp in their passport, never as a guest's line end.
 */
/** The hanko's hand-cut rims (components/hanko.tsx, the same seeds), viewBox 0 0 100 100. Copied rather than shared:
 *  importing them tied the story's first load to the reply sheet's chunk (Our story's LCP 2.29 s to 2.58 s, run 26). */
const HANKO_RIM = (() => {
  let seed = 0
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const rim = (r: number, wobble: number, s: number) => {
    seed = s
    const pts: string[] = []
    for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2, rr = r + (rnd() - 0.5) * wobble; pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)} ${(50 + rr * Math.sin(a)).toFixed(2)}`) }
    return `M${pts.join("L")}Z`
  }
  return { outer: rim(45, 1.6, 7), inner: rim(38.5, 1.2, 19) }
})()

export function ChapterPins({ pins, onPin, refs, at, className }: {
  pins: ChapterPin[]; onPin?: (key: string) => void; refs?: RefObject<(HTMLSpanElement | null)[]>; at?: (p: ChapterPin) => [number, number]; className?: string
}) {
  const { t } = useLang()
  if (!pins.length) return null
  return (
    <div className={className ? `chapter-pins ${className}` : "chapter-pins"}>
      {pins.map((p, i) => {
        const [dx, dy] = p.nudge, len = Math.hypot(dx, dy)
        const style = { "--dx": `${dx}px`, "--dy": `${dy}px`, ...(at ? { "--x": `${at(p)[0]}%`, "--y": `${at(p)[1]}%` } : {}) } as CSSProperties
        return (
          <span key={p.key} ref={(el) => { if (refs) refs.current[i] = el }} className="chapter-pin-at" style={style}>
            {len > 0 && <span aria-hidden className="chapter-pin-leader" style={{ width: len, rotate: `${Math.atan2(dy, dx)}rad` }} />}
            <button type="button" className="chapter-pin" aria-label={t.journey.pin(p.n, p.title, p.place)} onClick={() => onPin?.(p.key)}>
              <svg aria-hidden viewBox="0 0 100 100" className="chapter-pin-rim" fill="none"><path d={HANKO_RIM.outer} stroke="currentColor" strokeWidth="7" /><path d={HANKO_RIM.inner} stroke="currentColor" strokeWidth="3" /></svg>
              <span className="chapter-pin-n">{p.n || ""}</span>
              <span aria-hidden className="chapter-pin-seal">寿</span>
            </button>
          </span>
        )
      })}
    </div>
  )
}
