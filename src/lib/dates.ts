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

/** "Tue 12 Oct 2027 to Sat 16 Oct 2027", or whichever half is set. */
export function fmtStay(arrival: string, departure: string, notSet: string) {
  return `${arrival ? fmtDay(arrival) : notSet} to ${departure ? fmtDay(departure) : notSet}`
}
