import { lazy, Suspense, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { COUPLE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { countdownParts, isLocked, jstLabel, kyotoNow, localTime } from "@/lib/time"
import { answerOf } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { AddToCalendar } from "@/components/add-to-calendar"
import { HeroPhoto, Lettering, OurStory, Paintings } from "@/components/slots"
import { Hanko } from "@/components/hanko"
import { Lanterns } from "@/components/lanterns"
import { Leaf, Mist, Vine } from "@/components/nature"
import { Envelope } from "@/components/envelope"

// The RSVP form loads just after the greeting paints. Until then the same button shows, and a tap
// still opens it as soon as it arrives.
const RsvpSheet = lazy(() => import("@/components/rsvp-sheet").then((m) => ({ default: m.RsvpSheet })))

function useTick(ms: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [params] = useSearchParams()
  const [wantOpen, setWantOpen] = useState(params.get("rsvp") === "1")
  const now = useTick(60_000)
  if (!household) return null
  const done = Boolean(household.respondedAt)
  const answer = answerOf(household)
  const locked = isLocked()
  const left = countdownParts(now)
  const rsvpButton = (
    <Button size="lg" variant={done ? "outline" : "default"} className="w-full sm:w-auto" aria-busy={wantOpen}
      onClick={() => setWantOpen(true)}>
      {done ? t.home.changeReply : t.home.rsvpBy}
    </Button>
  )

  return (
    <div className="-mx-4 md:-mx-8">
      <Envelope />
      {/* Hero: paper and type (Look B), with a vine whose leaves turn with the seasons */}
      <section className="relative overflow-hidden px-4 pt-6 pb-12 md:px-8 md:pt-12 md:pb-18">
        <Vine className="hero-vine absolute -top-2 -right-6 w-40 md:right-0 md:w-56" />
        <Lanterns />
        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-start md:gap-12">
          <div className="space-y-6">
            <Lettering />
            <p className="eyebrow">{t.meta.eyebrow}</p>
            <div className="flex items-start gap-6 md:gap-8">
              <p aria-label="15 October 2027" className="numerals flex flex-col text-[clamp(3rem,2rem+5vw,5rem)] leading-[0.9] text-primary">
                {t.home.dateStack.map((n) => <span key={n} aria-hidden>{n}</span>)}
              </p>
              <h1 className="names pt-1 text-foreground">
                <span className="block">{COUPLE.first}</span>
                <span className="ml-[0.35em] block translate-y-[0.06em] text-[0.66em] text-primary" aria-label="and">&amp;</span>
                <span className="block">{COUPLE.second}</span>
              </h1>
            </div>
            <div className="space-y-3">
              <p lang="ja" className="font-ja text-3xl text-highlight">{t.home.kyoto}</p>
              <span aria-hidden className="block h-px w-16 bg-border" />
              <p className="label-caps text-body">{t.home.placeLine}</p>
            </div>
            <div className="max-w-xl space-y-3">
              <p className="hand text-xl text-foreground">{t.home.dear(household.displayName)}</p>
              <p className="text-lg text-body">{t.home.intro}</p>
            </div>
          </div>

          <div className="space-y-6">
            <HeroPhoto caption={t.home.photoCaption} />
            {/* RSVP card */}
            <div className="space-y-4 rounded-[1.25rem] bg-card p-6 shadow-paper ring-1 ring-border">
              <p className="label-caps text-muted-foreground">{t.home.rsvpLabel}</p>
              {done ? (
                <>
                  <div className="flex items-center gap-3">
                    {answer !== "none" && <Hanko size="sm" />}
                    <p className="font-display text-3xl">{answer === "all" ? t.home.rsvpDone : answer === "none" ? t.home.rsvpDoneNone : t.home.rsvpDoneMixed}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-body">{t.home.youSaid}:</p>
                    <ul className="flex flex-wrap gap-2">
                      {household.guests.map((g) => (
                        <li key={g.id} className={g.attending === "yes"
                          ? "inline-flex items-center gap-2 rounded-full bg-leaf/15 px-3 py-1 text-sm text-success"
                          : "inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-body"}>
                          {g.attending === "yes" && <span aria-hidden className="size-1.5 rounded-full bg-leaf" />}
                          <span className="font-semibold">{g.firstName}</span>
                          {g.attending === "yes" ? t.home.said.yes : g.attending === "no" ? t.home.said.no : t.home.said.none}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(household.arrival || household.departure) && answer !== "none" && (
                    <p className="text-sm text-body">{t.rsvp.dates}: {fmtStay(household.arrival, household.departure, t.rsvp.notSet)}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-display text-3xl">{t.home.rsvpNotDone}</p>
                  <p className="text-sm text-body">{t.home.rsvpDue}</p>
                </>
              )}
              {locked ? (
                <p className="text-sm text-body">{t.home.rsvpClosed}</p>
              ) : (
                // A tap before the form has loaded still opens it as soon as it arrives.
                <Suspense fallback={rsvpButton}>
                  <RsvpSheet openOnLoad={wantOpen}>{rsvpButton}</RsvpSheet>
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </section>

      <Mist className="full-bleed -mb-px" />

      {/* The day at a glance, on sage */}
      <section aria-labelledby="schedule" className="section-alt full-bleed px-4 py-12 md:px-8 md:py-18">
        <div className="mx-auto max-w-[40rem] space-y-6">
          <h2 id="schedule" className="title leaf-rule">{t.home.scheduleTitle}</h2>
          <ol className="divide-y divide-border">
            {t.day.schedule.map((s) => (
              <li key={s.time} className="grid grid-cols-[6.5rem_1fr] gap-4 py-4">
                <span className="numerals text-2xl leading-tight">{jstLabel(s.time)}</span>
                <span>
                  <span className="block text-lg font-semibold">{s.label}</span>
                  <span className="block text-sm text-body">{s.where}</span>
                  {localTime(s.time) && <span className="block text-xs text-muted-foreground">{localTime(s.time)}</span>}
                </span>
              </li>
            ))}
          </ol>
          <Link to="/the-day#timeline" className="inline-flex min-h-11 items-center gap-2 text-link underline underline-offset-4">
            {t.home.scheduleMore}<ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Countdown (Susie & Jay) */}
      <section aria-labelledby="countdown" className="px-4 py-12 md:px-8 md:py-18">
        <div className="mx-auto max-w-[40rem] space-y-6 text-center">
          <h2 id="countdown" className="title">{t.home.countdownTitle}</h2>
          <dl aria-live="off" className="grid grid-cols-4 gap-2 sm:gap-4">
            {(["months", "days", "hours", "mins"] as const).map((k) => (
              <div key={k} className="flex flex-col-reverse items-center gap-2 rounded-[1.25rem] bg-card py-4 shadow-paper ring-1 ring-border">
                <dt className="label-caps text-muted-foreground">{t.home.countdownUnits[k]}</dt>
                <dd className="numerals text-[clamp(2.5rem,1.8rem+3vw,3.5rem)] leading-none">{left[k]}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-body">{t.home.kyotoTimeShort(kyotoNow(now))}</p>
          <p className="hand flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Leaf kind="maple" className="size-5" />{t.home.leavesNote}
          </p>
          <div className="flex justify-center"><AddToCalendar /></div>
        </div>
      </section>

      <div className="space-y-12 px-4 pb-12 md:px-8"><OurStory /><Paintings /></div>
    </div>
  )
}
