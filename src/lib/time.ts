import { config } from "./config"

export function countdown(now = new Date()) {
  const ms = Math.max(0, new Date(config.weddingStart).getTime() - now.getTime())
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  return { days, hours, mins }
}

/** "13:00" (Japan time on the day) → "1:00 pm". */
export function jstLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`
}

/**
 * The same moment on the guest's own clock, e.g. "7:00 pm Thu in Vancouver".
 * Null when their device is already on Japan time, so the line can be hidden.
 */
export function localTime(hhmm: string, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const d = new Date(`2027-10-15T${hhmm}:00+09:00`)
  const fmt = (tz: string) => d.toLocaleString("en-AU", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })
  if (!timeZone || fmt(timeZone) === fmt("Asia/Tokyo")) return null
  const time = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).toLowerCase()
  const day = d.toLocaleDateString("en-AU", { weekday: "short", timeZone })
  const city = timeZone.split("/").pop()!.replace(/_/g, " ")
  return `${time} ${day} in ${city}`
}

export function isLocked(now = new Date()) {
  return now > new Date(`${config.changesLock}T23:59:59+09:00`)
}

/** Months, days, hours and minutes to the ceremony (calendar months, Japan time). */
export function countdownParts(now = new Date()) {
  const end = new Date(config.weddingStart)
  if (now >= end) return { months: 0, days: 0, hours: 0, mins: 0 }
  const jst = (d: Date) => new Date(d.getTime() + 9 * 3_600_000) // read as UTC fields = Japan time
  const a = jst(now), b = jst(end)
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  const step = new Date(a)
  step.setUTCMonth(a.getUTCMonth() + months)
  if (step > b) { months--; step.setUTCMonth(a.getUTCMonth() + months) }
  const rest = b.getTime() - step.getTime()
  return {
    months,
    days: Math.floor(rest / 86_400_000),
    hours: Math.floor((rest % 86_400_000) / 3_600_000),
    mins: Math.floor((rest % 3_600_000) / 60_000),
  }
}

/** The time in Kyoto now, e.g. "9:14 pm". */
export function kyotoNow(now = new Date()) {
  return now.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" }).toLowerCase()
}
