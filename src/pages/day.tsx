import { useEffect, useRef, useState } from "react"
import { Flower2, UtensilsCrossed, Wine } from "lucide-react"
import { AddToCalendar } from "@/components/add-to-calendar"
import { directionsUrl } from "@/lib/calendar"
import { DATES } from "@/lib/wedding-dates"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { jstLabel, kyotoNow } from "@/lib/time"
import { PageHeader } from "@/components/ui/page-header"

const ICONS = [Flower2, Wine, UtensilsCrossed]

/**
 * On the wedding day only (Japan time): where "now" sits between the schedule rows, 0 to 1.
 * ?now=2027-10-15T12:30 mocks the time for checking.
 */
function nowOnTheDay(real: Date, times: string[]) {
  const mock = new URLSearchParams(location.search).get("now")
  const now = mock ? new Date(`${mock}:00+09:00`) : real
  if (now.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }) !== DATES.ceremonyDay) return null
  const at = (hhmm: string) => new Date(`${DATES.ceremonyDay}T${hhmm}:00+09:00`).getTime()
  const start = at(times[0]), end = at(DATES.endsAt)
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)))
}

/** A time stays on one line ("3:30 pm", 「15:30まで」), so "pm" never sits alone; the word before it may wrap (at 320, "until 3:30 pm" kept together was wider than its column) */
const TIME = /(\d{1,2}:\d{2}(?:\s?[ap]m)?(?:まで|から)?)/i
const keepTimes = (s: string) => s.split(TIME).map((part, k) => (k % 2 ? <span key={k} className="whitespace-nowrap">{part}</span> : part))

function Row({ i, time, label, where, local }: { i: number; time: string; label: string; where: string; local: string | null }) {
  const Icon = ICONS[i] ?? Flower2
  return (
    <li className="timeline-row">
      <p className="timeline-time numerals whitespace-nowrap text-foreground">{time}</p>
      <span aria-hidden className="timeline-icon"><Icon className="size-5" /></span>
      <div className="timeline-text">
        <p className="font-medium text-foreground">{label}</p>
        <p>{keepTimes(where)}</p>
        {local && <p className="text-muted-foreground">{keepTimes(local)}</p>}
      </div>
    </li>
  )
}

/** The timeline: one thin moss line that draws in as you scroll (the only thing that moves); times on the left, what happens on the right. */
function Timeline({ now }: { now: Date }) {
  const { t, lang } = useLang()
  const nowAt = nowOnTheDay(now, t.day.schedule.map((x) => x.time))
  return (
    <ol className="timeline" aria-label={t.day.timelineLabel}>
      <span aria-hidden className="timeline-line" />
      <span aria-hidden className="timeline-line timeline-fill" />
      {nowAt !== null && (
        <li aria-label={t.day.now} className="timeline-now" style={{ top: `${nowAt * 100}%` }}>
          <span className="label-caps rounded-full bg-primary px-3 py-1 text-primary-foreground">{t.day.now}</span>
        </li>
      )}
      {t.day.schedule.map((s, i) => <Row key={s.time} i={i} time={jstLabel(s.time, lang)} label={s.label} where={s.where} local={null} />)}
    </ol>
  )
}

/** Details: the venue and its address, and How to get there, which opens Google Maps directions (v3 S; B goes to Travel).
 * The venue's story moved under the timeline (run 19), so the first screen is when and where. */
function Details() {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <p className="font-medium text-foreground">{VENUE.name}</p>
        {t.day.addressLines.map((l) => <p key={l}>{l}</p>)}
      </div>
      <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{t.day.howToGetThere}<span className="sr-only">, {t.driver.mapsOpens}</span></a>
    </div>
  )
}

/** The day: details, then the timeline. No tabs, no countdown (Home's row is the only one, v3 R). */
export function DayPage() {
  const { t } = useLang()
  const [now, setNow] = useState(() => new Date())
  // The Kyoto clock rolls only when the minute changes, not when the page first shows (that read as a flicker)
  const firstMinute = useRef(kyotoNow(now))
  const rolls = kyotoNow(now) !== firstMinute.current
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const timeline = (
    <div className="flex flex-col gap-4">
      <Timeline now={now} />
      {/* The Kyoto minute rolls up into place when it ticks over; the key remounts it */}
      <p className="text-small text-muted-foreground">{t.day.japanTime} <span className={rolls ? "no-print clock-roll" : "no-print"} key={kyotoNow(now)}>{keepTimes(t.day.kyotoNow(kyotoNow(now)))}</span></p>
      <p>{t.day.rainPlan}</p>
      <p>{t.day.venueFacts}</p>
    </div>
  )
  return (
    <>
      <PageHeader title={t.day.title}><p className="font-medium text-foreground">{t.day.dateLong}</p></PageHeader>
      <Details />
      {timeline}
      <div className="no-print flex flex-col gap-4">
        <AddToCalendar />
        <button type="button" className="btn-text hidden min-h-11 self-start md:inline-flex md:items-center" onClick={() => window.print()}>{t.day.print}</button>
      </div>
    </>
  )
}
