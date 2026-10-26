import { config } from "./config"
import { ApiError, call, isRetryable, type ErrorCode } from "./call"
import { isDraws, type Draw } from "./draws"

export { ApiError, type ErrorCode }

export type Attending = "yes" | "no" | null

export type Guest = {
  id: string
  firstName: string
  nameJa?: string // run 27: how the Japanese site greets them (Guests → Japanese name), when set
  attending: Attending
  dietary: string
  plusOne?: boolean // an unnamed "Guest" the household can name
}

/** A guest's name as the site shows it: their Japanese name on the Japanese site when they have one */
export const nameFor = (g: Guest, lang: string) => (lang === "ja" && g.nameJa ? g.nameJa : g.firstName)

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
  preview?: "en" | "ja" // a review link (run 21): a made-up household, replies not saved; the language it opens in
}

export type RsvpPayload = Pick<Household, "guests" | "songs" | "arrival" | "departure" | "message" | "photos">

export type SaveResult = { household: Household; updated: boolean; changes: string[] }

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

export async function getHousehold(token: string): Promise<Household | null> {
  // Without a back end, ?h=preview-en and ?h=preview-ja stand in for the two review links (run 21)
  if (!config.apiUrl) return token ? { ...sample, token, ...(token === "preview-en" || token === "preview-ja" ? { preview: token.slice(8) as "en" | "ja" } : {}) } : null
  const data = await call(`${config.apiUrl}?action=household&open=1&token=${encodeURIComponent(token)}`)
  // An error answer (the sheet wouldn't open, as on 19 Oct 2026) is our trouble, never "we don't know this link"
  if (!data.ok) throw new ApiError(data.code === "not_found" ? "not_found" : "server", data.error)
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

/** "all" coming, "none" coming, or "mixed". Guests without an answer count as not coming. A plus one nobody is
 * bringing isn't someone missing (run 19 UX test: every named guest coming read "Thanks, got it", not "all set"). */
export function answerOf(h: Pick<Household, "guests">): "all" | "none" | "mixed" {
  const counted = h.guests.filter((g) => !g.plusOne || g.attending === "yes")
  const yes = counted.filter((g) => g.attending === "yes").length
  return yes === counted.length && yes > 0 ? "all" : yes === 0 ? "none" : "mixed"
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

/**
 * Ask us (final run): a question to Griffin and Nadia. From an invite the token says who; without one (can't find
 * your invite) a name and an email come with it. `website` is the hidden field only a bot fills in.
 */
export async function askUs(q: { question: string; token?: string; name?: string; email?: string; website?: string }): Promise<void> {
  if (!config.apiUrl) { await new Promise((r) => setTimeout(r, 400)); return }
  const data = await call(config.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "ask", ...q }) })
  if (!data.ok) throw new ApiError((data.code as ErrorCode) ?? "server", data.error)
}
/** Feedback from a review link (run 21), with where it was left. Into the Feedback tab. */
export async function sendFeedback(f: { token: string; note: string; page: string; theme: string; viewport: string; lang: string }): Promise<void> {
  if (!config.apiUrl) { await new Promise((r) => setTimeout(r, 400)); return }
  const data = await call(config.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "feedback", ...f }) })
  if (!data.ok) throw new ApiError((data.code as ErrorCode) ?? "server", data.error)
}
/** The questions Griffin and Nadia have answered and published, for the FAQs' "You asked" (no names) */
export type Asked = { q: string; a: string; a_ja?: string }
export async function getQuestions(): Promise<Asked[]> {
  if (!config.apiUrl) return []
  try { const d = await call(`${config.apiUrl}?action=questions`); return d.ok && Array.isArray(d.questions) ? (d.questions as Asked[]) : [] } catch { return [] } // an older back end has none: none, not a crash
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
      if (!isRetryable(code) || attempt >= tries) throw err
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

/** Optional, after RSVP: where the household is flying from (final run: the city, with its id, country and
 *  coordinates, so the globe can draw any city). Only counts per city are ever shown, never who. */
export type FlyingCity = { id: number | string; name: string; region?: string; country: string; lat: number | null; lon: number | null }
export async function setFlying(token: string, city: FlyingCity): Promise<void> {
  if (!config.apiUrl) return
  const data = await call(config.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "flying", token, city }) })
  if (!data.ok) throw new ApiError((data.code as ErrorCode) ?? "server", data.error)
}

/** Run 27: the Travel checklist's ticked rows for this link, the same on every device. null: no back end, or an
 *  older one that doesn't keep them (the ticks then stay on this device only). */
export async function getTicks(token: string): Promise<string[] | null> {
  if (!config.apiUrl || !token) return null
  try {
    const d = await call(`${config.apiUrl}?action=ticks&token=${encodeURIComponent(token)}`)
    return d.ok && Array.isArray(d.ticks) ? (d.ticks as string[]) : null
  } catch { return null }
}
/** Saves the whole list of ticked rows. Fire and forget: the tick has already shown, and this device keeps it too. */
export function saveTicks(token: string, ticks: string[]) {
  if (!config.apiUrl || !token) return
  void call(config.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "ticks", token, ticks }) }).catch(() => {})
}

/** Run 25: any city or town, through the back end's geocoder (q), or the place at a dropped pin (lat, lon). Up to five
 *  places, each a city or town with its region, country and centre. null: no back end, or it couldn't answer. */
