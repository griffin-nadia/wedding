import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { config } from "@/lib/config"
import { partsAt, sentence } from "@/lib/countdown-parts"
import { useLang } from "@/lib/lang"
import { useOption } from "@/lib/options"
import { useContent } from "@/lib/content"
import { cn } from "@/lib/utils"

// The strip and tiles are Options alternatives, so they load only when picked
const CountAlt = lazy(() => import("@/components/count-alt"))

/** A number that flips over (top half down) when it changes; still on first paint and under reduced motion. */
function Flip({ value }: { value: string }) {
  const first = useRef(value)
  return <span key={value} className={cn("count-box-num numerals", value !== first.current && "count-flip")}>{value}</span>
}

/**
 * Home's countdown (v3 S, Jehan's notes): fewer numbers, calmer. Types, switchable in the crew Options panel:
 * - boxes (A, ships): inside the letter, so Home is one card. Days, hours and minutes in paper boxes; a box
 *   flips only when its number changes, so mostly once a minute.
 * - boxes with seconds, days only (one box): also inside the letter.
 * - strip and tiles: the earlier under-the-card versions.
 * Screen readers get one calm line, not a ticking number. Stops while the tab is hidden.
 */
export function HomeCountdown({ placement = "outside" }: { placement?: "inside" | "outside" }) {
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
  const style = useOption("count") ?? "boxes"
  const p = partsAt(now)
  const inside = style === "boxes" || style === "boxes-nosecs" || style === "days"
  if (mode === "keepsake" || inside !== (placement === "inside")) return null
  if (inside) {
    const ms = Math.max(0, new Date(config.weddingStart).getTime() - now.getTime())
    const days = Math.floor(ms / 86_400_000), hours = Math.floor((ms % 86_400_000) / 3_600_000), mins = Math.floor((ms % 3_600_000) / 60_000), secs = Math.floor((ms % 60_000) / 1000)
    const u = t.countdownMore.short
    const boxes: [string, string][] = style === "days" ? [[String(days), u.days]]
      : [[String(days), u.days], [String(hours).padStart(2, "0"), u.hours], [String(mins).padStart(2, "0"), u.mins], ...(style !== "boxes-nosecs" ? [[String(secs).padStart(2, "0"), u.secs] as [string, string]] : [])]
    return (
      <section className="count-boxes" aria-label={t.countdownMore.until}>
        <p className="sr-only">{sentence(p)}</p>
        <div aria-hidden className="count-boxes-row">
          <ol className="count-boxes-list">
            {boxes.map(([v, unit]) => (
              <li key={unit} className="count-box"><Flip value={v} /><span className="count-box-unit">{unit}</span></li>
            ))}
          </ol>
          <p className="count-boxes-caption">{t.countdownMore.until}</p>
        </div>
      </section>
    )
  }
  return <Suspense><CountAlt style={style} now={now} /></Suspense>
}
