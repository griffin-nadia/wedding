import { config } from "@/lib/config"

export type Parts = { months: number; days: number; hours: number; mins: number; secs: number }

export function partsAt(now: Date): Parts {
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
export function sentence(p: Parts) {
  const y = Math.floor(p.months / 12), m = p.months % 12
  const bits = [y && `${y} year${y > 1 ? "s" : ""}`, m && `${m} month${m > 1 ? "s" : ""}`, p.days && `${p.days} day${p.days > 1 ? "s" : ""}`].filter(Boolean) as string[]
  if (!bits.length) return "Today's the day"
  return `${bits.length > 1 ? `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}` : bits[0]} to go`
}

