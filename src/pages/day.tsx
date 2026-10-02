import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/lang"
import { homeTime } from "@/lib/time"

const mapUrl = "https://www.google.com/maps/search/?api=1&query=The+Sodoh+Higashiyama+Kyoto"

function icsHref() {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//N&G//Wedding//EN", "BEGIN:VEVENT",
    "UID:nadia-griffin-2027@wedding", "DTSTART:20271015T020000Z", "DTEND:20271015T063000Z",
    "SUMMARY:Nadia & Griffin's wedding", "LOCATION:The Sodoh Higashiyama\\, Kyoto",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n")
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

export function DayPage() {
  const { t } = useLang()
  return (
    <div className="max-w-2xl space-y-8 py-6 md:py-16">
      <header className="space-y-2">
        <h1 className="text-4xl md:text-6xl">{t.day.title}</h1>
        <p className="text-body">{t.day.date} · {t.day.venue}</p>
      </header>
      <ol className="relative space-y-6 border-l-2 border-border pl-8">
        {t.day.schedule.map((s, i) => (
          <li key={s.time} className="relative">
            <span className={`absolute -left-[39px] top-1.5 size-3 rounded-full ${i === 0 ? "bg-primary" : "bg-highlight"}`} aria-hidden />
            <p className="font-display text-2xl">{s.time} <span className="font-sans text-base font-bold">{s.label}</span></p>
            <p className="text-sm text-body">{s.where}</p>
            <p className="text-xs text-muted-foreground">{homeTime(s.time)}</p>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">{t.day.japanTime} {t.day.address}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="lg"><a href={icsHref()} download="nadia-griffin-wedding.ics">{t.day.addToCalendar}</a></Button>
        <Button asChild variant="outline" size="lg"><a href={mapUrl} target="_blank" rel="noreferrer">{t.day.openMap}</a></Button>
      </div>
    </div>
  )
}
