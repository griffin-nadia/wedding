import { useEffect, useState } from "react"
import { partsAt, sentence } from "@/lib/countdown-parts"
import { useLang } from "@/lib/lang"
import { useOption } from "@/lib/options"
import { useContent } from "@/lib/content"
import { cn } from "@/lib/utils"

/**
 * Home's countdown, under the card and outside the letter. A (v3 S): one long narrow paper strip, numerals
 * split by thin colons with the unit under each and a caption saying what it counts (the reference's
 * shape). B (v3 Q6): five paper tiles. Digits sit in fixed-width boxes so nothing wiggles as they change.
 * Screen readers get one calm line, not a ticking number. Stops while the tab is hidden.
 */
export function HomeCountdown() {
  const { t } = useLang()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let id = 0
    const start = () => { clearInterval(id); id = window.setInterval(() => setNow(new Date()), 1000) }
    const vis = () => (document.hidden ? clearInterval(id) : (setNow(new Date()), start()))
    start(); document.addEventListener("visibilitychange", vis)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis) }
  }, [])
  const { mode } = useContent()
  const style = useOption("count")
  const p = partsAt(now)
  if (mode === "keepsake") return null
  const u = t.countdownMore.short
  const tiles: [number, string][] = [[p.months, u.months], [p.days, u.days], [p.hours, u.hours], [p.mins, u.mins], [p.secs, u.secs]]
  if (style !== "tiles") return (
    <div className="home-count">
      <p className="sr-only">{sentence(p)}</p>
      <div aria-hidden className="count-strip">
        <ol className="count-strip-row">
          {tiles.map(([v, unit], i) => (
            <li key={unit} className={cn("count-strip-unit", i === 4 && "count-tile-secs")}>
              {i > 0 && <span className="count-strip-colon">:</span>}
              <span className="count-strip-num numerals"><span className="count-num">{i < 2 ? v : String(v).padStart(2, "0")}</span></span>
              <span className="count-strip-label">{unit}</span>
            </li>
          ))}
        </ol>
        <p className="count-strip-caption">{t.countdownMore.until}</p>
      </div>
    </div>
  )
  return (
    <div className="home-count">
      <p className="sr-only">{sentence(p)}</p>
      <ol aria-hidden className="home-count-row">
        {tiles.map(([v, unit], i) => (
          <li key={unit} className={cn("home-count-tile", i === 4 && "count-tile-secs")}>
            <span className="numerals"><span className="count-num">{i < 2 ? v : String(v).padStart(2, "0")}</span></span>
            <span className="home-count-unit">{unit}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
