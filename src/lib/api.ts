import { config } from "./config"

export type Attending = "yes" | "no" | null

export type Guest = {
  id: string
  firstName: string
  attending: Attending
  dietary: string
  plusOne?: boolean // an unnamed "Guest" the household can name
}

export type Household = {
  token: string
  displayName: string // "Sam & Alex"
  guests: Guest[]
  hasEmail?: boolean
  songs: string[]
  arrival: string // yyyy-mm-dd or ""
  departure: string
  message: string
  respondedAt: string | null
}

export type RsvpPayload = Pick<Household, "guests" | "songs" | "arrival" | "departure" | "message">

export type SaveResult = { household: Household; updated: boolean; changes: string[] }

/** Error codes from the back end, plus "network" when it couldn't be reached at all. */
export type ErrorCode =
  | "bad_request" | "not_found" | "bad_guest" | "bad_attending" | "bad_date"
  | "closed" | "busy" | "server" | "network"

export class ApiError extends Error {
  code: ErrorCode
  constructor(code: ErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

// Without VITE_API_URL the site runs on this sample household, so pages can be
// designed and tested before the Apps Script back end is deployed.
const sample: Household = {
  token: "sample",
  displayName: "Sam & Alex",
  guests: [
    { id: "g1", firstName: "Sam", attending: null, dietary: "None" },
    { id: "g2", firstName: "Alex", attending: null, dietary: "None" },
    { id: "g3", firstName: "Guest", attending: null, dietary: "None", plusOne: true },
  ],
  hasEmail: true,
  songs: [],
  arrival: "",
  departure: "",
  message: "",
  respondedAt: null,
}

async function call(input: string, init?: RequestInit) {
  let res: Response
  try {
    res = await fetch(input, init)
  } catch {
    throw new ApiError("network")
  }
  if (!res.ok) throw new ApiError(res.status >= 500 ? "server" : "network")
  try {
    return await res.json()
  } catch {
    throw new ApiError("server")
  }
}

export async function getHousehold(token: string): Promise<Household | null> {
  if (!config.apiUrl) return token ? { ...sample, token } : null
  const data = await call(`${config.apiUrl}?action=household&open=1&token=${encodeURIComponent(token)}`)
  return data.household ?? null
}

/** Removes blank songs and trims text before sending. */
export function cleanPayload(p: RsvpPayload): RsvpPayload {
  return {
    ...p,
    guests: p.guests.map((g) => ({ ...g, firstName: g.firstName.trim(), dietary: g.attending === "yes" ? g.dietary : "None" })),
    songs: p.songs.map((s) => s.trim()).filter(Boolean),
    message: p.message.trim(),
  }
}

export async function saveRsvp(token: string, payload: RsvpPayload, before: Household): Promise<SaveResult> {
  const clean = cleanPayload(payload)
  if (!config.apiUrl) {
    await new Promise((r) => setTimeout(r, 400))
    return {
      household: { ...sample, ...clean, token, respondedAt: new Date().toISOString() },
      updated: Boolean(before.respondedAt),
      changes: [],
    }
  }
  // text/plain keeps this a "simple" request, so the browser skips the CORS preflight
  // that Apps Script can't answer.
  const data = await call(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "rsvp", token, ...clean }),
  })
  if (!data.ok) throw new ApiError((data.code as ErrorCode) ?? "server", data.error)
  return { household: data.household, updated: Boolean(data.updated), changes: data.changes ?? [] }
}

/** "all" coming, "none" coming, or "mixed". Guests without an answer count as not coming. */
export function answerOf(h: Pick<Household, "guests">): "all" | "none" | "mixed" {
  const yes = h.guests.filter((g) => g.attending === "yes").length
  return yes === h.guests.length ? "all" : yes === 0 ? "none" : "mixed"
}

/**
 * Privacy-first visit counts, kept in our own sheet: no cookies, no IP, no third parties.
 * Fire and forget, so a slow or failed call never gets in a guest's way.
 */
export function trackStarted(token: string) {
  if (!config.apiUrl || token === "sample") return
  try {
    if (sessionStorage.getItem(`ng-started-${token}`)) return
    sessionStorage.setItem(`ng-started-${token}`, "1")
  } catch { /* private mode: the server ignores repeats anyway */ }
  fetch(`${config.apiUrl}?action=started&token=${encodeURIComponent(token)}`, { mode: "no-cors" }).catch(() => {})
}

export type SongHit = { title: string; artist: string; url: string }

// Song search is off until the back end has Spotify keys. Once it says so, stop asking this visit.
let songSearchOff = !config.apiUrl

/** Spotify search through our back end (guests never talk to Spotify directly). [] when off. */
export async function searchSongs(q: string, signal?: AbortSignal): Promise<SongHit[]> {
  if (songSearchOff || q.trim().length < 2) return []
  try {
    const res = await fetch(`${config.apiUrl}?action=songs&q=${encodeURIComponent(q.trim())}`, { signal })
    const data = await res.json()
    if (!Array.isArray(data.results)) {
      if (data.code !== "search_failed") songSearchOff = true
      return []
    }
    return data.results
  } catch {
    return []
  }
}
