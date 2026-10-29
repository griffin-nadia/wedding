import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Maximize2 } from "lucide-react"
import { Combobox } from "@/components/combobox"
import { JourneyFlat } from "@/components/journey-flat"
import { geocode, getFlying, getJourneys, setFlying, type Journey, type Place } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { cityLabel, loadCities, searchable, searchCities, type City, type CityIndex } from "@/lib/city-search"
import { config } from "@/lib/config"
import { useLang } from "@/lib/lang"

/**
 * Where are you flying from? (run 25), two steps of the reply since run 26 (Jehan's call, 23 Oct): the field, then
 * the map on its own, both before the check and the fortune. Optional: Next with nothing picked moves on.
 * - One field, "Type your city or town": any city or town in the world (Savusavu too), found by the back end's
 *   geocoder as they type (run 26: from 3 letters, or 2 in Japanese, after a 300 ms pause; the last results stay on
 *   screen while the next ones load), as a short list of matches, each with its place, region and country.
 *   With no back end (the plain build, the lab) the site's own list of cities answers instead. Answers are kept for
 *   this visit (in memory only), so going back over what you typed never asks again.
 * - Nothing matches: "Can't find it? Drop a pin instead" goes to the map step, where a tap puts them there (the town
 *   at that spot).
 * Only a picked place is saved, the moment it's picked: its city or town and country, with the city's centre for the
 * line (never a street, and a dropped pin saves the town's centre, not the spot tapped). Run 26: no region in it.
 * The map is the journey stop's flat map (the same painting, lines and names as Our story), with their own gold line.
 * The city stays on this device too, so Home and Our story can show their line.
 */
