import { useEffect, useState } from "react"
import { Combobox } from "@/components/combobox"
import { JourneyMini, usePlaceName } from "@/components/journey-mini"
import { getFlying, setFlying, type Flying } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { bucketOf, findPlaces, placeOf, type Place } from "@/lib/places"
import { useLang } from "@/lib/lang"

/**
 * After the fortune, on "You're all set": one optional card. Where are you flying from? Type a city, a suburb or a
 * short name, typos and all ("Noeth Melb", "Brunswick"), and it finds the city from a small list on this device (no
 * lookup anywhere); the field then shows the city. Their gold line draws on the small map over everyone else's
 * faint ones. Nothing that matches keeps the last real choice. The sheet only ever gets the nearest of its fixed
 * places, as a count, never who; the city stays on this device so Home can show their line. Still under reduced
 * motion: the line is drawn.
 */
export function JourneyEnd({ token }: { token: string }) {
  const { t } = useLang()
  const nameOf = usePlaceName()
  const [city, setCity] = useState<string | null>(() => readFlying(token))
  const [counts, setCounts] = useState<Partial<Record<Flying, number>> | null>(null)
  useEffect(() => { void getFlying().then((f) => setCounts(f?.counts ?? null)) }, [])
  const name = city ? nameOf(city) : ""
  const [q, setQ] = useState(name)
  const found = q === name ? findPlaces("") : findPlaces(q)
  const options = found.map((p) => ({ key: p.name, label: nameOf(p.name), selected: p.name === city }))
  const choose = (p: Place) => {
    setQ(nameOf(p.name)); document.getElementById("fly-from")?.blur()
    if (p.name === city) return
    setCity(p.name)
    keepFlying(token, p.name)
    void setFlying(token, bucketOf(p)).catch(() => {})
  }
  // Leaving the field (or Enter) with words typed: the best match is the answer ("Noeth Melb" → Melbourne); words that
  // match nothing go back to the last real choice (or empty)
  const settle = () => { const best = q.trim() && q !== name ? findPlaces(q)[0] : undefined; if (best) choose(best); else setQ(name) }
  return (
    <section aria-label={t.flying.endTitle} className="journey-end paper-feel">
      <Combobox id="fly-from" label={t.flying.endTitle} help={t.flying.hint} placeholder={t.flying.placeholder} query={q} onQuery={setQ} openOnFocus onLeave={settle}
        options={options} onPick={(o) => choose(placeOf(o.key)!)} onSubmit={settle}
        status={options.length ? "results" : "empty"} emptyText={t.flying.noMatch} enterKeyHint="done" />
      <JourneyMini you={city} counts={counts} label={t.journey.map(name || null, city ?? undefined)} className="journey-end-map" />
      {city && <p role="status" className="text-small text-muted-foreground">{t.flying.yours(city, name)}</p>}
    </section>
  )
}
