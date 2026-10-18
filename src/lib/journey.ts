import type { Flying } from "@/lib/api"
import { placeOf, pointOf } from "@/lib/places"
import { onMap, type Region } from "@/lib/map-land"
import type { City } from "@/lib/city-search"

// The guest map's places: each country's real outline at its own scale (scripts/map-land.mjs), so not to scale
// between them. viewBox 400 × 320. Shared by Our story, the reply's mini map and the map after the fortune, so it
// reads as the same map travelling with the guest.
const at = (name: string) => pointOf(placeOf(name)!)
export const KYOTO: [number, number] = [132, 112]
export const PLACES: Record<string, [number, number]> = {
  brisbane: at("Brisbane"), canada: at("Canada"), kyoto: KYOTO, japan: at("Already in Japan"), melbourne: at("Melbourne"), sydney: at("Sydney"), perth: at("Perth"), adelaide: at("Adelaide"),
}
/** Every answer the sheet counts gets a line on the guest maps; "Somewhere else" comes in from the west edge. */
export const FROM: Record<Flying, [number, number]> = { Brisbane: PLACES.brisbane, Sydney: PLACES.sydney, Melbourne: PLACES.melbourne, Adelaide: PLACES.adelaide, Perth: PLACES.perth, "Elsewhere in Australia": at("Australia"), Canada: PLACES.canada, "Already in Japan": PLACES.japan, "Somewhere else": at("Somewhere else") }
export const arc = ([x1, y1]: [number, number], [x2, y2]: [number, number], lift = 0.3) => {
  const mx = (x1 + x2) / 2 - Math.abs(y2 - y1) * lift, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * lift
  return `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`
}

/** Where on the flat map a city's line starts: on its country's outline (Australia, New Zealand, Japan, Canada), or
 *  in from the edge it would fly from (the Americas from the east, everywhere else from the west) */
const REGIONS = new Set(["AU", "NZ", "JP", "CA"])
export function pointOfCity(c: City): [number, number] {
  if (c.lat == null || c.lon == null || !c.country) return [10, 168]
  if (REGIONS.has(c.country)) { const [x, y] = onMap(c.country as Region, c.lat, c.lon); return [Math.max(6, Math.min(394, x)), Math.max(6, Math.min(314, y))] }
  return c.lon < -30 ? [392, 150] : [10, 168]
}

/**
 * Where this household said it's flying from, kept on this device (final run: the city itself, with its id, region,
 * country and coordinates). An older answer (a place's name from 18f) is read as that place.
 */
const flyKey = (token: string) => `ng-flying:${token}`
export function readFlying(token?: string): City | null {
  if (!token) return null
  try {
    const raw = localStorage.getItem(flyKey(token))
    if (!raw) return null
    if (raw.startsWith("{")) return JSON.parse(raw) as City
    const p = placeOf(raw)
    return p ? { id: `place:${p.name}`, name: p.name, region: "", country: p.region ?? "", lat: p.region ? p.lat : null, lon: p.region ? p.lon : null } : null
  } catch { return null }
}
export function keepFlying(token: string, city: City) {
  try { localStorage.setItem(flyKey(token), JSON.stringify(city)) } catch { /* private mode */ }
  window.dispatchEvent(new Event("ng-flying")) // Home's map card shows the moment they pick
}
