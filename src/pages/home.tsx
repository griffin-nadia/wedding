import { lazy, Suspense, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Check, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { COUPLE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { Pill } from "@/components/pill"
import { Skeleton } from "@/components/skeleton"
import type { Household } from "@/lib/api"

// The RSVP form loads just after the greeting paints. Until then the same button shows, and a tap
// still opens it as soon as it arrives.
const RsvpSheet = lazy(() => import("@/components/rsvp-sheet").then((m) => ({ default: m.RsvpSheet })))

// The names reveal once, letter by letter, the first time the letter is opened (v3 L). Never again.
const REVEAL_NAMES = (() => {
  try { const first = !localStorage.getItem("ng-names"); localStorage.setItem("ng-names", "1"); return first } catch { return false }
})()

function Names() {
  const chars = (s: string, from: number) => [...s].map((c, i) => <span key={i} className="name-char" style={{ animationDelay: `${(from + i) * 40}ms` }}>{c === " " ? " " : c}</span>)
  return (
    <h1 aria-label={`${COUPLE.first} & ${COUPLE.second}`} className={REVEAL_NAMES ? "names names-reveal" : "names"}>
      <span aria-hidden>{chars(COUPLE.first, 0)} <span className="name-char text-primary" style={{ animationDelay: `${COUPLE.first.length * 40}ms` }}>&amp;</span></span>
      <br aria-hidden />
      <span aria-hidden>{chars(COUPLE.second, COUPLE.first.length + 2)}</span>
    </h1>
  )
}

/** What's left, quietly (v3 J): three lines with a tick or a soft dash, each opening its step. Hidden once all three are done. */
function YourReply({ h, open }: { h: Household; open: (step: number) => void }) {
  const { t } = useLang()
  const coming = h.guests.filter((g) => g.attending === "yes")
  if (!coming.length) return null
  const rows = [
    { key: "who", label: t.home.todo.who, done: h.guests.every((g) => g.attending), step: 1 },
    { key: "food", label: t.home.todo.food, done: h.songs.length > 0 || coming.some((g) => g.dietary && g.dietary !== "None"), step: 2 },
    { key: "dates", label: t.home.todo.dates, done: Boolean(h.arrival && h.departure), step: 2, note: t.home.todo.datesLater },
  ]
  if (rows.every((r) => r.done)) return null
  return (
    <section aria-label={t.home.yourReply}>
      <ul className="flex flex-col">
        {rows.map((r) => (
          <li key={r.key}>
            <button type="button" onClick={() => open(r.step)} className="reply-row">
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
 * Home (v3 A, K): a letterhead (the names, the date and place as the second line in the same face),
 * the greeting, and one action: RSVP by Mon 15 Feb. Once replied, the Replied pill, Change my reply and
 * a quiet note of what's left. Sign-off only.
 */
export function HomePage() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [params] = useSearchParams()
  const [tapped, setTapped] = useState(params.get("rsvp") === "1")
  const [request, setRequest] = useState<{ at: number; step: number } | undefined>()
  useEffect(() => { if (params.get("rsvp") === "1") setTapped(true) }, [params])
  const done = Boolean(household?.respondedAt)
  const locked = isLocked()
  // v3 P: first names in the sheet's order; a plus one without a name yet is "your plus one"
  const names = household ? household.guests.map((g) => (g.plusOne && /^(guest|plus one|\+1)?$/i.test(g.firstName.trim()) ? t.home.yourPlusOne : g.firstName)).filter(Boolean) : []
  const dear = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] || household?.displayName || ""
  const openAt = (step: number) => { setTapped(true); setRequest({ at: Date.now(), step }) }

  const rsvpButton = done
    ? <button type="button" className="btn-text min-h-11" aria-busy={tapped} onClick={() => setTapped(true)}>{t.home.changeReply}</button>
    : <Button size="lg" className="w-full sm:w-auto" aria-busy={tapped} onClick={() => setTapped(true)}>{t.home.rsvpButton}</Button>

  return (
    <>
      <header className="flex flex-col gap-2">
        <Names />
        <p className="font-display text-2xl text-foreground">{t.home.dateLine}</p>
      </header>

      {household
        ? <p className="lead max-w-[34em]"><span className="text-foreground">{t.home.dear(dear)}</span> {t.home.greetingLine}</p>
        : <Skeleton className="h-21 w-full" />}

      {!household ? (
        <div role="status"><span className="sr-only">{t.loading}</span><Skeleton className="h-13 w-full rounded-lg sm:w-64" /></div>
      ) : locked ? (
        <p>{t.home.rsvpClosed}</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {done && <Pill tone="good">{t.home.pills.replied}</Pill>}
              <Suspense fallback={rsvpButton}>
                <RsvpSheet openOnLoad={tapped} request={request}>{rsvpButton}</RsvpSheet>
              </Suspense>
            </div>
            {done && <p className="text-sm text-muted-foreground">{t.home.changeBy}</p>}
          </div>
          {done && <YourReply h={household} open={openAt} />}
        </div>
      )}
    </>
  )
}
