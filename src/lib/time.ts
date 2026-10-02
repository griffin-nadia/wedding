import { config } from "./config"

export function countdown(now = new Date()) {
  const ms = Math.max(0, new Date(config.weddingStart).getTime() - now.getTime())
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  return { days, hours, mins }
}

/** "1:00 pm in Melbourne" for a Japan-time HH:MM on the wedding day. */
export function homeTime(jstTime: string, timeZone = config.homeTimeZone) {
  const [h, m] = jstTime.split(":").map(Number)
  const hour24 = h < 9 ? h + 12 : h // schedule uses 12-hour style after noon (1:00 = 13:00)
  const d = new Date(`2027-10-15T${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+09:00`)
  const city = timeZone.split("/")[1]?.replace("_", " ")
  return `${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone })} in ${city}`
}

export function isLocked(now = new Date()) {
  return now > new Date(`${config.changesLock}T23:59:59+09:00`)
}
