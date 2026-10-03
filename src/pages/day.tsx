import { useEffect, useRef, useState } from "react"
import { Flower2, UtensilsCrossed, Wine } from "lucide-react"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Link } from "react-router-dom"
import { config } from "@/lib/config"
import { DATES } from "@/lib/wedding-dates"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { jstLabel, kyotoNow, localTime } from "@/lib/time"
import { cn } from "@/lib/utils"

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

/** Each row settles in once as it scrolls into view; already there under reduced motion. */
function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return setSeen(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { rootMargin: "0px 0px -15% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, seen] as const
}

function Row({ i, time, label, where, local }: { i: number; time: string; label: string; where: string; local: string | null }) {
  const [ref, seen] = useSeen<HTMLLIElement>()
  const Icon = ICONS[i] ?? Flower2
  const left = i % 2 === 0
  return (
    <li ref={ref} className={cn("timeline-row", left ? "is-left" : "is-right", seen && "is-seen")}>
      <p className="timeline-time numerals text-foreground">{time}</p>
      <span aria-hidden className="timeline-icon"><Icon className="size-5" strokeWidth={1.6} /></span>
      <div className="timeline-text">
        <p className="font-semibold text-foreground">{label}</p>
        <p>{where}</p>
        {local && <p className="text-sm text-muted-foreground">{local}</p>}
      </div>
    </li>
  )
}

/** The timeline: one thin moss line that draws in as you scroll; time and label swap sides down it. */
function Timeline({ now }: { now: Date }) {
  const { t } = useLang()
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
      {t.day.schedule.map((s, i) => <Row key={s.time} i={i} time={jstLabel(s.time)} label={s.label} where={s.where} local={localTime(s.time)} />)}
    </ol>
  )
}

/** Details: the venue and its address, and a link to Travel for getting there (v3 Q1: the trail lives on Travel only). */
function Details() {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-4">
      <p>{t.day.venueFacts}</p>
      <div className="flex flex-col">
        <p className="font-medium text-foreground">{VENUE.name}</p>
        {t.day.addressLines.map((l) => <p key={l}>{l}</p>)}
      </div>
      <Link to="/travel" className="btn-text inline-flex min-h-11 items-center self-start">{t.day.howToGetThere}</Link>
    </div>
  )
}

/** The countdown (v3 A): each unit on its own paper tile, one row, seconds ticking. The cute moment of this page. */
function CountdownTiles() {
  const { t } = useLang()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let id = 0
    const start = () => { clearInterval(id); id = window.setInterval(() => setNow(new Date()), 1000) }
    const vis = () => (document.hidden ? clearInterval(id) : (setNow(new Date()), start()))
    start(); document.addEventListener("visibilitychange", vis)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis) }
  }, [])
  const ms = Math.max(0, new Date(config.weddingStart).getTime() - now.getTime())
  const parts = [
    [Math.floor(ms / 86_400_000), t.countdownMore.short.days],
    [Math.floor((ms % 86_400_000) / 3_600_000), t.countdownMore.short.hours],
    [Math.floor((ms % 3_600_000) / 60_000), t.countdownMore.short.mins],
    [Math.floor((ms % 60_000) / 1000), t.countdownMore.short.secs],
  ] as const
  if (ms === 0) return <p className="font-display text-2xl text-foreground">{t.countdownMore.married}</p>
  return (
    <section aria-labelledby="count-h" className="flex flex-col gap-3">
      <h2 id="count-h" className="heading">{t.day.countdownTitle}</h2>
      <p className="sr-only">{t.home.daysToGo(parts[0][0])}</p>
      <div aria-hidden className="count-tiles">
        {parts.map(([v, unit], i) => (
          <div key={unit} className={cn("count-tile", i === 3 && "count-tile-secs")}>
            <span className="numerals"><span className="count-num">{i === 0 ? v : String(v).padStart(2, "0")}</span></span>
            <span className="text-xs text-muted-foreground">{unit}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/** The day: details first, then the timeline, then the countdown. No tabs (v3 A). */
export function DayPage() {
  const { t } = useLang()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const timeline = (
    <div className="flex flex-col gap-4">
      <Timeline now={now} />
      <p className="text-sm text-muted-foreground">{t.day.japanTime} <span className="no-print">{t.day.kyotoNow(kyotoNow(now))}</span></p>
      <p>{t.day.rainPlan}</p>
    </div>
  )
  return (
    <>
      <header className="flex flex-col gap-4">
        <h1 className="heading">{t.day.title}</h1>
        <p className="lead">{t.day.dateLong}</p>
      </header>
      <Details />
      {timeline}
      <CountdownTiles />
      <div className="no-print flex flex-col gap-4">
        <AddToCalendar />
        <button type="button" className="btn-text min-h-11 self-start" onClick={() => window.print()}>{t.day.print}</button>
      </div>
    </>
  )
}
