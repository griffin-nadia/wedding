import type { Journey } from "@/lib/api"
import type { Knob } from "@/lab/playground/types"

/**
 * The globe kit's data and knobs (globes24), kept apart from the component so the area's index.ts can read the knobs
 * without loading any of the kit. See kit.tsx for how a look uses them.
 */
export type Kind = "nadia" | "griffin" | "guest" | "you"
export type LineStyle = "thread" | "stitch" | "ink" | "dots" | "plane" | "leaf" | "pixel"
export const LINE_STYLES: [LineStyle, string][] = [
  ["thread", "Red thread"], ["stitch", "Stitched dashes"], ["ink", "Inked route"], ["dots", "Dotted arc"], ["plane", "Paper plane"], ["leaf", "Maple leaf"], ["pixel", "Pixel blocks"],
]
export const RAD = Math.PI / 180
export const KYOTO = { lat: 35.01, lon: 135.77 }

/** What travels each line once (run 26): "auto" is the line style's own (a plane on Paper plane, a leaf on Maple leaf,
 *  nothing on the rest); any other choice flies on every line style */
export type Icon = "auto" | "plane" | "flock" | "crane" | "leaf" | "pixel" | "none"
export const ICONS: [Icon, string][] = [["auto", "The line style's"], ["plane", "Paper plane"], ["flock", "Three paper planes"], ["crane", "Paper crane"], ["leaf", "Maple leaf"], ["pixel", "Pixel plane"], ["none", "None"]]

/** The tuning panel's knobs (run 26), on every look. Each default leaves the look exactly as it was painted. */
export const TUNE: Knob[] = [
  { id: "land", label: "Land opacity", kind: "range", min: 0, max: 100, step: 5, def: 100, unit: "%" },
  { id: "grain", label: "Paper grain (added)", kind: "range", min: 0, max: 100, step: 5, def: 0, unit: "%" },
  { id: "weight", label: "Line weight", kind: "range", min: 50, max: 300, step: 10, def: 100, unit: "%" },
  { id: "shadow", label: "Shadow", kind: "range", min: 0, max: 100, step: 5, def: 0, unit: "%" },
  { id: "iconSize", label: "Travelling icon size", kind: "range", min: 50, max: 300, step: 10, def: 100, unit: "%" },
  { id: "speed", label: "Plane speed", kind: "range", min: 25, max: 300, step: 25, def: 100, unit: "%" },
]

/** The knobs every look has: the line style (its default), what travels it, the crowd, how many views, and the tuning */
export const globeKnobs = (line: LineStyle, icon: Icon = "auto"): Knob[] => [
  { id: "line", label: "Line style", kind: "select", options: LINE_STYLES, def: line },
  { id: "icon", label: "Travelling icon", kind: "select", options: ICONS, def: icon },
  { id: "crowd", label: "Crowd (demo households)", kind: "select", options: [["0", "None"], ["15", "15 demo"], ["40", "40 demo"]], def: "0" },
  { id: "views", label: "Views", kind: "select", options: [["both", "Story stop and full screen"], ["one", "Full screen only"]], def: "both" },
  ...TUNE,
]

/** Made-up households for judging a crowd: real towns, invented counts, never guests. Spread over AU, NZ, CA, JP, US, UK. */
const DEMO: Omit<Journey, "n">[] = [
  { name: "Hobart", country: "AU", lat: -42.88, lon: 147.33 }, { name: "Toronto", country: "CA", lat: 43.65, lon: -79.38 },
  { name: "Seattle", country: "US", lat: 47.61, lon: -122.33 }, { name: "Wellington", country: "NZ", lat: -41.29, lon: 174.78 },
  { name: "Manchester", country: "GB", lat: 53.48, lon: -2.24 }, { name: "Sapporo", country: "JP", lat: 43.06, lon: 141.35 },
  { name: "Darwin", country: "AU", lat: -12.46, lon: 130.84 }, { name: "Montreal", country: "CA", lat: 45.5, lon: -73.57 },
  { name: "San Francisco", country: "US", lat: 37.77, lon: -122.42 }, { name: "Christchurch", country: "NZ", lat: -43.53, lon: 172.64 },
  { name: "Edinburgh", country: "GB", lat: 55.95, lon: -3.19 }, { name: "Fukuoka", country: "JP", lat: 33.59, lon: 130.4 },
  { name: "Cairns", country: "AU", lat: -16.92, lon: 145.77 }, { name: "Halifax", country: "CA", lat: 44.65, lon: -63.57 },
  { name: "New York", country: "US", lat: 40.71, lon: -74.01 }, { name: "Queenstown", country: "NZ", lat: -45.03, lon: 168.66 },
  { name: "Canberra", country: "AU", lat: -35.28, lon: 149.13 }, { name: "Winnipeg", country: "CA", lat: 49.9, lon: -97.14 },
  { name: "Honolulu", country: "US", lat: 21.31, lon: -157.86 }, { name: "Bristol", country: "GB", lat: 51.45, lon: -2.59 },
  { name: "Sendai", country: "JP", lat: 38.27, lon: 140.87 }, { name: "Chicago", country: "US", lat: 41.88, lon: -87.63 },
]
const DEMO_N = [3, 1, 2, 1, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 4, 1, 2, 1, 1, 3, 1]
/** The demo crowd: made-up households, `households` in all, spread over the demo towns */
export function demoCrowd(households: number): Journey[] {
  const out: Journey[] = []
  for (let i = 0, left = households; left > 0 && i < DEMO.length; i++) { const n = Math.min(left, DEMO_N[i]); out.push({ ...DEMO[i], n }); left -= n }
  return out
}

