import type { Flying } from "@/lib/api"
import { placeOf, pointOf } from "@/lib/places"

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

/** Where this household said it's flying from (a place's name), kept on this device (the sheet only ever gets counts). */
const flyKey = (token: string) => `ng-flying:${token}`
export function readFlying(token?: string): string | null {
  if (!token) return null
  try { return placeOf(localStorage.getItem(flyKey(token)))?.name ?? null } catch { return null }
}
export function keepFlying(token: string, city: string) {
  try { localStorage.setItem(flyKey(token), city) } catch { /* private mode */ }
  window.dispatchEvent(new Event("ng-flying")) // Home's map card shows the moment they pick
}
