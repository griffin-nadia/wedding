import { useEffect, useRef, useState } from "react"
import { Combobox } from "@/components/combobox"
import { JourneyMini } from "@/components/journey-mini"
import { getFlying, setFlying } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { cityLabel, loadCities, searchCities, SOMEWHERE_ELSE, type City, type CityIndex } from "@/lib/city-search"
import CHIPS from "@/data/flying-chips.json"
import { useLang } from "@/lib/lang"
import { pending } from "@/content/pending"

/**
 * After the fortune, on "You're all set": one optional card. Where are you flying from? (final run)
 * - Quick chips first (src/content/flying-chips.ts): the cities most guests come from, and Already in Japan.
 * - Or type: real cities only, with their region and country ("Victoria, British Columbia, Canada"), from 2 letters,
 *   searched on this device (src/lib/city-search.ts; the index loads on first focus, nothing is sent while typing).
 * Only a picked city is saved: Enter takes the top suggestion, and words that match nothing keep the last real
 * choice (or, with nothing ever picked, offer Somewhere else). Their gold line draws on the small map over everyone
 * else's faint ones. The sheet gets the city (id, country, coordinates) for the guest maps, as counts per city,
 * never who; the city stays on this device too, so Home can show their line.
 */
export function JourneyEnd({ token }: { token: string }) {
  const { t, lang } = useLang()
  const [city, setCity] = useState<City | null>(() => readFlying(token))
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof getFlying>>>(null)
  useEffect(() => { void getFlying().then(setCounts) }, [])
  const [index, setIndex] = useState<CityIndex | null>(null)
  const [failed, setFailed] = useState(false)
  const shown = city ? (city.id === "jp" || city.id === "else" ? city.name : cityLabel(city)) : ""
  const [q, setQ] = useState(shown)
  const typing = q !== shown && q.trim().length > 0
  const found = typing && index ? searchCities(index, q) : []
  const results: City[] = typing && index && !found.length && !city ? [SOMEWHERE_ELSE] : found
  const input = useRef<string>(q); input.current = q
  const load = () => { if (!index) loadCities().then(setIndex, () => setFailed(true)) }
  const choose = (c: City) => {
    const label = c.id === "jp" || c.id === "else" ? c.name : cityLabel(c)
    setQ(label); document.getElementById("fly-from")?.blur()
    if (city && c.id === city.id) return
    setCity(c)
    keepFlying(token, c)
    void setFlying(token, { id: c.id, name: c.name, region: c.region, country: c.country, lat: c.lat, lon: c.lon }).catch(() => {})
  }
  // Leaving the field without picking: back to the last real choice (or empty)
  const settle = () => setQ(shown)
  const status = !typing ? "idle" : !index ? (failed ? "error" : "loading") : results.length ? "results" : "empty"
  return (
    <section aria-label={t.flying.endTitle} className="journey-end paper-feel">
      <div className="flex flex-col gap-2">
        <p id="fly-chips" className="form-label label-caps text-foreground">{t.flying.endTitle}</p>
        <ul aria-labelledby="fly-chips" className="fly-chips">
          {(CHIPS as City[]).map((c) => (
            <li key={String(c.id)}><button type="button" aria-pressed={city?.id === c.id} onClick={() => choose(c)} className="fly-chip">{c.id === "jp" ? t.flying.cities["Already in Japan"] ?? c.name : c.name}</button></li>
          ))}
        </ul>
      </div>
      <Combobox id="fly-from" label={pending("flying.orType", lang)} help={t.flying.hint} placeholder={t.flying.placeholder} query={q} onQuery={(v) => { load(); setQ(v) }} onFocusField={load} onLeave={settle}
        options={results.map((c) => ({ key: String(c.id), label: c.name, sub: [c.region, c.countryName].filter(Boolean).join(", ") || undefined, selected: city?.id === c.id }))}
        onPick={(o) => { const c = results.find((x) => String(x.id) === o.key); if (c) choose(c) }} onSubmit={() => (results[0] ? choose(results[0]) : settle())}
        status={status} emptyText={t.flying.noMatch} errorText={t.flying.noMatch} enterKeyHint="done" />
      <JourneyMini you={city} counts={counts?.counts} cities={counts?.cities} label={t.journey.map(city ? city.name : null, city?.id === "jp" ? "Already in Japan" : undefined)} className="journey-end-map" />
      {city && <p role="status" className="text-small text-muted-foreground">{t.flying.yours(city.id === "jp" ? "Already in Japan" : city.id === "else" ? "Somewhere else" : "city", city.name)}</p>}
    </section>
  )
}