type LatLon = { lat: number; lon: number }
/**
 * One line. to: where it lands (default Kyoto). badge: a letter beside the start (G for Griffin, N for Nadia; run 26c).
 * toLabel: a name at the landing end too. nudge: the dot drawn this
 * many screen px off its real place, with a hairline back (a traveller from beside a home start gets its own spot
 * instead of sitting under the G or the N). near: starts beside a home start, so its line flies lower.
 */
export type Trip = { id: string; kind: Kind; lat: number; lon: number; label: string; always: boolean; demo: boolean; to?: LatLon; toLabel?: string; badge?: string; nudge?: [number, number]; near?: boolean; lift?: number; twin?: boolean }

/** Jehan, 27 Oct: a city with several households gets one line each, fanned a little in height so they all read as
 *  separate lines instead of one on top of another. lift multiplies the arc's height; k of n lines. */
export const fan = (k: number, n: number) => (n < 2 ? 1 : 1 + (k - (n - 1) / 2) * Math.min(0.3, 0.9 / (n - 1)))
const regionName = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }) } catch { return null } })()

export const BRISBANE: LatLon = { lat: -27.47, lon: 153.03 }
export const VICTORIA: LatLon = { lat: 48.43, lon: -123.37 }
/** Run 26c: lab sample travellers from Brisbane (made up, never guests), so the map shows them in their own spots beside N */
export const BRISBANE_SAMPLE: Journey = { name: "Brisbane", country: "AU", lat: BRISBANE.lat, lon: BRISBANE.lon, n: 4 }
/** Spots round a home start for the travellers beside it, in screen px (down and away from the G or N and its name) */
const SPOTS: [number, number][] = [[-16, 12], [-27, 0], [-26, 20], [16, 26], [-12, 30]]
const NEAR = 3 // degrees, the site's HOME_NEAR

/** Every line, in the order they draw: Nadia's, Griffin's, the guests' (one per city, never who), then the household's own */
/** Run 27, on the site: label names a guest city (the site's naming and bundling) and sample is off; names.victoria and
 *  names.you name those starts */
export function trips(cities: Journey[], crowd: Journey[], you: Journey | null, names: { brisbane: string; victoria?: string; you?: string }, opts: { sample?: boolean; label?: (c: Journey) => string } = {}): Trip[] {
  const taken = new Map<string, number>()
  const spot = (c: LatLon) => {
    const home = [["n", BRISBANE], ["g", VICTORIA]].find(([, h]) => Math.hypot((h as LatLon).lat - c.lat, (h as LatLon).lon - c.lon) < NEAR)?.[0] as string | undefined
    if (!home) return {}
    const i = taken.get(home) ?? 0; taken.set(home, i + 1)
    return { near: true, nudge: SPOTS[i % SPOTS.length] }
  }
  const guest = (c: Journey, demo: boolean, i: number, sample = false): Trip => ({
    id: `${demo ? "demo" : "city"}-${i}`, kind: "guest", lat: c.lat, lon: c.lon, always: false, demo, ...spot(c),
    // Run 24 §3: a city by name only with 2 or more households from it; otherwise just its country
    label: opts.label ? opts.label(c) : `${c.n >= 2 ? `${c.name} · ${c.n} households` : regionName?.of(c.country) ?? c.country}${demo ? " (demo)" : sample ? " (sample)" : ""}`,
  })
  return [
    { id: "nadia", kind: "nadia", ...BRISBANE, label: names.brisbane, always: true, demo: false, badge: "N" },
    // Run 24's decision names Victoria (BC) for Griffin's label; the site's globe draws his line from Edmonton today
    { id: "griffin", kind: "griffin", ...VICTORIA, label: names.victoria ?? "Victoria", always: true, demo: false, badge: "G" },
    // One line per household from each city (fan), the first carrying the dot and the name, the rest twins
    ...cities.filter((c) => c.n > 0).flatMap((c, i) => { const g = guest(c, false, i, opts.sample ?? true); return Array.from({ length: Math.max(1, Math.round(c.n)) }, (_, k) => ({ ...g, id: k ? `${g.id}-${k}` : g.id, lift: fan(k, c.n), twin: k > 0 })) }),
    ...crowd.map((c, i) => guest(c, true, i)),
    // Run 27, as the site: their "You" sits under the N when they're from Brisbane
    ...(you ? [{ id: "you", kind: "you" as const, lat: you.lat, lon: you.lon, label: names.you ?? you.name, always: false, demo: false, ...(Math.hypot(you.lat - BRISBANE.lat, you.lon - BRISBANE.lon) < NEAR ? { near: true, nudge: [0, 22] as [number, number] } : spot(you)) }] : []),
  ]
}
