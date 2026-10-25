export type Parts = { months: number; days: number; hours: number; mins: number; secs: number }

/**
 * Whole months, then days and the time left, from now to the ceremony (`end`), counted on Japan's calendar. A month
 * from the 31st lands on the last day of a shorter month (31 Jan + 1 month = 28 Feb). Kept free of imports so tests
 * run it under plain Node.
 */
export function partsAt(now: Date, end: Date): Parts {
  if (now >= end) return { months: 0, days: 0, hours: 0, mins: 0, secs: 0 }
  const jst = (d: Date) => new Date(d.getTime() + 9 * 3_600_000)
  const a = jst(now), b = jst(end)
  // Always counted from `a` itself (run 19: stepping a date that had already moved a year read "-340 days")
  const plus = (n: number) => {
    const y = a.getUTCFullYear(), m = a.getUTCMonth() + n
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    return new Date(Date.UTC(y, m, Math.min(a.getUTCDate(), last), a.getUTCHours(), a.getUTCMinutes(), a.getUTCSeconds(), a.getUTCMilliseconds()))
  }
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  while (months > 0 && plus(months) > b) months--
  const rest = b.getTime() - plus(months).getTime()
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

/** The same line in Japanese (run 27: the Japanese site read it in English): "あと11か月と19日". */
export function sentenceJa(p: Parts) {
  const y = Math.floor(p.months / 12), m = p.months % 12
  const bits = [y && `${y}年`, m && `${m}か月`, p.days && `${p.days}日`].filter(Boolean) as string[]
  if (!bits.length) return "今日がその日です"
  return `あと${bits.join("と")}`
}
