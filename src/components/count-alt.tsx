import { partsAt, sentence } from "@/lib/countdown-parts"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/** The countdown's earlier under-the-card types (strip, tiles), for the crew Options panel. */
export default function CountAlt({ style, now }: { style: string; now: Date }) {
  const { t } = useLang()
  const p = partsAt(now)
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