export type Place = { name: string; region: string; country: string; countryName: string; lat: number | null; lon: number | null }
export async function geocode(token: string, where: { q: string } | { lat: number; lon: number }, signal?: AbortSignal): Promise<Place[] | null> {
  if (!config.apiUrl) return null
  const qs = "q" in where ? `q=${encodeURIComponent(where.q)}` : `lat=${where.lat.toFixed(3)}&lon=${where.lon.toFixed(3)}`
  try { const d = await call(`${config.apiUrl}?action=geocode&token=${encodeURIComponent(token)}&${qs}`, { signal }); return d.ok && Array.isArray(d.places) ? (d.places as Place[]) : null } catch { return null }
}

/** Households per city and how many have told us, e.g. 17 of 40. Never names. */
export async function getFlying(): Promise<{ counts: Partial<Record<Flying, number>>; cities?: { name: string; country: string; lat: number; lon: number; n: number }[]; told: number; households: number } | null> {
  if (!config.apiUrl) return null
  try { const d = await call(`${config.apiUrl}?action=flying`); return d.ok && d.counts && typeof d.counts === "object" ? d : null } catch { return null } // no counts (an odd answer): none, not a crash
}

/** The globe's lines: per city, how many coming households and where (never who). No back end (the lab, previews,
 *  the plain build) or the sample household (run 19: so the look can always be judged): a few sample cities. */
export type Journey = { name: string; country: string; lat: number; lon: number; n: number }
export const SAMPLE_JOURNEYS: Journey[] = [
  { name: "Melbourne", country: "AU", lat: -37.81, lon: 144.96, n: 6 }, { name: "Sydney", country: "AU", lat: -33.87, lon: 151.21, n: 3 },
  { name: "Gold Coast", country: "AU", lat: -28.0, lon: 153.43, n: 2 }, { name: "Perth", country: "AU", lat: -31.95, lon: 115.86, n: 1 },
  { name: "Vancouver", country: "CA", lat: 49.28, lon: -123.12, n: 3 }, { name: "Calgary", country: "CA", lat: 51.05, lon: -114.07, n: 2 },
  { name: "Auckland", country: "NZ", lat: -36.85, lon: 174.76, n: 1 }, { name: "London", country: "GB", lat: 51.51, lon: -0.13, n: 1 },
]
export async function getJourneys(token?: string): Promise<Journey[]> {
  if (!config.apiUrl || token === "sample") return SAMPLE_JOURNEYS
  try { const d = await call(`${config.apiUrl}?action=journeys`); return d.ok && Array.isArray(d.cities) ? (d.cities as Journey[]) : [] } catch { return [] } // an older back end has no journeys: none, not a crash
}

/** One omikuji (run 23): Nadia's tier in English and Japanese, its category and the words. draft (run 26): a fortune
 *  marked Draft in the Fortunes tab's Draft column, drawn only while config.storyFortunes is on (on since run 26c).
 *  textJa (run 26): the Japanese column, shown with Japanese on; empty or missing (an older back end): the English */
export type Fortune = { no: number; tier: string; tierJa: string; category: string; text: string; draft?: boolean; textJa?: string }
/** The fortunes from the sheet's Fortunes tab (null: use the built-in drafts), and this household's draws (run 26; null
 *  from an older back end, which doesn't keep them). An older back end still answers plain strings. */
export async function getFortunes(token: string): Promise<{ fortunes: Fortune[]; draws: Draw[] | null } | null> {
  if (!config.apiUrl) return null
  try {
    const d = await call(`${config.apiUrl}?action=fortunes&token=${encodeURIComponent(token)}`) // only for a real link (run 23)
    if (!d.ok || !Array.isArray(d.fortunes)) return null
    const fortunes = (d.fortunes as (Fortune | string)[]).map((f, i) => (typeof f === "string" ? { no: i + 1, tier: "Great Blessing", tierJa: "大吉", category: "", text: f } : f))
    return { fortunes, draws: isDraws(d.draws) ? d.draws : null }
  } catch { return null }
}
/** Run 26: saves one draw against the household (appended in the Draws tab; a number already there is kept as it
 *  was). Quiet on failure: this device's own list still has it. */
export async function saveDraw(token: string, draw: Draw): Promise<void> {
  if (!config.apiUrl) return
  try { await call(config.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "draw", token, ...draw }) }) } catch { /* kept on this device */ }
}

/** Crew links (the tuning panel and /kit; the lab is local only since 18 Oct): true only for a token in the sheet's Crew tab. No back end (local sample mode) lets everyone in. */
export async function checkCrew(token: string): Promise<"yes" | "no" | "error"> {
  if (!config.apiUrl) return "yes"
  if (!token) return "no"
  try { const d = await call(`${config.apiUrl}?action=crew&token=${encodeURIComponent(token)}`); return d.ok === true && typeof d.name === "string" && d.name.length > 0 ? "yes" : "no" } catch { return "error" }
}

/** Their stay picks from the planner (Accommodation Options), or null if the back end can't say. */
export async function getStayPicks(): Promise<unknown> {
  if (!config.apiUrl) return null
  try { return await call(`${config.apiUrl}?action=stay`) } catch { return null }
}
