import type { Journey } from "@/lib/api"
import type { Knob } from "../../types"

/**
 * The globe kit's data and knobs (globes24), kept apart from the component so the area's index.ts can read the knobs
 * without loading any of the kit. See kit.tsx for how a look uses them.
 */
export type Kind = "nadia" | "griffin" | "guest" | "you"
export type LineStyle = "thread" | "stitch" | "ink" | "dots" | "plane" | "leaf"
export const LINE_STYLES: [LineStyle, string][] = [
  ["thread", "Red thread"], ["stitch", "Stitched dashes"], ["ink", "Inked route"], ["dots", "Dotted arc"], ["plane", "Paper plane"], ["leaf", "Maple leaf"],
]
export const RAD = Math.PI / 180
export const KYOTO = { lat: 35.01, lon: 135.77 }

/** What travels each line once (run 26): "auto" is the line style's own (a plane on Paper plane, a leaf on Maple leaf,
 *  nothing on the rest); any other choice flies on every line style */
export type Icon = "auto" | "plane" | "flock" | "crane" | "leaf" | "none"
export const ICONS: [Icon, string][] = [["auto", "The line style's"], ["plane", "Paper plane"], ["flock", "Three paper planes"], ["crane", "Paper crane"], ["leaf", "Maple leaf"], ["none", "None"]]

/** The tuning panel's knobs (run 26), on every look. Each default leaves the look exactly as it was painted. */
export const TUNE: Knob[] = [
  { id: "land", label: "Land opacity", kind: "range", min: 0, max: 100, step: 5, def: 100, unit: "%" },
  { id: "grain", label: "Paper grain (added)", kind: "range", min: 0, max: 100, step: 5, def: 0, unit: "%" },
  { id: "weight", label: "Line weight", kind: "range", min: 50, max: 300, step: 10, def: 100, unit: "%" },
  { id: "shadow", label: "Shadow", kind: "range", min: 0, max: 100, step: 5, def: 0, unit: "%" },
  { id: "iconSize", label: "Travelling icon size", kind: "range", min: 50, max: 300, step: 10, def: 100, unit: "%" },
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
 * One line. to: where it lands (default Kyoto). badge: a letter beside the start (G for Griffin, N for Nadia; run 26c,
 * in place of the 京 seal and the chapter numbers). toLabel: a name at the landing end too. nudge: the dot drawn this
 * many screen px off its real place, with a hairline back (a traveller from beside a home start gets its own spot
 * instead of sitting under the G or the N). near: starts beside a home start, so its line flies lower.
 */
export type Trip = { id: string; kind: Kind; lat: number; lon: number; label: string; always: boolean; demo: boolean; to?: LatLon; toLabel?: string; badge?: string; nudge?: [number, number]; near?: boolean }
const regionName = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }) } catch { return null } })()

export const BRISBANE: LatLon = { lat: -27.47, lon: 153.03 }
export const VICTORIA: LatLon = { lat: 48.43, lon: -123.37 }
/** Run 26c: lab sample travellers from Brisbane (made up, never guests), so the map shows them in their own spots beside N */
export const BRISBANE_SAMPLE: Journey = { name: "Brisbane", country: "AU", lat: BRISBANE.lat, lon: BRISBANE.lon, n: 4 }
/** Spots round a home start for the travellers beside it, in screen px (down and away from the G or N and its name) */
const SPOTS: [number, number][] = [[-15, 13], [-3, 21], [-24, 1], [10, 24], [-26, 18]]
const NEAR = 3 // degrees, the site's HOME_NEAR

/** Every line, in the order they draw: Nadia's, Griffin's, the guests' (one per city, never who), then the household's own */
export function trips(cities: Journey[], crowd: Journey[], you: Journey | null, names: { brisbane: string }): Trip[] {
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
    label: `${c.n >= 2 ? `${c.name} · ${c.n} households` : regionName?.of(c.country) ?? c.country}${demo ? " (demo)" : sample ? " (sample)" : ""}`,
  })
  return [
    { id: "nadia", kind: "nadia", ...BRISBANE, label: names.brisbane, always: true, demo: false, badge: "N" },
    // Run 24's decision names Victoria (BC) for Griffin's label; the site's globe draws his line from Edmonton today
    { id: "griffin", kind: "griffin", ...VICTORIA, label: "Victoria", always: true, demo: false, badge: "G" },
    ...cities.filter((c) => c.n > 0).map((c, i) => guest(c, false, i, true)),
    ...crowd.map((c, i) => guest(c, true, i)),
    ...(you ? [{ id: "you", kind: "you" as const, lat: you.lat, lon: you.lon, label: you.name, always: false, demo: false, ...spot(you) }] : []),
  ]
}

/**
 * Run 26c: the story's chapters as the map tells them, for the chapter detail view. Titles, years and places are the
 * planner's working ones (src/content/story-plan.ts, Canada visit out as PART 2 asks; Taiwan from the site's chapter
 * places); the routes are the lab's reading of each title, sample only, to show how a line gets explained.
 */
