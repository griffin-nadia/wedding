import { useEffect, useRef, useState } from "react"
import { config } from "@/lib/config"
import { cn } from "@/lib/utils"

type Parts = { months: number; days: number; hours: number; mins: number; secs: number }

function partsAt(now: Date): Parts {
  const end = new Date(config.weddingStart)
  if (now >= end) return { months: 0, days: 0, hours: 0, mins: 0, secs: 0 }
  const jst = (d: Date) => new Date(d.getTime() + 9 * 3_600_000)
  const a = jst(now), b = jst(end)
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  const step = new Date(a)
  step.setUTCMonth(a.getUTCMonth() + months)
  if (step > b) { months--; step.setUTCMonth(a.getUTCMonth() + months) }
  const rest = b.getTime() - step.getTime()
  return {
    months, days: Math.floor(rest / 86_400_000), hours: Math.floor((rest % 86_400_000) / 3_600_000),
    mins: Math.floor((rest % 3_600_000) / 60_000), secs: Math.floor((rest % 60_000) / 1000),
  }
}

/** "1 year and 11 days to go": a calm sentence for screen readers (no ticking). */
function sentence(p: Parts) {
  const y = Math.floor(p.months / 12), m = p.months % 12
  const bits = [y && `${y} year${y > 1 ? "s" : ""}`, m && `${m} month${m > 1 ? "s" : ""}`, p.days && `${p.days} day${p.days > 1 ? "s" : ""}`].filter(Boolean) as string[]
  if (!bits.length) return "Today's the day"
  return `${bits.length > 1 ? `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}` : bits[0]} to go`
}

/** One digit that rolls when it changes: the old one slides up and fades, the new one rises in. */
function Digit({ d }: { d: string }) {
  const [prev, setPrev] = useState(d)
  const [cur, setCur] = useState(d)
  const [n, setN] = useState(0)
  if (d !== cur) { setPrev(cur); setCur(d); setN((x) => x + 1) }
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-top">
      {n > 0 && <span key={`o${n}`} className="digit-out absolute inset-0 text-center">{prev}</span>}
      <span key={`i${n}`} className={cn("absolute inset-0 text-center", n > 0 && "digit-in")}>{cur}</span>
    </span>
  )
}

type Units = { months: string; days: string; hours: string; mins: string; secs: string; years: string }
type Words = { until: string; tomorrow: string; today: string; married: string; andCounting: string; localTitle: (t: string) => string }

/** One tile: tabular numerals; the seconds tile is tinted (and glows softly in Lantern mode). */
export function CountdownTile({ value, unit, ticking = false, pad = 2 }: { value: number; unit: string; ticking?: boolean; pad?: number }) {
  return (
    <div className={cn("countdown-tile flex min-w-0 flex-col items-center gap-2 rounded-md border py-4", ticking && "countdown-secs")}>
      <span className="numerals text-(length:--type-display-numerals-size) leading-(--type-display-numerals-leading)">
        {String(value).padStart(pad, "0").split("").map((c, i) => <Digit key={i} d={c} />)}
      </span>
      <span className="label-caps text-muted-foreground">{unit}</span>
    </div>
  )
}

/**
 * Live countdown to the ceremony (Japan time), to the second, paused when the tab is hidden.
 * Units drop off as the day gets close (no months under a month, hours only on the last day).
 * Tiles are aria-hidden; screen readers get one calm sentence that never ticks.
 */
export function Countdown({ units, words, kyotoLabel, localTime }: { units: Units; words: Words; kyotoLabel: (t: string) => string; localTime?: string | null }) {
  const [now, setNow] = useState(() => new Date())
  const raf = useRef(0)
  useEffect(() => {
    let timer = 0
    const tick = () => {
      setNow(new Date())
      timer = window.setTimeout(() => { raf.current = requestAnimationFrame(tick) }, 1000 - (Date.now() % 1000) + 5)
    }
    const stop = () => { clearTimeout(timer); cancelAnimationFrame(raf.current) }
    const vis = () => (document.hidden ? stop() : (stop(), tick()))
    tick()
    document.addEventListener("visibilitychange", vis)
    return () => { stop(); document.removeEventListener("visibilitychange", vis) }
  }, [])
  const end = new Date(config.weddingStart)
  const kyoto = now.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Tokyo" }).toLowerCase()
  const jstDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })

  // After the wedding: years and days married
  if (now >= end) {
    const days = Math.floor((now.getTime() - end.getTime()) / 86_400_000)
    return (
      <div className="space-y-4">
        <p className="heading">{words.married}</p>
        <div aria-hidden className="mx-auto grid max-w-xs grid-cols-2 gap-3">
          <CountdownTile value={Math.floor(days / 365)} unit={units.years} pad={1} />
          <CountdownTile value={days % 365} unit={units.days} pad={1} />
        </div>
        <p className="hand">{words.andCounting}</p>
      </div>
    )
  }
  const p = partsAt(now)
  const lastDay = end.getTime() - now.getTime() < 86_400_000
  const today = jstDay(now) === jstDay(end)
  const tiles = ([["months", p.months], ["days", p.days], ["hours", p.hours], ["mins", p.mins], ["secs", p.secs]] as const)
    .filter(([k, v]) => (k === "months" ? v > 0 && !lastDay : k === "days" ? !lastDay && (v > 0 || p.months > 0) : true))
  return (
    <div className="space-y-4" title={localTime ? words.localTitle(localTime) : undefined}>
      {(today || lastDay) && <p className="heading">{today ? words.today : words.tomorrow}</p>}
      <p className="sr-only" aria-live="off">{sentence(p)}</p>
      <div aria-hidden className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
        {tiles.map(([k, v]) => <CountdownTile key={k} value={v} unit={units[k]} ticking={k === "secs"} pad={k === "months" ? 1 : 2} />)}
      </div>
      <p>{words.until}</p>
      <p className="hand">{kyotoLabel(kyoto)}</p>
    </div>
  )
}
