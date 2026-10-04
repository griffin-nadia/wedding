import { config } from "./config"
import { DATES } from "./wedding-dates"

export function countdown(now = new Date()) {
  const ms = Math.max(0, new Date(config.weddingStart).getTime() - now.getTime())
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  return { days, hours, mins }
}

/** "13:00" (Japan time on the day) → "1:00 pm" (Japanese keeps the 24-hour "13:00"). */
export function jstLabel(hhmm: string, lang: "en" | "ja" = "en") {
  if (lang === "ja") return hhmm
  const [h, m] = hhmm.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`
}

/**
 * The same moment on the guest's own clock: { time, day, city } for the words to format ("7:00 pm Thu in
 * Vancouver", or 「Vancouverでは19:00（木）」). Null when the device is already on Japan
 * time, so the line can be hidden. The city comes from the device's own zone, never the sheet; zones with
 * no city (UTC, Etc/GMT+5) give city "".
 */
export function localTimeParts(hhmm: string, lang: "en" | "ja" = "en", timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const d = new Date(`${DATES.ceremonyDay}T${hhmm}:00+09:00`)
  const fmt = (tz: string) => d.toLocaleString("en-AU", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })
  if (!timeZone || fmt(timeZone) === fmt("Asia/Tokyo")) return null
  const time = lang === "ja"
    ? d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone })
    : d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).toLowerCase()
  const day = d.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-AU", { weekday: "short", timeZone })
  const city = timeZone.includes("/") && !timeZone.startsWith("Etc/") ? timeZone.split("/").pop()!.replace(/_/g, " ") : ""
  return { time, day, city }
}

/** English line, kept for anything that doesn't go through the words file. */
export function localTime(hhmm: string, timeZone?: string) {
  const p = localTimeParts(hhmm, "en", timeZone)
  return p && `${p.time} ${p.day} ${p.city ? `in ${p.city}` : "your time"}`
}

export function isLocked(now = new Date()) {
  return now > new Date(`${config.changesLock}T23:59:59+09:00`)
}

/** The time in Kyoto now, e.g. "9:14 pm". */
export function kyotoNow(now = new Date()) {
  return now.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" }).toLowerCase()
}
