import { useEffect, useRef, useState } from "react"
import { Combobox } from "@/components/combobox"
import { JourneyFlat } from "@/components/journey-flat"
import { geocode, getJourneys, setFlying, type Journey, type Place } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { cityLabel, loadCities, searchCities, type City, type CityIndex } from "@/lib/city-search"
import { config } from "@/lib/config"
import { useLang } from "@/lib/lang"

/**
 * After the fortune, on "You're all set": one optional card. Where are you flying from? (run 25)
 * - One field, "Type your city or town": any city or town in the world (Savusavu too), found by the back end's
 *   geocoder as they type (from 2 letters, after a short pause), as a short list of matches with region and country.
 *   With no back end (the plain build, the lab) the site's own list of cities answers instead.
 * - Nothing matches: "Can't find it? Drop a pin instead", then a tap on the map puts them there (the town at that spot).
 * Only a picked place is saved: its city or town and country, with the city's centre for the line (never a street).
 * The map under it is the journey stop's flat map (the same painting, lines and names as Our story), with their own
 * gold line. The city stays on this device too, so Home can show their line.
 */
export function JourneyEnd({ token }: { token: string }) {
  const { t } = useLang()
  const [city, setCity] = useState<City | null>(() => readFlying(token))
  const [journeys, setJourneys] = useState<Journey[]>([])
  useEffect(() => { void getJourneys(token).then(setJourneys) }, [token])
  const shown = city ? cityLabel(city) : ""
  const [q, setQ] = useState(shown)
  const [found, setFound] = useState<City[] | null>(null) // null: still looking (or nothing typed)
  const [failed, setFailed] = useState(false)
  const [pinning, setPinning] = useState(false)
  const index = useRef<CityIndex | null>(null)
  const mapBox = useRef<HTMLDivElement>(null) // the map comes into view to drop a pin on it
  const typing = q !== shown && q.trim().length >= 2
  // Search as they type: a short pause, then the geocoder (or, with no back end, the site's own list)
  useEffect(() => {
    if (!typing) { setFound(null); return }
    setFound(null); setFailed(false)
    const ctl = new AbortController()
    const wait = window.setTimeout(async () => {
      if (!config.apiUrl) {
        try { index.current ??= await loadCities(); setFound(searchCities(index.current, q)) } catch { setFailed(true) }
        return
      }
      const places = await geocode(token, { q: q.trim() }, ctl.signal)
      if (ctl.signal.aborted) return
      if (places) setFound(places.map(toCity)); else setFailed(true)
    }, 350)
    return () => { window.clearTimeout(wait); ctl.abort() }
  }, [q, typing, token])
  const choose = (c: City) => {
    setQ(cityLabel(c)); setPinning(false); document.getElementById("fly-from")?.blur()
    if (city && cityLabel(c) === cityLabel(city)) return
    setCity(c)
    keepFlying(token, c)
    void setFlying(token, { id: c.id, name: c.name, region: c.region, country: c.country, lat: c.lat, lon: c.lon }).catch(() => {})
  }
  // A dropped pin: the town at that spot (the back end), or just the spot when there's no answer
  const pin = async (lat: number, lon: number) => {
    const places = await geocode(token, { lat, lon })
    const p = places?.[0]
    choose(p ? { ...toCity(p), id: "pin", lat, lon } : { id: "pin", name: `${lat.toFixed(1)}, ${lon.toFixed(1)}`, region: "", country: "", lat, lon })
  }
  const settle = () => setQ(shown)
  const results = found ?? []
  const status = !typing ? "idle" : failed ? "error" : found === null ? "loading" : results.length ? "results" : "empty"
  return (
    <section aria-label={t.flying.endTitle} className="journey-end paper-feel">
      <Combobox id="fly-from" label={t.flying.endTitle} help={t.flying.hint} placeholder={t.flying.placeholder} query={q} onQuery={setQ} onLeave={settle}
        options={results.map((c, i) => ({ key: `${i}:${cityLabel(c)}`, label: c.name, sub: [c.region, c.countryName].filter(Boolean).join(", ") || undefined, selected: city ? cityLabel(c) === cityLabel(city) : false }))}
        onPick={(o) => { const c = results[Number(o.key.split(":")[0])]; if (c) choose(c) }} onSubmit={() => (results[0] ? choose(results[0]) : settle())}
        status={status} emptyText={t.flying.noMatch} errorText={t.flying.noMatch} enterKeyHint="done" />
      {(status === "empty" || status === "error" || pinning) && (
        <div className="flex flex-wrap items-center gap-x-4">
          {pinning
            ? <><p role="status" className="text-small text-foreground">{t.flying.pinHint}</p><button type="button" className="btn-text min-h-11" onClick={() => setPinning(false)}>{t.flying.pinCancel}</button></>
            : <button type="button" className="btn-text min-h-11" onClick={() => { setPinning(true); requestAnimationFrame(() => mapBox.current?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })) }}>{t.flying.dropPin}</button>}
        </div>
      )}
      <div ref={mapBox}><JourneyFlat you={city} cities={journeys} label={t.journey.map(city ? city.name : null)} onPick={pinning ? (lat, lon) => void pin(lat, lon) : undefined} /></div>
      {city && <p role="status" className="text-small text-muted-foreground">{t.flying.yours("city", city.name)}</p>}
    </section>
  )
}

const toCity = (p: Place): City => ({ id: "geo", name: p.name, region: p.region, country: p.country, countryName: p.countryName, lat: p.lat, lon: p.lon })
