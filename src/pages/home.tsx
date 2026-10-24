import { ART } from "@/lib/art"
import { NamesArt } from "@/components/names-art"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { useContent } from "@/lib/content"
import { HomeCountdown } from "@/components/home-countdown"
import { Link } from "react-router-dom"
import { directionsUrl } from "@/lib/calendar"
import { COUPLE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { ReplyStatus } from "@/components/reply-status"
import { Skeleton } from "@/components/skeleton"
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

/**
 * Home (v3 A, K): a letterhead (the names, the date and place as the second line in the same face),
 * the greeting, and one action: RSVP by Mon 15 Feb. Once replied, the Replied pill, Change my reply and
 * a quiet note of what's left. Sign-off only.
 */
export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [params, setParams] = useSearchParams()
  const [tapped, setTapped] = useState(params.get("rsvp") === "1")
  const [request, setRequest] = useState<{ at: number; step: StepId } | undefined>()
  // ?rsvp=1 (the top bar's RSVP, /rsvp) opens the sheet, then comes off the address. Kept on, a second press went to
  // the same address, nothing changed and the sheet stayed shut (run 26). Once the sheet has been opened, a later
  // press asks it to open again at the first step.
  const mounted = useRef(false)
  useEffect(() => {
    const later = mounted.current
    mounted.current = true
    if (params.get("rsvp") !== "1") return
    if (later && tapped) setRequest({ at: Date.now(), step: "who" })
    else setTapped(true)
    setParams((p) => { p.delete("rsvp"); return p }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])
  const done = Boolean(household?.respondedAt)
  const locked = isLocked()
  // v3 P: first names in the sheet's order; a plus one without a name yet is "your plus one"
  const names = household ? household.guests.map((g) => (g.plusOne && /^(guest|plus one|\+1)?$/i.test(g.firstName.trim()) ? t.home.yourPlusOne : g.firstName)).filter(Boolean) : []
  const dear = t.home.dearNames(names) || household?.displayName || ""
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

      {mode === "invite"
        // Their Intro (22 Oct) is two paragraphs, so "Dear …," gets its own line. Only that line waits for the
        // household; the intro shows at once, so nothing below it moves when the names arrive
        ? <div className="flex max-w-[34em] flex-col gap-2">
            {household ? <p className="text-foreground">{t.home.dear(dear)}</p> : <Skeleton className="h-(--type-body-leading) w-48" />}
            {t.home.intro.map((x) => <p key={x}>{x}</p>)}
          </div>
        : household
          ? <p className="max-w-[34em]"><span className="text-foreground">{t.home.dear(dear)}</span> {mode === "keepsake" ? t.home.keepsake.greeting : t.home.week.greeting}</p>
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
            <ReplyStatus tone="success">{t.home.pills.replied}</ReplyStatus>
            <p className="text-small text-muted-foreground">{t.home.changeAfter}</p>
          </div>
        ) : <div className="flex flex-col gap-2"><p>{t.home.rsvpClosed}</p><AskUs><button type="button" className="btn-text inline-flex min-h-11 items-center self-start">{pending("ask.open", lang)}</button></AskUs></div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {/* Replied (run 21): a status line with a check, and Change my reply beside it as the clear action. The sheet
                stays in one place either way, so sending doesn't remount it (its done screen stays up) */}
            <ReplyStatus tone="success" action={<Suspense fallback={rsvpButton}><RsvpSheet openOnLoad={tapped} request={request}>{rsvpButton}</RsvpSheet></Suspense>}>
              {done ? t.home.pills.replied : null}
            </ReplyStatus>
            {done && <p className="text-small text-muted-foreground">{t.home.changeBy}</p>}
          </div>
        </div>
      )}
      {/* Run 27: after a reply, Home is the letter, Replied with Change my reply, the note and the countdown; the
          fortune is the omikuji in the top bar (fortune-button.tsx) */}
      <HomeCountdown />
    </>
  )
}
