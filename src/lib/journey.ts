import type { Flying } from "@/lib/api"

// The hand-drawn map's places (Figma D1 / M2): stylised, not to scale. viewBox 400 × 320. Shared by Our story,
// the reply's mini map and the map after the fortune, so it reads as the same map travelling with the guest.
export const KYOTO: [number, number] = [132, 112]
export const PLACES: Record<string, [number, number]> = {
  brisbane: [196, 272], canada: [318, 46], kyoto: KYOTO, japan: [150, 96], melbourne: [160, 296], sydney: [186, 288], perth: [70, 280], adelaide: [132, 290],
}
export const FLY: Partial<Record<Flying, [number, number]>> = { Brisbane: PLACES.brisbane, Sydney: PLACES.sydney, Melbourne: PLACES.melbourne, Adelaide: PLACES.adelaide, Perth: PLACES.perth, "Elsewhere in Australia": [110, 262], Canada: PLACES.canada, "Already in Japan": [178, 74] }
/** Every answer gets a line on the guest maps; "Somewhere else" comes in from the west edge. */
export const FROM: Record<Flying, [number, number]> = { ...FLY, "Somewhere else": [14, 168] } as Record<Flying, [number, number]>
export const arc = ([x1, y1]: [number, number], [x2, y2]: [number, number], lift = 0.3) => {
  const mx = (x1 + x2) / 2 - Math.abs(y2 - y1) * lift, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * lift
  return `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`
}

/** Where this household said it's flying from, kept on this device (the sheet only ever gets counts). */
const flyKey = (token: string) => `ng-flying:${token}`
export function readFlying(token?: string): Flying | null {
  if (!token) return null
  try { return localStorage.getItem(flyKey(token)) as Flying | null } catch { return null }
}
export function keepFlying(token: string, city: Flying) {
  try { localStorage.setItem(flyKey(token), city) } catch { /* private mode */ }
}
