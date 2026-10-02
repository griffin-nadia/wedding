import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/lang"
import { jstLabel, localTime } from "@/lib/time"
import { mapUrl } from "@/lib/calendar"
import { AddToCalendar } from "@/components/add-to-calendar"

function useKyotoTime() {
  const now = () => new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })
  const [time, setTime] = useState(now)
  useEffect(() => {
    const id = setInterval(() => setTime(now()), 30_000)
    return () => clearInterval(id)
  }, [])
  return time
}

export function DayPage() {
  const { t } = useLang()
  const kyotoNow = useKyotoTime()
  return (
    <div className="max-w-2xl space-y-8 py-6 md:py-16">
      <header className="space-y-2">
        <h1 className="title leaf-rule">{t.day.title}</h1>
        <p className="text-body">{t.day.date} · {t.day.venue}</p>
      </header>
      <ol className="relative space-y-6 border-l-2 border-border pl-8">
        {t.day.schedule.map((s, i) => (
          <li key={s.time} className="relative">
            <span className={`absolute -left-[39px] top-1.5 size-3 rounded-full ${i === 0 ? "bg-primary" : "bg-highlight"}`} aria-hidden />
            <p className="font-display text-2xl">{jstLabel(s.time)} <span className="font-sans text-base font-bold">{s.label}</span></p>
            <p className="text-sm text-body">{s.where}</p>
            {localTime(s.time) && <p className="text-xs text-muted-foreground">{localTime(s.time)}</p>}
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">{t.day.japanTime} {t.day.kyotoNow(kyotoNow)}</p>
      <p className="text-sm text-muted-foreground">{t.day.address}</p>
      <Button asChild variant="outline" size="lg"><a href={mapUrl} target="_blank" rel="noreferrer">{t.day.openMap}</a></Button>
      <AddToCalendar />
    </div>
  )
}
