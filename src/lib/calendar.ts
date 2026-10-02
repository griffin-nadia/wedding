// Add to calendar and the map link, shared by Home and The day.

const address = "The Sodoh Higashiyama, 366 Yasaka Kamimachi, Higashiyama Ward, Kyoto 605-0827, Japan"

export const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n")

const title = "Nadia & Griffin's wedding"
const details = `Ceremony 11:00 am in the garden (Japan time).\nMap: ${mapUrl}`

/** Google Calendar's "add event" page, prefilled. Opens Google only when the guest taps it. */
export const googleCalendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  `&text=${encodeURIComponent(title)}&dates=20271015T020000Z/20271015T063000Z` +
  `&location=${encodeURIComponent(address)}&details=${encodeURIComponent(details)}&ctz=Asia/Tokyo`

/** An .ics file for the day: 11:00 am to 3:30 pm Japan time, with the venue and map link. */
export function icsHref() {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//N&G//Wedding//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    "UID:nadia-griffin-2027@griffin-nadia.github.io", "DTSTAMP:20261015T000000Z",
    "DTSTART:20271015T020000Z", "DTEND:20271015T063000Z",
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(address)}`,
    `DESCRIPTION:${esc(details)}`,
    `URL:${mapUrl}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n")
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}
