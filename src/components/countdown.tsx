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

/** Live countdown to the ceremony with seconds, aligned to the second, paused when the tab is hidden. */
export function Countdown({ units, kyotoLabel }: { units: Record<keyof Parts, string>; kyotoLabel: (t: string) => string }) {
  const [now, setNow] = useState(() => new Date())
  const raf = useRef(0)
  useEffect(() => {
    let timer = 0
    const tick = () => {
      setNow(new Date())
      timer = window.setTimeout(() => { raf.current = requestAnimationFrame(tick) }, 1000 - (Date.now() % 1000) + 5)
    }
    const start = () => { stop(); tick() }
    const stop = () => { clearTimeout(timer); cancelAnimationFrame(raf.current) }
    const vis = () => (document.hidden ? stop() : start())
    start()
    document.addEventListener("visibilitychange", vis)
    return () => { stop(); document.removeEventListener("visibilitychange", vis) }
  }, [])
  const p = partsAt(now)
  const kyoto = now.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Tokyo" }).toLowerCase()
  return (
    <div className="space-y-4">
      <p className="sr-only" aria-live="off">{sentence(p)}</p>
      <div aria-hidden className="grid grid-cols-5 gap-2 sm:gap-3">
        {(["months", "days", "hours", "mins", "secs"] as const).map((k) => (
          <div key={k} className={cn("flex flex-col items-center gap-2 rounded-[1.25rem] py-4 shadow-paper ring-1 ring-border", k === "secs" ? "bg-secondary" : "bg-card")}>
            <span className="numerals text-[clamp(2rem,1.4rem+3vw,3.25rem)] leading-none">
              {String(p[k]).padStart(k === "months" ? 1 : 2, "0").split("").map((c, i) => <Digit key={i} d={c} />)}
            </span>
            <span className="label-caps text-muted-foreground">{units[k]}</span>
          </div>
        ))}
      </div>
      <p className="hand text-sm text-body">{kyotoLabel(kyoto)}</p>
    </div>
  )
}
