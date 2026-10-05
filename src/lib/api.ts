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
  photos?: boolean | null // happy to be in photos shared with guests
}

export type RsvpPayload = Pick<Household, "guests" | "songs" | "arrival" | "departure" | "message" | "photos">

export type SaveResult = { household: Household; updated: boolean; changes: string[] }

/** Error codes from the back end, plus "network" when it couldn't be reached at all. */
export type ErrorCode =
  | "bad_request" | "not_found" | "bad_guest" | "bad_attending" | "bad_date"
  | "closed" | "busy" | "server" | "network" | "bad_email"

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
    photos: p.photos === true, // left unticked means no
    message: p.message.trim(),
  }
}

export async function saveRsvp(token: string, payload: RsvpPayload, before: Household, id = ""): Promise<SaveResult> {
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
    body: JSON.stringify({ action: "rsvp", id, token, ...clean }),
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

export type SongHit = { title: string; artist: string; url: string; artwork?: string }

/**
 * Song search: straight from the browser to Apple's public iTunes search (answers cross-origin GETs,
 * typically under 300 ms). Only the search words go, never who's asking. If that fails, our back end
 * searches instead (and Spotify, which needs a secret). null = search isn't working; typing still works.
 */
export async function searchSongs(q: string, token: string, signal?: AbortSignal): Promise<SongHit[] | null> {
  const term = q.trim()
  if (term.length < 2) return []
  try {
    const res = await fetch(`https://itunes.apple.com/search?media=music&entity=song&limit=25&country=AU&term=${encodeURIComponent(term)}`, { signal })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json() as { results?: { trackName?: string; artistName?: string; trackViewUrl?: string; artworkUrl60?: string; artworkUrl100?: string }[] }
    return (data.results ?? []).filter((r) => r.trackName && r.artistName)
      .map((r) => ({ title: r.trackName!, artist: r.artistName!, url: r.trackViewUrl ?? "", artwork: r.artworkUrl100 ?? r.artworkUrl60 }))
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return []
    return searchViaScript(term, token, signal)
  }
}

async function searchViaScript(q: string, token: string, signal?: AbortSignal): Promise<SongHit[] | null> {
  if (!config.apiUrl) return null
  try {
    const res = await fetch(`${config.apiUrl}?action=songs&token=${encodeURIComponent(token)}&q=${encodeURIComponent(q)}`, { signal })
    const data = await res.json()
    return Array.isArray(data.results) ? data.results : null
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return []
    return null
  }
}

/** Wake the back end when the RSVP opens, so a save (or the search fallback) isn't a cold start. */
export function warmUp() {
  if (!config.apiUrl) return
  fetch(`${config.apiUrl}?action=ping`, { mode: "no-cors" }).catch(() => {})
}

/** "Can't find your invite?": asks the back end to email the household link. Same answer either way. */
export async function resendLink(email: string): Promise<void> {
  if (!config.apiUrl) { await new Promise((r) => setTimeout(r, 400)); return }
  const data = await call(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "resend", email: email.trim() }),
  })
  if (!data.ok) throw new ApiError((data.code as ErrorCode) ?? "server", data.error)
}

/**
 * Saves with up to 3 tries (1 s, 2 s, 4 s apart) when the server is busy or the connection drops.
 * The same id goes with every try, so the back end never saves the reply twice.
 */
export async function saveRsvpWithRetry(token: string, payload: RsvpPayload, before: Household, id: string, tries = 3): Promise<SaveResult> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await saveRsvp(token, payload, before, id)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "network"
      const retryable = code === "busy" || code === "network" || code === "server"
      if (!retryable || attempt >= tries) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)))
    }
  }
}

/** A reply in progress, kept on this device so nothing typed is ever lost. */
const draftKey = (token: string) => `ng-draft-${token}`
export function readDraft(token: string): { form: RsvpPayload; at: number } | null {
  try { return JSON.parse(localStorage.getItem(draftKey(token)) ?? "null") } catch { return null }
}
export function writeDraft(token: string, form: RsvpPayload) {
  try { localStorage.setItem(draftKey(token), JSON.stringify({ form, at: Date.now() })) } catch { /* private mode */ }
}
export function clearDraft(token: string) {
  try { localStorage.removeItem(draftKey(token)) } catch { /* private mode */ }
}

export const FLYING = ["Brisbane", "Melbourne", "Sydney", "Perth", "Adelaide", "Elsewhere in Australia", "Canada", "Already in Japan", "Somewhere else"] as const
export type Flying = (typeof FLYING)[number]

/** Optional, after RSVP: where the household is flying from (a fixed list). Only counts are ever shown. */
export async function setFlying(token: string, city: Flying): Promise<void> {
  if (!config.apiUrl) return
  const data = await call(config.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "flying", token, city }) })
  if (!data.ok) throw new ApiError((data.code as ErrorCode) ?? "server", data.error)
}

/** Households per city and how many have told us, e.g. 17 of 40. Never names. */
export async function getFlying(): Promise<{ counts: Partial<Record<Flying, number>>; told: number; households: number } | null> {
  if (!config.apiUrl) return null
  try { const d = await call(`${config.apiUrl}?action=flying`); return d.ok ? d : null } catch { return null }
}

/** The 12 fortunes from the sheet's Content tab (falls back to the built-in drafts). */
export async function getFortunes(): Promise<string[] | null> {
  if (!config.apiUrl) return null
  try { const d = await call(`${config.apiUrl}?action=fortunes`); return d.ok && Array.isArray(d.fortunes) ? d.fortunes : null } catch { return null }
}

/** Concept B: the stamps a household has collected, saved to its Stamps column. Fire and forget. */
export async function saveStamps(token: string, stamps: string[]): Promise<void> {
  if (!config.apiUrl || token === "sample") return
  try {
    await fetch(config.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "stamps", token, stamps }) })
  } catch { /* the device keeps them anyway */ }
}

/** Crew links (/kit and /lab): true only for a token in the sheet's Crew tab. No back end (local sample mode) lets everyone in. */
export async function checkCrew(token: string): Promise<"yes" | "no" | "error"> {
  if (!config.apiUrl) return "yes"
  if (!token) return "no"
  try { const d = await call(`${config.apiUrl}?action=crew&token=${encodeURIComponent(token)}`); return d.ok === true && typeof d.name === "string" && d.name.length > 0 ? "yes" : "no" } catch { return "error" }
}
