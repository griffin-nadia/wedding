const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2027-10-12" → "Tue 12 Oct". */
export function fmtShort(ymd: string) {
  return fmtDay(ymd).replace(/ \d{4}$/, "")
}

/** "2027-10-12" → "Tue 12 Oct 2027". Calendar dates only, so no time zone surprises. */
export function fmtDay(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return ymd
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "Tue 12 Oct 2027 to Sat 16 Oct 2027"; with one half set, "From Fri 10 Sep 2027, leaving date to come" (or the reverse). */
export function fmtStay(arrival: string, departure: string, line: { both: (a: string, d: string) => string; from: (a: string) => string; until: (d: string) => string }) {
  if (arrival && departure) return line.both(fmtDay(arrival), fmtDay(departure))
  return arrival ? line.from(fmtDay(arrival)) : line.until(fmtDay(departure))
}
