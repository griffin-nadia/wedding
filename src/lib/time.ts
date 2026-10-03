import { config } from "./config"
import { DATES } from "./wedding-dates"

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
 * The same moment on the guest's own clock, e.g. "7:00 pm Thu in your time (Vancouver)".
 * Null when their device is already on Japan time, so the line can be hidden.
 */
export function localTime(hhmm: string, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const d = new Date(`${DATES.ceremonyDay}T${hhmm}:00+09:00`)
  const fmt = (tz: string) => d.toLocaleString("en-AU", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })
  if (!timeZone || fmt(timeZone) === fmt("Asia/Tokyo")) return null
  const time = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).toLowerCase()
  const day = d.toLocaleDateString("en-AU", { weekday: "short", timeZone })
  // The city comes from the device's own zone, never the sheet: "in your time (Melbourne)", or just
  // "your time" for zones with no city (UTC, Etc/GMT+5)
  const city = timeZone.includes("/") && !timeZone.startsWith("Etc/") ? timeZone.split("/").pop()!.replace(/_/g, " ") : ""
  return `${time} ${day} ${city ? `in your time (${city})` : "your time"}`
}

export function isLocked(now = new Date()) {
  return now > new Date(`${config.changesLock}T23:59:59+09:00`)
}

/** The time in Kyoto now, e.g. "9:14 pm". */
export function kyotoNow(now = new Date()) {
  return now.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" }).toLowerCase()
}