// eslint-disable-next-line react-refresh/only-export-components -- the sheet holds the flying state for both steps
export function useFlying(token: string) {
  const [city, setCity] = useState<City | null>(() => readFlying(token))
  const [journeys, setJourneys] = useState<Journey[]>([])
  useEffect(() => { if (token) void getJourneys(token).then(setJourneys) }, [token])
  const [pinning, setPinning] = useState(false)
  const choose = (picked: City) => {
    const c = { ...picked, region: "" } // saved: the city or town and its country (with its centre for the line)
    setPinning(false)
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
  return { token, city, journeys, pinning, setPinning, choose, pin }
}
export type Flying = ReturnType<typeof useFlying>

/** The field step. onDropPin: nothing matched and they'd rather tap the map (the next step) */
export function FlyingField({ fly, onDropPin }: { fly: Flying; onDropPin: () => void }) {
  const { t } = useLang()
  const { token, city } = fly
  const shown = city ? cityLabel(city) : ""
  const [q, setQ] = useState(shown)
  const [found, setFound] = useState<City[]>([]) // the last answer, kept on screen while the next one loads
  const [foundFor, setFoundFor] = useState("") // what was typed for that answer
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const index = useRef<CityIndex | null>(null)
  const typing = q !== shown && searchable(q)
  // Search as they type: a 300 ms pause, then the geocoder (or, with no back end, the site's own list)
  useEffect(() => {
    if (!typing) { setFound([]); setFoundFor(""); setLoading(false); setFailed(false); return }
    const key = keyOf(q), hit = answers.get(key)
    if (hit) { setFound(hit); setFoundFor(key); setLoading(false); setFailed(false); return }
    setLoading(true); setFailed(false)
    const ctl = new AbortController()
    const land = (r: City[] | null) => { if (ctl.signal.aborted) return; if (r) answers.set(key, r); setFound(r ?? []); setFoundFor(key); setFailed(!r); setLoading(false) }
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
  const choose = (picked: City) => { setQ(cityLabel({ ...picked, region: "" })); document.getElementById("fly-from")?.blur(); fly.choose(picked) }
  // Leaving the field puts back what's picked. Read when it runs (150 ms after the blur), not when the blur happened:
  // a pick blurs the field before the new city has rendered, which used to empty it
  const shownNow = useRef(shown)
  shownNow.current = shown
  const settle = () => setQ(shownNow.current)
  const results = typing ? found : []
  // Run 26 live bug: Enter (the phone keyboard's Done) picked the first row of the list on screen, which while the next
  // search loads is the last search's ("Victoria" typed, then "Sydney" and Done: Victoria, Canada was saved), or with
  // nothing on screen put the last pick back. Enter now picks only from the answer to what's in the field.
  const fresh = foundFor === keyOf(q)
  const status = !typing ? "idle" : loading ? "loading" : failed ? "error" : results.length ? "results" : "empty"
  return (
    <div className="journey-from flex flex-col gap-3">
      <Combobox id="fly-from" label={t.flying.placeholder} help={t.flying.hint} query={q} onQuery={setQ} onLeave={settle}
        options={results.map((c, i) => ({ key: `${i}:${cityLabel(c)}`, label: c.name, sub: [c.region, c.countryName].filter(Boolean).join(", ") || undefined, selected: city ? same(c, city) : false }))}
        onPick={(o) => { const c = results[Number(o.key.split(":")[0])]; if (c) choose(c) }} onSubmit={() => { if (fresh && results[0]) choose(results[0]); else if (!typing) settle() }}
        // Run 26 live bug: "Nothing found" was a box floating over the page, on top of "Drop a pin instead". It's in the
        // page now, with the pin button under it, so nothing ever covers the button
        status={status} enterKeyHint="done" />
      {(status === "empty" || status === "error") && (
        <div className="flex flex-col items-start">
          <p role="status" className="text-small text-muted-foreground">{t.flying.noMatch}</p>
          <button type="button" className="btn-text min-h-11" onClick={() => { fly.setPinning(true); onDropPin() }}>{t.flying.dropPin}</button>
        </div>
      )}
      {city && !typing && <p role="status" className="text-small text-muted-foreground">{t.flying.yours("city", city.name)}</p>}
    </div>
  )
}

/** The map step: their gold line from where they picked, or a tap to drop a pin */
export function FlyingMap({ fly }: { fly: Flying }) {
  const { t } = useLang()
  const { city, journeys, pinning } = fly
  // Run 27: how many households have drawn their line so far, under the map (as in the story's full screen)
  const [told, setTold] = useState<{ told: number; households: number } | null>(null)
  useEffect(() => { let on = true; void getFlying().then((f) => on && f && f.households > 0 && setTold(f)); return () => { on = false } }, [])
  return (
    <div className="journey-end flex flex-col gap-3">
      {pinning && (
        <div className="flex flex-wrap items-center gap-x-4">
          <p role="status" className="text-small text-foreground">{t.flying.pinHint}</p>
          <button type="button" className="btn-text min-h-11" onClick={() => fly.setPinning(false)}>{t.flying.pinCancel}</button>
        </div>
      )}
      {/* Run 26c (Jehan): Full screen, with Globe / Map, as on Our story's journey stop (loaded only on this step) */}
      {!pinning && (
        <Suspense fallback={null}>
          <JourneyViewer pins={NO_PINS} onPin={() => {}}
            trigger={<button type="button" className="journey-open self-center" aria-label={t.journey.openLabel}><Maximize2 className="size-4" aria-hidden />{t.journey.open}</button>} />
        </Suspense>
      )}
      <JourneyFlat you={city} cities={journeys} label={t.journey.map(city ? city.name : null)} onPick={pinning ? (lat, lon) => void fly.pin(lat, lon) : undefined} />
      {/* Run 26c (the review): the "From Melbourne" line under the map is gone (their gold line says it); screen
          readers still hear where they picked */}
      {city && !pinning && <p role="status" className="sr-only">{t.flying.yours("city", city.name)}</p>}
      {/* 29 Oct (Jehan): the line keeps its row from the first paint (a blank line until the count arrives), so the
          step doesn't jump when it does */}
      {!pinning && <p className="text-small text-muted-foreground text-center">{told ? t.journey.count(told.told) : "\u00a0"}</p>}
    </div>
  )
}

// The story's full-screen journey viewer, only once the map step shows (it lives with Our story's code)
const JourneyViewer = lazy(() => import("@/components/story-journey").then((m) => ({ default: m.JourneyViewer })))
const NO_PINS: never[] = []

// Answers for this visit, by what was typed (memory only, gone on reload)
const keyOf = (typed: string) => typed.trim().toLowerCase()
const answers = new Map<string, City[]>()
const same = (a: City, b: City) => a.name === b.name && a.country === b.country && a.lat === b.lat && a.lon === b.lon
const toCity = (p: Place): City => ({ id: "geo", name: p.name, region: p.region, country: p.country, countryName: p.countryName, lat: p.lat, lon: p.lon })
