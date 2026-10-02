import { lazy, Suspense, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { COUPLE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { isLocked, jstLabel, localTime } from "@/lib/time"
import { answerOf } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Lettering, OurStory, Paintings } from "@/components/slots"
import { Photo, hasPublicPhotos } from "@/components/photo"
import { Clouds } from "@/components/clouds"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Pill } from "@/components/pill"
import { Skeleton } from "@/components/blocks"
import { Reveal } from "@/components/reveal"
import { Hanko } from "@/components/hanko"
import { Lanterns } from "@/components/lanterns"
import { Leaf, Mist, Vine } from "@/components/nature"
import { Envelope } from "@/components/envelope"
import { Countdown } from "@/components/countdown"

// The RSVP form loads just after the greeting paints. Until then the same button shows, and a tap
// still opens it as soon as it arrives.
const RsvpSheet = lazy(() => import("@/components/rsvp-sheet").then((m) => ({ default: m.RsvpSheet })))


// Names settle in once per visit (session), then stay still.
const SETTLE_NAMES = (() => {
  try { const first = !sessionStorage.getItem("ng-names"); sessionStorage.setItem("ng-names", "1"); return first } catch { return false }
})()

/** Date stack and names. On the full-bleed photo everything is cream (4.5:1+ on the scrim). */
function HeroTitle({ t, onPhoto = false }: { t: ReturnType<typeof useLang>["t"]; onPhoto?: boolean }) {
  return (
    <div className="flex items-start gap-6 md:gap-8">
      <p className={cn("numerals flex flex-col text-[clamp(3rem,2rem+5vw,5rem)] leading-[0.9]", onPhoto ? "text-[#ebd48f]" : "text-primary")}>
        <span className="sr-only">{t.day.date}</span>
        {t.home.dateStack.map((n) => <span key={n} aria-hidden>{n}</span>)}
      </p>
      <h1 aria-label={`${COUPLE.first} & ${COUPLE.second}`} className={cn("names pt-1", SETTLE_NAMES && "names-settle", onPhoto ? "text-[#f3e7d3]" : "text-foreground")}>
        <span aria-hidden className="block">{COUPLE.first}</span>
        <span aria-hidden className={cn("ml-[0.35em] block translate-y-[0.06em] text-[0.66em]", onPhoto ? "text-[#ebd48f]" : "text-primary")}>&amp;</span>
        <span aria-hidden className="block">{COUPLE.second}</span>
      </h1>
    </div>
  )
}

export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const { theme } = useTheme()
  const lantern = theme === "lantern"
  const fullBleed = hasPublicPhotos && lantern
  const [params] = useSearchParams()
  const [wantOpen, setWantOpen] = useState(params.get("rsvp") === "1")
  const done = Boolean(household?.respondedAt)
  const answer = household ? answerOf(household) : "none"
  const locked = isLocked()
  const rsvpButton = (
    <Button size="lg" variant={done ? "outline" : "default"} className="w-full sm:w-auto" aria-busy={wantOpen}
      onClick={() => setWantOpen(true)}>
      {done ? t.home.changeReply : t.home.rsvpBy}
    </Button>
  )

  return (
    <div className="-mx-4 md:-mx-8">
      <Envelope />
      {/* Lantern mode with photos: the night photo full-bleed (A), names in cream on a warm scrim */}
      {fullBleed && (
        <Photo name="kyoto-night" treatment="full" wide priority sizes="100vw" className="full-bleed min-h-[78svh] text-[#f3e7d3]">
          <div className="mx-auto flex min-h-[78svh] max-w-[60rem] flex-col justify-end gap-4 px-4 pb-10 md:px-8">
            <p className="eyebrow !text-[#ebd48f]">{t.meta.eyebrow}</p>
            <HeroTitle t={t} onPhoto />
          </div>
        </Photo>
      )}
      {/* Hero: one layer only. Light: the print photo (B) or, without photos, the ivy vine.
          Lantern: the full-bleed photo above or, without photos, the paper lanterns. */}
      <section className="relative overflow-hidden px-4 pt-6 pb-12 md:px-8 md:pt-12 md:pb-18">
        {!hasPublicPhotos && (lantern ? <Lanterns /> : <Vine className="absolute -top-2 -right-6 w-40 md:right-0 md:w-56" />)}
        <Clouds />
        <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-start md:gap-12">
          <div className="space-y-6">
            <Lettering />
            {!fullBleed && <p className="eyebrow">{t.meta.eyebrow}</p>}
            {!fullBleed && <HeroTitle t={t} />}
            <div className="space-y-3">
              <p lang="ja" className="font-ja text-3xl text-highlight">{t.home.kyoto}</p>
              <span aria-hidden className="block h-px w-16 bg-border" />
              <p className="label-caps text-body">{t.home.placeLine}</p>
            </div>
            <div className="max-w-xl space-y-3">
              {household
                ? <p className="hand text-xl text-foreground">{t.home.dear(household.displayName)}</p>
                : <Skeleton className="h-7 w-48" />}
              <p className="text-lg text-body">{t.home.intro}</p>
            </div>
          </div>

          <div className="space-y-6">
            {hasPublicPhotos && !lantern && <Photo name="couple-kyoto-view" treatment="print" priority sizes="(min-width: 768px) 420px, 90vw" className="mx-auto max-w-sm md:mx-0" />}
            {/* RSVP card (a quiet placeholder until the household arrives) */}
            {!household ? (
              <div role="status" className="space-y-4 rounded-[1.25rem] bg-card p-6 shadow-paper ring-1 ring-border">
                <span className="sr-only">{t.loading}</span>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-13 w-full rounded-full sm:w-48" />
              </div>
            ) : (
            <div className="space-y-4 rounded-[1.25rem] bg-card p-6 shadow-paper ring-1 ring-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="label-caps text-muted-foreground">{t.home.rsvpLabel}</p>
                <Pill tone={done ? "good" : "warn"}>{done ? t.home.pills.replied : t.home.pills.notYet}</Pill>
              </div>
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
                        <li key={g.id}>
                          <Pill tone={g.attending === "yes" ? "good" : "neutral"} className="normal-case tracking-normal text-[13px]">
                            <span className="font-semibold">{g.firstName}</span>
                            {g.attending === "yes" ? t.home.said.yes : g.attending === "no" ? t.home.said.no : t.home.said.none}
                          </Pill>
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
              {!locked && <Pill tone="neutral">{t.home.pills.lock}</Pill>}
              {locked ? (
                <p className="text-sm text-body">{t.home.rsvpClosed}</p>
              ) : (
                // A tap before the form has loaded still opens it as soon as it arrives.
                <Suspense fallback={rsvpButton}>
                  <RsvpSheet openOnLoad={wantOpen}>{rsvpButton}</RsvpSheet>
                </Suspense>
              )}
            </div>
            )}
          </div>
        </div>
      </section>

      <div className="bleed -mb-px"><Mist /></div>

      {/* The day at a glance, on sage */}
      <section aria-labelledby="schedule" className="section-alt full-bleed px-4 py-12 md:px-8 md:py-18">
        <Reveal className="mx-auto max-w-[40rem] space-y-6">
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
        </Reveal>
      </section>

      {/* Countdown (Susie & Jay) */}
      <section aria-labelledby="countdown" className="px-4 py-12 md:px-8 md:py-18">
        <div className="mx-auto max-w-[40rem] space-y-6 text-center">
          <h2 id="countdown" className="title">{t.home.countdownTitle}</h2>
          <Countdown units={t.countdownMore.short} words={t.countdownMore} kyotoLabel={t.home.kyotoTimeShort} localTime={localTime("11:00")} />
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
