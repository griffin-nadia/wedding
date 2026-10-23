import { useEffect, useRef, useState } from "react"
import { Combobox } from "@/components/combobox"
import { JourneyFlat } from "@/components/journey-flat"
import { geocode, getJourneys, setFlying, type Journey, type Place } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { cityLabel, loadCities, searchable, searchCities, type City, type CityIndex } from "@/lib/city-search"
import { config } from "@/lib/config"
import { useLang } from "@/lib/lang"

/**
 * After the fortune, on "You're all set": one optional card. Where are you flying from? (run 25)
 * - One field, "Type your city or town": any city or town in the world (Savusavu too), found by the back end's
 *   geocoder as they type (run 26: from 3 letters, or 2 in Japanese, after a 300 ms pause; the last results stay on
 *   screen while the next ones load), as a short list of matches, each with its place, region and country.
 *   With no back end (the plain build, the lab) the site's own list of cities answers instead. Answers are kept for
 *   this visit (in memory only), so going back over what you typed never asks again.
 * - Nothing matches: "Can't find it? Drop a pin instead", then a tap on the map puts them there (the town at that spot).
 * Only a picked place is saved: its city or town and country, with the city's centre for the line (never a street,
 * and a dropped pin saves the town's centre, not the spot tapped). Run 26: no region in what's saved.
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
  const [found, setFound] = useState<City[]>([]) // the last answer, kept on screen while the next one loads
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [pinning, setPinning] = useState(false)
  const index = useRef<CityIndex | null>(null)
  const mapBox = useRef<HTMLDivElement>(null) // the map comes into view to drop a pin on it
  const typing = q !== shown && searchable(q)
  // Search as they type: a 300 ms pause, then the geocoder (or, with no back end, the site's own list)
  useEffect(() => {
    if (!typing) { setFound([]); setLoading(false); setFailed(false); return }
    const key = q.trim().toLowerCase(), hit = answers.get(key)
    if (hit) { setFound(hit); setLoading(false); setFailed(false); return }
    setLoading(true); setFailed(false)
    const ctl = new AbortController()
    const land = (r: City[] | null) => { if (ctl.signal.aborted) return; if (r) answers.set(key, r); setFound(r ?? []); setFailed(!r); setLoading(false) }
    const wait = window.setTimeout(async () => {
      if (!config.apiUrl) {
        try { index.current ??= await loadCities(); land(searchCities(index.current, q)) } catch { land(null) }
        return
      }
      const places = await geocode(token, { q: q.trim() }, ctl.signal)
      land(places && places.map(toCity))
    }, 300)
    return () => { window.clearTimeout(wait); ctl.abort() }
  }, [q, typing, token])
  const choose = (picked: City) => {
    const c = { ...picked, region: "" } // saved: the city or town and its country (with its centre for the line)
    setQ(cityLabel(c)); setPinning(false); document.getElementById("fly-from")?.blur()
    if (city && same(c, city)) return
    setCity(c)
    keepFlying(token, c)
    void setFlying(token, { id: c.id, name: c.name, region: "", country: c.country, lat: c.lat, lon: c.lon }).catch(() => {})
  }
  // A dropped pin: the town at that spot and its centre (the back end), or, with no answer, the spot to 0.1° (about
  // 10 km), never the exact tap
  const pin = async (lat: number, lon: number) => {
    const places = await geocode(token, { lat, lon })
    const p = places?.[0], near = (n: number) => Math.round(n * 10) / 10
    choose(p ? { ...toCity(p), id: "pin", lat: p.lat ?? near(lat), lon: p.lon ?? near(lon) } : { id: "pin", name: `${lat.toFixed(1)}, ${lon.toFixed(1)}`, region: "", country: "", lat: near(lat), lon: near(lon) })
  }
  // Leaving the field puts back what's picked. Read when it runs (150 ms after the blur), not when the blur happened:
  // a pick blurs the field before the new city has rendered, which used to empty it
  const shownNow = useRef(shown)
  shownNow.current = shown
  const settle = () => setQ(shownNow.current)
  const results = typing ? found : []
  const status = !typing ? "idle" : loading ? "loading" : failed ? "error" : results.length ? "results" : "empty"
  return (
    <section aria-label={t.flying.endTitle} className="journey-end paper-feel">
      <Combobox id="fly-from" label={t.flying.endTitle} help={t.flying.hint} placeholder={t.flying.placeholder} query={q} onQuery={setQ} onLeave={settle}
        options={results.map((c, i) => ({ key: `${i}:${cityLabel(c)}`, label: c.name, sub: [c.region, c.countryName].filter(Boolean).join(", ") || undefined, selected: city ? same(c, city) : false }))}
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

// Answers for this visit, by what was typed (memory only, gone on reload)
const answers = new Map<string, City[]>()
const same = (a: City, b: City) => a.name === b.name && a.country === b.country && a.lat === b.lat && a.lon === b.lon
const toCity = (p: Place): City => ({ id: "geo", name: p.name, region: p.region, country: p.country, countryName: p.countryName, lat: p.lat, lon: p.lon })
