import { lazy, Suspense, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { countdown, isLocked } from "@/lib/time"
import { answerOf } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Lettering, OurStory, Paintings } from "@/components/slots"
import { Hanko } from "@/components/hanko"

// The RSVP form loads just after the greeting paints. Until then the same button shows (inactive).
const RsvpSheet = lazy(() => import("@/components/rsvp-sheet").then((m) => ({ default: m.RsvpSheet })))

export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [left, setLeft] = useState(countdown())
  const [wantOpen, setWantOpen] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setLeft(countdown()), 30_000)
    return () => clearInterval(id)
  }, [])
  if (!household) return null
  const done = Boolean(household.respondedAt)
  const answer = answerOf(household)
  const locked = isLocked()
  const rsvpButton = (
    <Button size="lg" variant={done ? "outline" : "default"} className="w-full md:w-auto" aria-busy={wantOpen}
      onClick={() => setWantOpen(true)}>
      {done ? t.home.rsvpChange : t.home.rsvpButton}
    </Button>
  )

  return (
    <div className="grid gap-12 py-6 md:grid-cols-[1.1fr_1fr] md:gap-18 md:py-12">
      <section className="space-y-6">
        <Lettering />
        <p className="eyebrow">{t.meta.eyebrow}</p>
        <h1 className="title-hero">{t.home.greeting(household.displayName)}</h1>
        <p className="text-body">{t.day.date} · {t.day.venue}</p>
        <p className="max-w-xl font-display text-lg text-body md:text-xl">{t.home.intro}</p>

        <Card className="shadow-paper">
          <CardContent className="space-y-3">
            <p className="eyebrow text-muted-foreground">{t.home.rsvpLabel}</p>
            {done ? (
              <>
                <div className="flex items-center gap-3">
                  {answer !== "none" && <Hanko size="sm" />}
                  <p className="font-display text-2xl">{answer === "all" ? t.home.rsvpDone : answer === "none" ? t.home.rsvpDoneNone : t.home.rsvpDoneMixed}</p>
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
                <p className="font-display text-2xl">{t.home.rsvpNotDone}</p>
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
          </CardContent>
        </Card>

        <dl className="grid grid-cols-3 gap-3" aria-label="Countdown">
          {(["days", "hours", "mins"] as const).map((k) => (
            <div key={k} className="relative flex flex-col-reverse items-center gap-1 rounded-[1.25rem] bg-card py-4 text-center shadow-paper ring-1 ring-border">
              {k === "days" && <span aria-hidden className="absolute top-3 right-3 size-1.5 rounded-full bg-leaf" />}
              <dt className="text-xs tracking-wide text-muted-foreground">{t.home.countdown[k]}</dt>
              <dd className="font-display text-4xl leading-none tabular-nums">{left[k]}</dd>
            </div>
          ))}
        </dl>
        <AddToCalendar />
      </section>

      <section aria-labelledby="next-up" className="space-y-3">
        <h2 id="next-up" className="leaf-rule font-sans text-sm font-bold">{t.home.nextUp}</h2>
        {[
          { to: "/travel", title: t.travel.title, body: "Passport, flights, SIM" },
          { to: "/the-day", title: t.day.title, body: "11:00 am ceremony in the garden" },
          { to: "/qa", title: t.qa.title, body: "Gifts, what to wear, food" },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="flex items-center justify-between rounded-lg border bg-card px-6 py-4 transition-colors hover:bg-muted">
            <span>
              <span className="block font-bold">{c.title}</span>
              <span className="text-sm text-body">{c.body}</span>
            </span>
            <ArrowRight className="size-4 text-primary" aria-hidden />
          </Link>
        ))}
      </section>
      <div className="space-y-12 md:col-span-2"><OurStory /><Paintings /></div>
    </div>
  )
}
