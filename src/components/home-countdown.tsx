import { useEffect, useState } from "react"
import { partsAt, sentence } from "@/components/countdown"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/**
 * Home's countdown (v3 Q6): a row of five paper tiles under the card, outside the letter. Oranienbaum
 * numerals, Inter labels, the seconds tile ticking; no heading, no sentence on screen (screen readers get
 * one calm line instead of a ticking number). Stops while the tab is hidden; still under reduced motion.
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
  const p = partsAt(now)
  const u = t.countdownMore.short
  const tiles: [number, string][] = [[p.months, u.months], [p.days, u.days], [p.hours, u.hours], [p.mins, u.mins], [p.secs, u.secs]]
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
