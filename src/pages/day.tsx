import { useEffect, useState } from "react"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Reveal } from "@/components/reveal"
import { useLang } from "@/lib/lang"
import { jstLabel, kyotoNow, localTime } from "@/lib/time"

/**
 * On the wedding day only (Japan time): where "now" sits between the schedule rows, 0 to 1.
 * ?now=2027-10-15T12:30 mocks the time for checking.
 */
function nowOnTheDay(real: Date, times: string[]) {
  const mock = new URLSearchParams(location.search).get("now")
  const now = mock ? new Date(`${mock}:00+09:00`) : real
  if (now.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }) !== "2027-10-15") return null
  const at = (hhmm: string) => new Date(`2027-10-15T${hhmm}:00+09:00`).getTime()
  const start = at(times[0]), end = at("15:30")
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)))
}

/** The day: title, one line, the timeline (a line that fills as you scroll, a Now marker on the day), local-time note. */
export function DayPage() {
  const { t } = useLang()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const nowAt = nowOnTheDay(now, t.day.schedule.map((x) => x.time))
  return (
    <>
      <header className="flex flex-col gap-4">
        <p className="label-caps text-muted-foreground">{t.day.date} · {t.day.venue}</p>
        <h1 className="heading">{t.day.title}</h1>
        <p>{t.day.venueFacts}</p>
      </header>

      <ol className="relative flex flex-col gap-6 pl-8" aria-label={t.day.timelineLabel}>
        <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-0.5 rounded-full bg-border" />
        <span aria-hidden className="timeline-fill absolute top-2 bottom-2 left-[7px] w-0.5 origin-top rounded-full bg-leaf" />
        {nowAt !== null && (
          <li aria-label={t.day.now} className="absolute left-0 z-10 flex items-center gap-2" style={{ top: `calc(${nowAt * 100}% - 8px)` }}>
            <span aria-hidden className="size-4 rounded-full bg-primary ring-4 ring-background" />
            <span className="label-caps rounded-full bg-primary px-2 py-1 text-primary-foreground">{t.day.now}</span>
          </li>
        )}
        {t.day.schedule.map((s) => (
          <Reveal key={s.time} as="li" className="relative">
            <span aria-hidden className="absolute top-2 -left-8 size-4 rounded-full border-2 border-leaf bg-background" />
            <p className="font-semibold text-foreground">{jstLabel(s.time)} · {s.label}</p>
            <p>{s.where}</p>
            {localTime(s.time) && <p className="text-sm text-muted-foreground">{localTime(s.time)}</p>}
          </Reveal>
        ))}
      </ol>

      <p className="text-sm text-muted-foreground">{t.day.japanTime} <span className="no-print">{t.day.kyotoNow(kyotoNow(now))}</span></p>
      <p>{t.day.rainPlan}</p>
      <div className="no-print flex flex-col gap-4">
        <AddToCalendar />
        <button type="button" className="btn-text min-h-11 self-start" onClick={() => window.print()}>{t.day.print}</button>
      </div>
    </>
  )
}
