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
 */
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
            <button type="button" className="chapter-pin" aria-label={t.journey.pin(p.n, p.title, p.place)} onClick={() => onPin?.(p.key)}>{p.n || ""}</button>
          </span>
        )
      })}
    </div>
  )
}
