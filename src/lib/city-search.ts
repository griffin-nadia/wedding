import { SUBURBS } from "./city-aliases.ts"

/**
 * "Where are you flying from?" (final run): real cities only, like a map's search but all on this device. The index
 * (public/data/cities.json, GeoNames, scripts/cities-build.mjs) is fetched the first time the field is focused,
 * never on page load, and nothing is sent anywhere while typing.
 * Matching: a suburb or short name sends you to its city (North Melbourne → Melbourne); a state or province typed
 * alone suggests its capital and main cities; then exact names, names starting with what's typed, any word starting
 * with it, and near misses (typos: Melborne, Vancover, Brisbne); accents ignored (Montreal finds Montréal); Japanese
 * names too (東京, 札幌). Ranked: exact first, then Australia, Canada, Japan and New Zealand, then by population.
 * Every suggestion says its region and country, so the same name in two places is never a guess.
 */
export type City = { id: number | string; name: string; region: string; country: string; countryName?: string; lat: number | null; lon: number | null }
type Entry = City & { pop: number; capital: boolean; keys: string[]; words: string[]; regionKey: string }
export type CityIndex = { entries: Entry[]; countries: Record<string, string> }

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
const HOME = new Set(["AU", "CA", "JP", "NZ"])
export const SOMEWHERE_ELSE: City = { id: "else", name: "Somewhere else", region: "", country: "", lat: null, lon: null }

type Raw = { countries: Record<string, string>; rows: [number, string, string, string, string, string, number, number, number, number][] }
export function buildIndex(raw: Raw): CityIndex {
  const entries = raw.rows.map(([id, name, ascii, alts, region, country, lat, lon, pop, capital]) => {
    const keys = [...new Set([name, ascii, ...(alts ? alts.split("|") : [])].filter(Boolean).map(norm))]
    return { id, name, region, country, countryName: raw.countries[country] ?? country, lat, lon, pop, capital: capital === 1, keys, words: keys.flatMap((k) => k.split(" ")), regionKey: norm(region) }
  })
  return { entries, countries: raw.countries }
}

let loading: Promise<CityIndex> | null = null
/** The index, fetched once (from the first focus); later calls share it */
export function loadCities(base = import.meta.env.BASE_URL): Promise<CityIndex> {
  loading ??= fetch(`${base}data/cities.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() }).then(buildIndex).catch((e) => { loading = null; throw e })
  return loading
}

/** Edits between two words (a swap of neighbours counts as one) */
function edits(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 9
  let prev2: number[] = [], prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1)
    }
    prev2 = prev; prev = cur
  }
  return prev[b.length]
}
const allowed = (n: number) => (n < 4 ? 0 : n < 7 ? 1 : 2)
const aliasOf = (q: string) => SUBURBS[q]

/** Up to `limit` cities for what's typed, best first */
export function searchCities(index: CityIndex, typed: string, limit = 6): City[] {
  const q = norm(typed)
  if (q.length < 2 && !/\P{ASCII}/u.test(q)) return [] // one kanji is enough (京)
  const score = new Map<Entry, number>()
  const put = (e: Entry | undefined, s: number) => { if (e && s < (score.get(e) ?? Infinity)) score.set(e, s) }
  const find = (target: string) => { const [name, cc] = target.split("|"); return index.entries.find((e) => e.country === cc && (e.name === name || norm(e.name) === norm(name))) }
  // A suburb or short name: its city first
  if (aliasOf(q)) put(find(aliasOf(q)), -2)
  else if (q.length >= 3) for (const [k, v] of Object.entries(SUBURBS)) if (k.startsWith(q)) put(find(v), 1.2)
  // A state or province on its own: its capital, then its biggest cities
  const inRegion = index.entries.filter((e) => e.regionKey === q)
  if (inRegion.length) {
    const sorted = [...inRegion].sort((a, b) => Number(b.capital) - Number(a.capital) || b.pop - a.pop)
    sorted.slice(0, 4).forEach((e, i) => put(e, -0.9 + i * 0.1)) // after a city of that very name, capital first
  }
  for (const e of index.entries) {
    let s = Infinity
    for (const k of e.keys) {
      // A city of exactly that name sits with the suburbs' cities, at the top; a small town of that name elsewhere
      // (run 19 added towns of 30,000 in every country: Victoria, Texas) comes after a state's own suggestions
      if (k === q) { s = HOME.has(e.country) || e.pop >= 100_000 ? -2 : 0.5; break }
      if (k.startsWith(q)) s = Math.min(s, 1)
    }
    if (s > 1 && e.words.some((w) => w.startsWith(q))) s = 1.5
    if (s > 1.5 && q.length >= 4) {
      for (const k of e.keys) {
        if (k[0] !== q[0] && k[1] !== q[1]) continue
        const d = Math.min(edits(q, k.slice(0, q.length)), edits(q, k))
        if (d <= allowed(q.length)) s = Math.min(s, 2 + d)
      }
    }
    if (s < Infinity) put(e, s)
  }
  return [...score.entries()]
    .sort(([a, x], [b, y]) => {
      // Exact first; then the countries guests are likely to come from; then the bigger place
      const ex = Math.floor(x) - Math.floor(y)
      if (ex) return ex
      if (x < 0 && y < 0 && x !== y) return x - y // a state's own order: its capital, then its biggest
      const home = Number(HOME.has(b.country)) - Number(HOME.has(a.country))
      return home || b.pop - a.pop
    })
    .slice(0, limit)
    .map(([e]) => ({ id: e.id, name: e.name, region: e.region, country: e.country, countryName: e.countryName, lat: e.lat, lon: e.lon }))
}

/** Run 26: worth a search from three letters; two in Japanese (京都 is a whole name) */
export const searchable = (typed: string) => { const q = typed.trim(); return q.length >= 3 || (q.length >= 2 && /\P{ASCII}/u.test(q)) }

/** "Victoria, British Columbia, Canada": always the region and the country, so two places of one name never mix */
export const cityLabel = (c: City) => [c.name, c.region, c.countryName ?? c.country].filter(Boolean).join(", ")
