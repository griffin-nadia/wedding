import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Flower2, UtensilsCrossed, Wine } from "lucide-react"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Countdown } from "@/components/countdown"
import { VenueMap } from "@/components/venue-map"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { useOption } from "@/lib/options"
import { sceneKind } from "@/lib/scenes"
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
  if (now.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }) !== "2027-10-15") return null
  const at = (hhmm: string) => new Date(`2027-10-15T${hhmm}:00+09:00`).getTime()
  const start = at(times[0]), end = at("15:30")
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

/** Details: the date, the venue as a mark, its address on two lines, the drawn map, one practical line, the dress note. */
function Details() {
  const { t } = useLang()
  return (
    <div className="flex flex-col gap-4">
      <p>{t.day.venueFacts}</p>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">{VENUE.name}</p>
        {t.day.addressLines.map((l) => <p key={l}>{l}</p>)}
      </div>
      <VenueMap />
      <p>{t.day.taxiEasiest}</p>
      <p>{t.day.dressNote}</p>
    </div>
  )
}

/** Tabs (options lab only, or if a second event is added): the active tab sits between two thin rules that slide (200 ms). */
function DayTabs({ panels }: { panels: { id: string; label: string; body: ReactNode }[] }) {
  const [tab, setTab] = useState(panels[0].id)
  const list = useRef<HTMLDivElement>(null)
  const [mark, setMark] = useState<{ x: number; w: number } | null>(null)
  useLayoutEffect(() => {
    const b = list.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (b && list.current) setMark({ x: b.offsetLeft, w: b.offsetWidth })
  }, [tab])
  return (
    <div className="flex flex-col gap-6">
      <div ref={list} role="tablist" className="day-tabs relative flex gap-2">
        {mark && <span aria-hidden className="day-tab-mark" style={{ transform: `translateX(${mark.x}px)`, width: mark.w }} />}
        {panels.map((p) => (
          <button key={p.id} role="tab" id={`tab-${p.id}`} aria-selected={tab === p.id} aria-controls={`panel-${p.id}`} onClick={() => setTab(p.id)}
            onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const i = panels.findIndex((x) => x.id === tab); const n = panels[(i + (e.key === "ArrowRight" ? 1 : panels.length - 1)) % panels.length]; setTab(n.id); requestAnimationFrame(() => document.getElementById(`tab-${n.id}`)?.focus()) } }}
            tabIndex={tab === p.id ? 0 : -1} className="label-caps relative min-h-11 px-4 text-muted-foreground outline-2 outline-offset-2 outline-transparent focus-visible:outline-ring aria-selected:text-foreground">{p.label}</button>
        ))}
      </div>
      {panels.map((p) => <div key={p.id} role="tabpanel" id={`panel-${p.id}`} aria-labelledby={`tab-${p.id}`} hidden={tab !== p.id}>{p.body}</div>)}
    </div>
  )
}

/** The day: details first, then the timeline. No tabs unless a second event is added (or the lab turns them on). */
export function DayPage() {
  const { t } = useLang()
  const tabs = useOption("daytabs") === "on"
  // On the Paper scene, photos live inside sections instead: an arched photo at the top of The day
  const paper = sceneKind(useOption("scene"), useOption("preset")) === "paper"
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
      {paper && <div className="arch-photo"><img src={`${import.meta.env.BASE_URL}scenes/castle-900.webp`} alt={t.day.archAlt} /></div>}
      <header className="flex flex-col gap-4">
        <p className="label-caps text-muted-foreground">{t.day.date}</p>
        <h1 className="heading">{t.day.title}</h1>
      </header>
      {tabs ? (
        <DayTabs panels={[{ id: "details", label: t.day.detailsTab, body: <Details /> }, { id: "timeline", label: t.day.timelineTab, body: timeline }]} />
      ) : (
        <>
          <Details />
          {timeline}
        </>
      )}
      <section aria-label={t.day.countdownLabel} className="flex flex-col gap-3">
        <p className="label-caps text-muted-foreground">{t.day.countdownLabel}</p>
        <Countdown units={t.countdownMore.short} words={t.countdownMore} kyotoLabel={t.home.kyotoTimeShort} localTime={localTime("11:00")} />
      </section>
      <div className="no-print flex flex-col gap-4">
        <AddToCalendar />
        <button type="button" className="btn-text min-h-11 self-start" onClick={() => window.print()}>{t.day.print}</button>
      </div>
    </>
  )
}
