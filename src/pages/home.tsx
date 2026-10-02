import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RsvpSheet } from "@/components/rsvp-sheet"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { countdown } from "@/lib/time"

export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [left, setLeft] = useState(countdown())
  useEffect(() => {
    const id = setInterval(() => setLeft(countdown()), 30_000)
    return () => clearInterval(id)
  }, [])
  if (!household) return null
  const done = Boolean(household.respondedAt)

  return (
    <div className="grid gap-10 py-6 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-16">
      <section className="space-y-6">
        <p className="eyebrow">{t.meta.eyebrow}</p>
        <h1 className="text-4xl md:text-7xl">{t.home.greeting(household.displayName)}</h1>
        <p className="text-body">Friday 15 October 2027 · The Sodoh Higashiyama, Kyoto</p>
        <p className="max-w-xl font-display text-lg text-body md:text-xl">{t.home.intro}</p>

        <Card className="shadow-paper">
          <CardContent className="space-y-3">
            <p className="eyebrow text-muted-foreground">{t.home.rsvpLabel}</p>
            {done ? (
              <p className="flex items-center gap-2 font-display text-2xl"><Check className="size-5 text-primary" aria-hidden />{t.home.rsvpDone}</p>
            ) : (
              <>
                <p className="font-display text-2xl">{t.home.rsvpNotDone}</p>
                <p className="text-sm text-body">{t.home.rsvpDue}</p>
              </>
            )}
            <RsvpSheet>
              <Button size="lg" variant={done ? "outline" : "default"} className="w-full md:w-auto">
                {done ? t.home.rsvpChange : t.home.rsvpButton}
              </Button>
            </RsvpSheet>
          </CardContent>
        </Card>

        <dl className="grid grid-cols-3 gap-3" aria-label="Countdown">
          {(["days", "hours", "mins"] as const).map((k) => (
            <div key={k} className="rounded-lg border bg-card py-4 text-center">
              <dd className="font-display text-3xl">{left[k]}</dd>
              <dt className="text-xs text-muted-foreground">{t.home.countdown[k]}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="next-up" className="space-y-3">
        <h2 id="next-up" className="font-sans text-sm font-bold">{t.home.nextUp}</h2>
        {[
          { to: "/travel", title: t.travel.title, body: "Passport, flights, SIM" },
          { to: "/the-day", title: t.day.title, body: "11:00 ceremony in the garden" },
          { to: "/qa", title: t.qa.title, body: "Gifts, what to wear, food" },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="flex items-center justify-between rounded-lg border bg-card px-5 py-4 transition-colors hover:bg-muted">
            <span>
              <span className="block font-bold">{c.title}</span>
              <span className="text-sm text-body">{c.body}</span>
            </span>
            <ArrowRight className="size-4 text-primary" aria-hidden />
          </Link>
        ))}
      </section>
    </div>
  )
}
