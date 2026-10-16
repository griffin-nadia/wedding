import { useEffect, useState } from "react"
import { Chip } from "@/components/blocks"
import { JourneyMini } from "@/components/journey-mini"
import { FLYING, getFlying, setFlying, type Flying } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { useLang } from "@/lib/lang"

/**
 * After the fortune, on "You're all set": one optional card. Where are you flying from? Tap a city and their gold
 * line draws on the small map over everyone else's faint ones. The sheet only ever gets a count per city, never
 * who; the city stays on this device so Home can show their line. Still under reduced motion: the line is drawn.
 */
export function JourneyEnd({ token }: { token: string }) {
  const { t } = useLang()
  const [city, setCity] = useState<Flying | null>(() => readFlying(token))
  const [counts, setCounts] = useState<Partial<Record<Flying, number>> | null>(null)
  useEffect(() => { void getFlying().then((f) => setCounts(f?.counts ?? null)) }, [])
  const pick = (c: Flying) => {
    if (c === city) return
    setCity(c)
    keepFlying(token, c)
    void setFlying(token, c).catch(() => {})
  }
  const name = city ? t.flying.cities[city] ?? city : null
  return (
    <section aria-labelledby="fly-end" className="journey-end">
      <div className="flex flex-col gap-1">
        <h3 id="fly-end" className="font-medium text-foreground">{t.flying.endTitle}</h3>
        <p className="text-small text-muted-foreground">{t.flying.hint}</p>
      </div>
      <div role="group" aria-labelledby="fly-end" className="flex flex-wrap gap-2">
        {FLYING.map((c) => <Chip key={c} on={city === c} onClick={() => pick(c)}>{t.flying.cities[c] ?? c}</Chip>)}
      </div>
      <JourneyMini you={city} counts={counts} label={t.journey.map(name)} className="journey-end-map" />
      {name && <p role="status" className="text-small text-muted-foreground">{t.flying.yours(name)}</p>}
    </section>
  )
}
