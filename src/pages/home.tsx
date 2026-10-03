import { lazy, Suspense, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { COUPLE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { isLocked, kyotoNow } from "@/lib/time"
import { config } from "@/lib/config"
import { Pill } from "@/components/pill"
import { Skeleton } from "@/components/blocks"

// The RSVP form loads just after the greeting paints. Until then the same button shows, and a tap
// still opens it as soon as it arrives.
const RsvpSheet = lazy(() => import("@/components/rsvp-sheet").then((m) => ({ default: m.RsvpSheet })))

// Names settle in once per visit (session), then stay still.
const SETTLE_NAMES = (() => {
  try { const first = !sessionStorage.getItem("ng-names"); sessionStorage.setItem("ng-names", "1"); return first } catch { return false }
})()

/** Whole days to go, counted on Kyoto's calendar. */
function daysToGo(now: Date) {
  const day = (d: Date) => Date.parse(d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }))
  return Math.round((day(new Date(config.weddingStart)) - day(now)) / 86_400_000)
}

/**
 * The countdown on Home: one row of display numerals, "376 days 04:12:09", rust colons, seconds ticking
 * (paused when the tab is hidden). Screen readers get one calm sentence that never ticks. Tomorrow,
 * today and after have their own words. Kyoto time is in the title for anyone who hovers.
 */
function HomeCountdown() {
  const { t } = useLang()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let id = 0
    const start = () => { clearInterval(id); id = window.setInterval(() => setNow(new Date()), 1000) }
    const vis = () => (document.hidden ? clearInterval(id) : (setNow(new Date()), start()))
    start(); document.addEventListener("visibilitychange", vis)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", vis) }
  }, [])
  const d = daysToGo(now)
  const ms = Math.max(0, new Date(config.weddingStart).getTime() - now.getTime())
  const hh = Math.floor((ms % 86_400_000) / 3_600_000), mm = Math.floor((ms % 3_600_000) / 60_000), ss = Math.floor((ms % 60_000) / 1000)
  const two = (n: number) => String(n).padStart(2, "0")
  const kyoto = t.home.kyotoLine(kyotoNow(now))
  if (d <= 1) return <p className="numerals text-(length:--type-display-numerals-size) leading-(--type-display-numerals-leading) text-foreground" title={kyoto}>{d === 1 ? t.countdownMore.tomorrow : d === 0 ? t.countdownMore.today : t.countdownMore.married}</p>
  return (
    <p className="home-countdown" title={kyoto}>
      <span className="sr-only">{t.home.daysToGo(d)}, {kyoto}</span>
      <span aria-hidden className="flex items-baseline gap-2">
        <span className="numerals text-foreground">{d}</span><span className="label-caps text-muted-foreground">{t.countdownMore.short.days}</span>
        <span className="numerals ml-3 text-foreground">{two(hh)}<span className="text-primary">:</span>{two(mm)}<span className="text-primary">:</span>{two(ss)}</span>
      </span>
    </p>
  )
}

/**
 * Home is the letter: label, names, moss rule, a three-line greeting, one live line, the RSVP,
 * one line of links, then the sign-off (from the layout). Fits one screen at 390×844 and 1440×900.
 */
export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [params] = useSearchParams()
  const [tapped, setTapped] = useState(params.get("rsvp") === "1")
  useEffect(() => { if (params.get("rsvp") === "1") setTapped(true) }, [params])
  const done = Boolean(household?.respondedAt)
  const locked = isLocked()
  const names = household ? household.guests.filter((g) => !g.plusOne).map((g) => g.firstName).filter(Boolean) : []
  const dear = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] || household?.displayName || ""

  const rsvpButton = done
    ? <button type="button" className="btn-text min-h-11" aria-busy={tapped} onClick={() => setTapped(true)}>{t.home.changeReply}</button>
    : <Button size="lg" className="w-full sm:w-auto sm:min-w-64 lg:min-w-0" aria-busy={tapped} onClick={() => setTapped(true)}>{t.home.rsvpBy}</Button>

  return (
    <>
      <header className="flex flex-col gap-4">
        <p className="label-caps text-muted-foreground">{t.home.label}</p>
        <h1 aria-label={`${COUPLE.first} & ${COUPLE.second}`} className={SETTLE_NAMES ? "names names-settle" : "names"}>
          <span aria-hidden>{COUPLE.first} <span className="text-primary">&amp;</span></span>
          <br aria-hidden />
          <span aria-hidden>{COUPLE.second}</span>
        </h1>
        <span aria-hidden className="moss-rule" />
      </header>

      {household
        ? <p className="max-w-[34em]"><span className="text-foreground">{t.home.dear(dear)}</span> {t.home.greetingLine}</p>
        : <Skeleton className="h-21 w-full" />}

      <HomeCountdown />

      {/* The RSVP (one button, or the replied pill with Change my reply), then one line of links */}
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5">
      {!household ? (
        <div role="status"><span className="sr-only">{t.loading}</span><Skeleton className="h-13 w-full rounded-lg sm:w-64" /></div>
      ) : locked ? (
        <p>{t.home.rsvpClosed}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {done && <Pill tone="good">{t.home.pills.replied}</Pill>}
          <Suspense fallback={rsvpButton}>
            <RsvpSheet openOnLoad={tapped}>{rsvpButton}</RsvpSheet>
          </Suspense>
        </div>
      )}

      <nav aria-label={t.home.moreLabel}>
        <ul className="flex flex-wrap gap-x-3">
          {t.home.links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="btn-text inline-flex min-h-11 items-center">{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      </div>
    </>
  )
}
