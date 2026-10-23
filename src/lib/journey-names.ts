/**
 * Run 24: what the journey map says about where guests come from. A guest city is named only when 2 or more households
 * come from it (one household's city on a map as good as says who it is), otherwise just its country, the same rule as
 * the back end's fold (run 20). A country with many lines has them bundled into one, slightly thicker, with a count.
 * Kept free of imports (and of the DOM) so the unit tests run it under plain Node.
 */
export type Place = { name: string; country: string; lat: number; lon: number; n: number }
export type Bundled = Place & { bundled: boolean; label: string }

/** A country code's name in this language ("CA" → "Canada"), or the code if the browser can't name it */
export function countryName(code: string, lang = "en") {
  try { return new Intl.DisplayNames([lang], { type: "region" }).of(code) ?? code } catch { return code }
}

/** The label a city shows on hover or tap: its own name only for 2 or more households, else its country */
export function placeLabel(p: Pick<Place, "name" | "country" | "n">, lang = "en") {
  return p.n >= 2 ? p.name : countryName(p.country, lang)
}

/** Bundles: from BUNDLE_AT lines in one country, they become one line from the households' weighted middle */
/** Run 26c (the review: "slow the journey animation"): every line's draw, plane and the globe's turn to Kyoto take
 *  this many times as long as run 26's (the home lines in about 2 s, everyone else's by about 4.5 s) */
export const PACE = 1.7
export const BUNDLE_AT = 4
export function bundle(places: Place[], lang = "en", households = (n: number) => `${n} households`): Bundled[] {
  const byCountry = new Map<string, Place[]>()
  for (const p of places) byCountry.set(p.country, [...(byCountry.get(p.country) ?? []), p])
  return [...byCountry.entries()].flatMap(([country, list]): Bundled[] => {
    if (list.length < BUNDLE_AT) return list.map((p) => ({ ...p, bundled: false, label: placeLabel(p, lang) }))
    const n = list.reduce((a, p) => a + p.n, 0)
    const lat = list.reduce((a, p) => a + p.lat * p.n, 0) / n, lon = list.reduce((a, p) => a + p.lon * p.n, 0) / n
    return [{ name: countryName(country, lang), country, lat, lon, n, bundled: true, label: `${countryName(country, lang)} · ${households(n)}` }]
  })
}

/** Run 25: the home lines' starts (Nadia's Brisbane, Griffin's Victoria). A household flying from within HOME_NEAR
 *  degrees of one gets a lower curve, so its line and the home line both read instead of drawing one over the other. */
export const HOME_STARTS: [number, number][] = [[-27.47, 153.03], [48.43, -123.37]]
export const HOME_NEAR = 3
export const nearHome = (lat: number, lon: number) => HOME_STARTS.some(([a, b]) => Math.hypot(a - lat, b - lon) < HOME_NEAR)

/**
 * Run 25: where each chapter happened, by the Content tab's place (story_N_place), as latitude and longitude for both
 * the globe and the flat map. nudge moves the pin (in px on screen, the flat map's viewBox units on the map) off a spot
 * that's already taken (Hirakata sits on Kyoto, Brisbane on Nadia's line), with a hairline back to the real place.
 * Kyoto has no pin: its seal marks it, and its chapter is the map's own stop. Japan (the Back to Japan photo stop) has
 * none either: Hirakata and Kyoto already mark it, and a third pin there was a crowd.
 */
export const CHAPTER_AT: Record<string, { at: [number, number]; nudge?: [number, number] }> = {
  "Kansai Gaidai, Hirakata": { at: [34.81, 135.65], nudge: [18, 24] },
  Canada: { at: [53.55, -113.49] },
  Australia: { at: [-25.5, 134] },
  "Australia (Brisbane)": { at: [-27.47, 153.03], nudge: [4, 22] },
  Taiwan: { at: [23.7, 121.0] },
}
export type ChapterPin = { key: string; place: string; n: number; title: string; at: [number, number]; nudge: [number, number] }
/** One pin per place, numbered by the first chapter there (chapters counted as the story counts them: those with words) */
export function chapterPins(chapters: { key: string; place?: string; title: string; body: string[] }[]): ChapterPin[] {
  const told = chapters.filter((c) => c.body.length), seen = new Set<string>(), out: ChapterPin[] = []
  for (const c of chapters) {
    const spot = c.place ? CHAPTER_AT[c.place] : undefined
    if (!c.place || !spot || seen.has(c.place)) continue
    seen.add(c.place)
    out.push({ key: c.key, place: c.place, n: told.indexOf(c) + 1, title: c.title, at: spot.at, nudge: spot.nudge ?? [0, 0] })
  }
  return out
}
