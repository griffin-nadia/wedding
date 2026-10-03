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

/** "376 days to go · it's 9:14 pm in Kyoto", live. Tomorrow, today and after have their own words. */
function LiveLine() {
  const { t } = useLang()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  const d = daysToGo(now)
  const lead = d > 1 ? t.home.daysToGo(d) : d === 1 ? t.countdownMore.tomorrow : d === 0 ? t.countdownMore.today : t.countdownMore.married
  return <p><span className="text-foreground">{lead}</span>, {t.home.kyotoLine(kyotoNow(now))}</p>
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

      <LiveLine />

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
