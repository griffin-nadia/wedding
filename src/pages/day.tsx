import { ART } from "@/lib/art"
import { useEffect, useRef, useState } from "react"
import { Flower2, UtensilsCrossed, Wine } from "lucide-react"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Link } from "react-router-dom"
import { directionsUrl } from "@/lib/calendar"
import { useOption } from "@/lib/options"
import { DATES } from "@/lib/wedding-dates"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { jstLabel, kyotoNow, localTimeParts } from "@/lib/time"
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

function Row({ i, time, label, where, local }: { i: number; time: string; label: string; where: string; local: string | null }) {
  const Icon = ICONS[i] ?? Flower2
  const left = i % 2 === 0
  return (
    <li className={cn("timeline-row", left ? "is-left" : "is-right")}>
      <p className="timeline-time numerals text-foreground">{time}</p>
      <span aria-hidden className="timeline-icon"><Icon className="size-5" /></span>
      <div className="timeline-text">
        <p className="font-medium text-foreground">{label}</p>
        <p>{where}</p>
        {local && <p className="text-muted-foreground">{local}</p>}
      </div>
    </li>
  )
}

/** The timeline: one thin moss line that draws in as you scroll (the only thing that moves); time and label swap sides down it. */
function Timeline({ now }: { now: Date }) {
  const { t, lang } = useLang()
  const nowAt = nowOnTheDay(now, t.day.schedule.map((x) => x.time))
  const ref = useRef<HTMLOListElement>(null)
  // The line's tip follows a point 60% down the screen, so it's complete once the timeline's end reaches that point,
  // and it snaps to full when the page can't scroll any further (a short laptop screen never gets the end that high).
  // One path for every browser: a CSS scroll timeline can't know the page has run out of scroll.
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    el.classList.add("timeline-js")
    let raf = 0
    const tick = () => {
      raf = 0
      const r = el.getBoundingClientRect(), vh = window.innerHeight
      const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 2
      const p = atEnd ? 1 : Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height))
      el.style.setProperty("--fill", p.toFixed(3))
      // Times tick in (Options): a row has been reached once the line's tip (p of the timeline's height) passes it
      const tip = r.top + r.height * p
      el.querySelectorAll<HTMLElement>(".timeline-row").forEach((row) => row.classList.toggle("is-past", row.getBoundingClientRect().top + 20 <= tip))
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on)
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf) }
  }, [])
  return (
    <ol ref={ref} className="timeline" aria-label={t.day.timelineLabel}>
      <span aria-hidden className="timeline-line" />
      <span aria-hidden className="timeline-line timeline-fill" />
      {nowAt !== null && (
        <li aria-label={t.day.now} className="timeline-now" style={{ top: `${nowAt * 100}%` }}>
          <span className="label-caps rounded-full bg-primary px-3 py-1 text-primary-foreground">{t.day.now}</span>
        </li>
      )}
      {t.day.schedule.map((s, i) => <Row key={s.time} i={i} time={jstLabel(s.time, lang)} label={s.label} where={s.where} local={(() => { const p = localTimeParts(s.time, lang); return p && t.day.localLine(p.time, p.day, p.city) })()} />)}
    </ol>
  )
}

/** Details: the venue and its address, and How to get there, which opens Google Maps directions (v3 S; B goes to Travel). */
function Details() {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-4">
      <p>{t.day.venueFacts}</p>
      <div className="flex flex-col">
        <p className="font-medium text-foreground">{VENUE.name}</p>
        {t.day.addressLines.map((l) => <p key={l}>{l}</p>)}
      </div>
      {useOption("getthere") === "driver"
        ? <Link to="/travel" className="btn-text inline-flex min-h-11 items-center self-start">{t.day.howToGetThere}</Link>
        : <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{t.day.howToGetThere}<span className="sr-only">, {t.driver.mapsOpens}</span></a>}
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
      {/* The Kyoto minute rolls up into place when it ticks over (Options → Kyoto clock rolls); the key remounts it */}
      <p className="text-sm text-muted-foreground">{t.day.japanTime} <span className={rolls ? "no-print clock-roll" : "no-print"} key={kyotoNow(now)}>{t.day.kyotoNow(kyotoNow(now))}</span></p>
      <p>{t.day.rainPlan}</p>
    </div>
  )
  const garden = useOption("garden") === "on"
  return (
    <>
      <header className="flex flex-col gap-4">
        <h1 className="heading">{t.day.title}</h1>
        <p className="lead">{t.day.dateLong}</p>
      </header>
      {garden && (ART.garden.kind === "ink"
        ? <div role="img" aria-label={t.day.gardenAlt} className="garden-art" style={{ ["--garden" as string]: `url(${import.meta.env.BASE_URL}${ART.garden.src})` }} />
        : <img src={`${import.meta.env.BASE_URL}${ART.garden.src}`} alt={t.day.gardenAlt} className="garden-art is-colour" decoding="async" />)}
      <Details />
      {timeline}
      <div className="no-print flex flex-col gap-4">
        <AddToCalendar />
        <button type="button" className="btn-text hidden min-h-11 self-start md:inline-flex md:items-center" onClick={() => window.print()}>{t.day.print}</button>
      </div>
    </>
  )
}
