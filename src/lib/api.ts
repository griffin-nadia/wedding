import { config } from "./config"

export type Attending = "yes" | "no" | null

export type Guest = {
  id: string
  firstName: string
  attending: Attending
  dietary: string
}

export type Household = {
  token: string
  displayName: string // "Sam & Alex"
  guests: Guest[]
  songs: string[]
  arrival: string // yyyy-mm-dd or ""
  departure: string
  message: string
  respondedAt: string | null
}

export type RsvpPayload = Pick<Household, "guests" | "songs" | "arrival" | "departure" | "message">

// Without VITE_API_URL the site runs on this sample household, so pages can be
// designed and tested before the Apps Script back end is deployed.
const sample: Household = {
  token: "sample",
  displayName: "Sam & Alex",
  guests: [
    { id: "g1", firstName: "Sam", attending: null, dietary: "None" },
    { id: "g2", firstName: "Alex", attending: null, dietary: "None" },
  ],
  songs: [],
  arrival: "",
  departure: "",
  message: "",
  respondedAt: null,
}

export async function getHousehold(token: string): Promise<Household | null> {
  if (!config.apiUrl) return token ? { ...sample, token } : null
  const res = await fetch(`${config.apiUrl}?action=household&token=${encodeURIComponent(token)}`)
  if (!res.ok) throw new Error(`Lookup failed: ${res.status}`)
  const data = await res.json()
  return data.household ?? null
}

export async function saveRsvp(token: string, payload: RsvpPayload): Promise<Household> {
  if (!config.apiUrl) {
    await new Promise((r) => setTimeout(r, 400))
    return { ...sample, ...payload, token, respondedAt: new Date().toISOString() }
  }
  // text/plain keeps this a "simple" request, so the browser skips the CORS preflight
  // that Apps Script can't answer.
  const res = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "rsvp", token, ...payload }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error ?? "Save failed")
  return data.household
}
