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
