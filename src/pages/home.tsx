import { ART } from "@/lib/art"
import { NamesArt } from "@/components/names-art"
import { lazy, Suspense, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Check, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { useContent } from "@/lib/content"
import { HomeCountdown } from "@/components/home-countdown"
import { Link } from "react-router-dom"
import { directionsUrl } from "@/lib/calendar"
import { COUPLE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { Pill } from "@/components/pill"
import { Skeleton } from "@/components/skeleton"
import type { Household } from "@/lib/api"
import { pending } from "@/content/pending"
import type { StepId } from "@/components/rsvp-sheet"
import { AskUs } from "@/components/ask-us"

// The RSVP form loads just after the greeting paints. Until then the same button shows, and a tap
// still opens it as soon as it arrives.
const RsvpSheet = lazy(() => import("@/components/rsvp-sheet").then((m) => ({ default: m.RsvpSheet })))

// The names reveal once, letter by letter, the first time the letter is opened (v3 L). Never again.
const REVEAL_NAMES = (() => {
  try { const first = !localStorage.getItem("ng-names"); localStorage.setItem("ng-names", "1"); return first } catch { return false }
})()

function Names() {
  // Nadia's lettering (ART.names): drawn on left to right the first time, in the ink of the theme. The heading keeps
  // the names as text (visually hidden) for screen readers and search
  if (ART.names) return (
    <h1 className="names">
      <span className="sr-only">{COUPLE.first} &amp; {COUPLE.second}</span>
      <NamesArt className={REVEAL_NAMES ? "names-lettering is-revealing" : "names-lettering"} />
    </h1>
  )
  const chars = (s: string, from: number) => [...s].map((c, i) => <span key={i} className="name-char" style={{ animationDelay: `${(from + i) * 40}ms` }}>{c === " " ? " " : c}</span>)
  return (
    <h1 aria-label={`${COUPLE.first} & ${COUPLE.second}`} className={REVEAL_NAMES ? "names names-reveal" : "names"}>
      <span aria-hidden>{chars(COUPLE.first, 0)} <span className="name-char text-primary" style={{ animationDelay: `${COUPLE.first.length * 40}ms` }}>&amp;</span>{" "}</span>
      <br aria-hidden />
      <span aria-hidden>{chars(COUPLE.second, COUPLE.first.length + 2)}</span>
    </h1>
  )
}

/** The reply's steps as four tags (final run): Who's coming, Food, A song, Travel dates, each done or not yet with a
 *  tick or a soft dash, and each opening its own step of the reply. Food counts as done once they've replied (no
 *  dietary needs is an answer too). */
function YourReply({ h, open }: { h: Household; open: (step: StepId) => void }) {
  const { t } = useLang()
  const coming = h.guests.filter((g) => g.attending === "yes")
  if (!coming.length) return null
  const rows = [
    { key: "who", label: t.home.todo.who, done: h.guests.every((g) => g.attending), step: "who" as const },
    { key: "food", label: t.home.todo.food, done: Boolean(h.respondedAt) || coming.some((g) => g.dietary && g.dietary !== "None"), step: "food" as const },
    { key: "song", label: t.home.todo.song, done: h.songs.length > 0, step: "song" as const },
    { key: "dates", label: t.home.todo.dates, done: Boolean(h.arrival && h.departure), step: "travel" as const, note: t.home.todo.datesLater },
  ]
  return (
    <section aria-label={t.home.yourReply}>
      <ul className="reply-chips">
        {rows.map((r) => (
          <li key={r.key}>
            <button type="button" onClick={() => open(r.step)} className="reply-chip" data-done={r.done || undefined}>
              {r.done ? <Check className="size-5 text-success" aria-hidden /> : <Minus className="size-5 text-muted-foreground" aria-hidden />}
              <span>{r.label}{!r.done && r.note ? <span className="text-muted-foreground">, {r.note}</span> : null}</span>
              <span className="sr-only">, {r.done ? t.home.todo.done : t.home.todo.toDo}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The next step once they've replied (18e), as one quiet card with one button: no travel dates yet, add them (the
 * reply's dates step); dates in (or past the change-by date), plan the trip on Travel. Before a reply the RSVP
 * button is the step; in the week of the wedding, The day is.
 */
function NextStep({ h, open, locked }: { h: Household; open: (step: StepId) => void; locked: boolean }) {
  const { lang } = useLang()
  const dates = Boolean(h.arrival && h.departure)
  return (
    <div className="next-step">
      {!dates && !locked
        ? <Button size="md" variant="secondary" className="w-full sm:w-auto" onClick={() => open("travel")}>{pending("home.nextDates", lang)}</Button>
        : <Button asChild size="md" variant="secondary" className="w-full sm:w-auto"><Link to="/travel">{pending("home.nextTrip", lang)}</Link></Button>}
    </div>
  )
}

/**
 * Home (v3 A, K): a letterhead (the names, the date and place as the second line in the same face),
 * the greeting, and one action: RSVP by Mon 15 Feb. Once replied, the Replied pill, Change my reply and
 * a quiet note of what's left. Sign-off only.
 */
export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [params] = useSearchParams()
  const [tapped, setTapped] = useState(params.get("rsvp") === "1")
  const [request, setRequest] = useState<{ at: number; step: StepId } | undefined>()
  useEffect(() => { if (params.get("rsvp") === "1") setTapped(true) }, [params])
  const done = Boolean(household?.respondedAt)
  const locked = isLocked()
  // v3 P: first names in the sheet's order; a plus one without a name yet is "your plus one"
  const names = household ? household.guests.map((g) => (g.plusOne && /^(guest|plus one|\+1)?$/i.test(g.firstName.trim()) ? t.home.yourPlusOne : g.firstName)).filter(Boolean) : []
  const dear = t.home.dearNames(names) || household?.displayName || ""
  const openAt = (step: StepId) => { setTapped(true); setRequest({ at: Date.now(), step }) }
  const { mode, contactDay } = useContent()
  const { lang } = useLang()

  const rsvpButton = done
    ? <button type="button" className="btn-text min-h-11" aria-busy={tapped} onClick={() => setTapped(true)}>{t.home.changeReply}</button>
    : <Button size="md" className="home-rsvp w-full sm:w-auto" aria-busy={tapped} onClick={() => setTapped(true)}>{t.home.rsvpButton}</Button>

  return (
    <>
      <header className="flex flex-col gap-4">
        <Names />
        <p className="date-badge">{mode === "keepsake" ? t.home.keepsake.badge : t.home.dateLine}</p>
      </header>

      {household
        ? <p className="max-w-[34em]"><span className="text-foreground">{t.home.dear(dear)}</span> {mode === "keepsake" ? t.home.keepsake.greeting : mode === "week-of" ? t.home.week.greeting : t.home.greetingLine}</p>
        : <Skeleton className="h-21 w-full" />}

      {/* Later modes (v3 S): the week of the wedding points at the day; the keepsake is a thank-you letter */}
      {household && mode === "week-of" && (
        <div className="flex flex-col gap-3">
          <Button asChild size="md" className="w-full sm:w-auto sm:self-start"><Link to="/the-day">{t.home.week.day}</Link></Button>
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{t.home.week.directions}</a>
          {contactDay && <p className="text-small">{t.qa.onTheDay} {contactDay}</p>}
        </div>
      )}
      {household && mode === "keepsake" && <Link to="/our-story" className="btn-text inline-flex min-h-11 items-center self-start">{t.home.keepsake.story}</Link>}

      {mode !== "invite" ? null : !household ? (
        <div role="status"><span className="sr-only">{t.loading}</span><Skeleton className="h-(--button-height) w-full rounded-lg! sm:w-64" /></div>
      ) : locked ? (
        // After the changes lock: a reply stays marked, with their "life happens" line where the change-by line was
        done ? (
          <div className="flex flex-col gap-2">
            <Pill tone="good" className="self-start">{t.home.pills.replied}</Pill>
            <p className="text-small text-muted-foreground">{t.home.changeAfter}</p>
          </div>
        ) : <div className="flex flex-col gap-2"><p>{t.home.rsvpClosed}</p><AskUs><button type="button" className="btn-text inline-flex min-h-11 items-center self-start">{pending("ask.open", lang)}</button></AskUs></div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {done && <Pill tone="good">{t.home.pills.replied}</Pill>}
              <Suspense fallback={rsvpButton}>
                <RsvpSheet openOnLoad={tapped} request={request}>{rsvpButton}</RsvpSheet>
              </Suspense>
            </div>
            {done && <p className="text-small text-muted-foreground">{t.home.changeBy}</p>}
          </div>
          {done && <YourReply h={household} open={openAt} />}
          {done && <NextStep h={household} open={openAt} locked={false} />}
        </div>
      )}
      {mode === "invite" && household && locked && done && <NextStep h={household} open={openAt} locked />}
      <HomeCountdown />
    </>
  )
}