type Route = { kind: Kind; from: LatLon & { name: string }; to: LatLon & { name: string }; badge?: string }
export type Chapter = { key: string; year: string; title: string; place: string; at: LatLon; nudge?: [number, number]; line: string; routes: Route[] }
const P = {
  brisbane: { ...BRISBANE, name: "Brisbane" }, victoria: { ...VICTORIA, name: "Victoria" }, edmonton: { lat: 53.55, lon: -113.49, name: "Edmonton" },
  hirakata: { lat: 34.81, lon: 135.65, name: "Hirakata" }, australia: { lat: -25.5, lon: 134, name: "Australia" }, taiwan: { lat: 23.7, lon: 121, name: "Taiwan" },
  kyoto: { ...KYOTO, name: "Kyoto" },
}
export const CHAPTERS: Chapter[] = [
  { key: "c1", year: "2017", title: "Became friends", place: "Kansai Gaidai, Hirakata", at: P.hirakata, nudge: [-16, 18], line: "Two lines meet at Hirakata, just outside Kyoto: Griffin's from Victoria and Nadia's from Brisbane.", routes: [{ kind: "griffin", from: P.victoria, to: P.hirakata, badge: "G" }, { kind: "nadia", from: P.brisbane, to: P.hirakata, badge: "N" }] },
  { key: "c2", year: "2018", title: "Nadia visits Canada", place: "Canada", at: P.edmonton, line: "Nadia's line runs from Brisbane across the Pacific to Edmonton.", routes: [{ kind: "nadia", from: P.brisbane, to: P.edmonton, badge: "N" }] },
  { key: "c3", year: "2018", title: "Griffin's internship in Australia", place: "Australia", at: P.australia, line: "Griffin's line runs the other way, from Canada down to Australia.", routes: [{ kind: "griffin", from: P.edmonton, to: P.australia, badge: "G" }] },
  { key: "c4", year: "2020", title: "Nadia moves to Canada", place: "Canada", at: P.edmonton, line: "Nadia's line from Brisbane to Edmonton again.", routes: [{ kind: "nadia", from: P.brisbane, to: P.edmonton, badge: "N" }] },
  { key: "c5", year: "", title: "Taiwan", place: "Taiwan", at: P.taiwan, line: "A line from Brisbane up to Taiwan (sample route).", routes: [{ kind: "nadia", from: P.brisbane, to: P.taiwan, badge: "N" }] },
  { key: "c6", year: "2025", title: "Living in Australia", place: "Australia (Brisbane)", at: P.brisbane, nudge: [16, -16], line: "A line from Edmonton back to Brisbane.", routes: [{ kind: "nadia", from: P.edmonton, to: P.brisbane, badge: "G N" }] },
  { key: "c7", year: "2027", title: "And then, Kyoto", place: "Kyoto", at: P.kyoto, nudge: [16, 16], line: "The two lines on the map today: Nadia's from Brisbane and Griffin's from Victoria, both landing in Kyoto.", routes: [{ kind: "nadia", from: P.brisbane, to: P.kyoto, badge: "N" }, { kind: "griffin", from: P.victoria, to: P.kyoto, badge: "G" }] },
]
/** A chapter's routes as lines for the detail view's map: every end named, the starts with their letter */
export const chapterTrips = (c: Chapter): Trip[] => c.routes.map((r, i) => ({
  id: `${c.key}-${i}`, kind: r.kind, lat: r.from.lat, lon: r.from.lon, label: r.from.name, to: r.to, toLabel: r.to.name, badge: r.badge, always: true, demo: false,
}))

/**
 * Run 26c: the Kyoto places the site's venue map and journey use, at their real places, for the close-up inset (at
 * world scale they all sit on one pixel). Coordinates to about 50 m, from the public map. short: named on the inset
 * (the rest are dots, named on hover and in the inset's label). lab: where its name sits from the dot, in the inset's 100 units (" / " breaks a line).
 */
export const KYOTO_PLACES: { id: string; name: string; lat: number; lon: number; short?: string; lab?: [dx: number, dy: number, anchor: "start" | "middle" | "end"]; venue?: boolean }[] = [
  { id: "venue", name: "The Sodoh", lat: 34.9978, lon: 135.7794, short: "The Sodoh", lab: [-5, -1.5, "end"], venue: true },
  { id: "pagoda", name: "Yasaka Pagoda", lat: 34.9986, lon: 135.7809, short: "Yasaka / Pagoda", lab: [5, -5, "start"] },
  { id: "shrine", name: "Yasaka Shrine", lat: 35.0037, lon: 135.7785, short: "Yasaka Shrine", lab: [0, -5, "middle"] },
  { id: "kiyomizu", name: "Kiyomizu-dera", lat: 34.9949, lon: 135.785, short: "Kiyomizu-dera", lab: [25, 9, "end"] },
  { id: "station", name: "Kyoto Station", lat: 34.9858, lon: 135.7588, short: "Kyoto / Station", lab: [1, 8.5, "middle"] },
  { id: "gion", name: "Gion Shijo Station", lat: 35.0036, lon: 135.7722 },
  { id: "kawaramachi", name: "Kawaramachi Shopping Street", lat: 35.004, lon: 135.7686 },
  { id: "sanjo", name: "Sanjo Station", lat: 35.009, lon: 135.772 },
  { id: "gojo", name: "Kiyomizu Gojo Station", lat: 34.9961, lon: 135.7686 },
  { id: "shichijo", name: "Shichijo Station", lat: 34.9901, lon: 135.769 },
  { id: "tofukuji", name: "Tofukuji Station", lat: 34.98, lon: 135.7697 },
]

