import type { Flying } from "./api.ts"
import { onMap, type Region } from "./map-land.ts"

/**
 * "Where are you flying from?" (18f): a small local list of general places (cities and towns, never addresses), with
 * suburb and short-name aliases, matched on this device with room for typos. No network. The device keeps the city
 * ("Melbourne"); the sheet only ever gets the nearest of its fixed list (FLYING), so the counts stay anonymous and the
 * back end is unchanged. Anything in Australia that isn't listed goes to the nearest listed city by its state or
 * postcode, or to "Australia" as a last resort.
 */
export type Place = { name: string; ja: string; region: Region | null; lat: number; lon: number; aliases?: string[]; edge?: "west" | "east" }

// Biggest first within each region, so a tie goes to the bigger place
export const PLACE_LIST: Place[] = [
  { name: "Brisbane", ja: "ブリスベン", region: "AU", lat: -27.47, lon: 153.03, aliases: ["bris", "brissie", "brisvegas", "south brisbane", "west end", "fortitude valley", "the valley", "new farm", "toowong", "indooroopilly", "chermside", "carindale", "logan", "ipswich", "redcliffe", "kangaroo point", "bulimba", "woolloongabba", "the gap", "ashgrove", "red hill", "kelvin grove", "spring hill", "paddington qld", "springfield", "strathpine", "wynnum", "sunnybank", "mount gravatt", "mt gravatt"] },
  { name: "Sydney", ja: "シドニー", region: "AU", lat: -33.87, lon: 151.21, aliases: ["syd", "bondi", "manly", "parramatta", "newtown", "surry hills", "chatswood", "north sydney", "penrith", "liverpool", "blacktown", "cronulla", "randwick", "coogee", "marrickville", "glebe", "balmain", "paddington", "mosman", "hornsby", "castle hill", "bankstown", "sutherland", "dee why", "campbelltown", "ryde", "strathfield", "burwood", "redfern", "leichhardt", "darlinghurst", "potts point", "central coast", "gosford"] },
  { name: "Melbourne", ja: "メルボルン", region: "AU", lat: -37.81, lon: 144.96, aliases: ["melb", "north melbourne", "south melbourne", "west melbourne", "east melbourne", "port melbourne", "brunswick", "brunswick east", "brunswick west", "fitzroy", "fitzroy north", "carlton", "carlton north", "richmond", "collingwood", "abbotsford", "st kilda", "saint kilda", "south yarra", "prahran", "windsor", "footscray", "yarraville", "coburg", "northcote", "preston", "thornbury", "reservoir", "hawthorn", "kew", "camberwell", "box hill", "doncaster", "dandenong", "frankston", "werribee", "sunshine", "essendon", "moonee ponds", "williamstown", "docklands", "southbank", "brighton", "elwood", "caulfield", "malvern", "glen waverley", "ringwood", "craigieburn", "epping", "bundoora", "heidelberg", "clayton", "mornington", "point cook", "pascoe vale"] },
  { name: "Perth", ja: "パース", region: "AU", lat: -31.95, lon: 115.86, aliases: ["fremantle", "freo", "subiaco", "joondalup", "scarborough", "cottesloe", "leederville", "mount lawley", "mt lawley", "northbridge", "rockingham", "mandurah", "midland", "victoria park", "applecross"] },
  { name: "Adelaide", ja: "アデレード", region: "AU", lat: -34.93, lon: 138.6, aliases: ["radelaide", "glenelg", "norwood", "unley", "prospect", "port adelaide", "mawson lakes", "salisbury", "burnside", "henley beach", "adelaide hills", "stirling", "mount barker"] },
  { name: "Gold Coast", ja: "ゴールドコースト", region: "AU", lat: -28.02, lon: 153.4, aliases: ["goldie", "surfers paradise", "surfers", "broadbeach", "burleigh", "burleigh heads", "southport", "coolangatta", "robina", "nerang", "palm beach", "coomera"] },
  { name: "Sunshine Coast", ja: "サンシャインコースト", region: "AU", lat: -26.65, lon: 153.07, aliases: ["noosa", "maroochydore", "caloundra", "mooloolaba", "nambour", "coolum"] },
  { name: "Canberra", ja: "キャンベラ", region: "AU", lat: -35.28, lon: 149.13, aliases: ["belconnen", "woden", "tuggeranong", "gungahlin", "braddon", "queanbeyan"] },
  { name: "Newcastle", ja: "ニューカッスル", region: "AU", lat: -32.93, lon: 151.78, aliases: ["merewether", "maitland", "lake macquarie", "hunter valley"] },
  { name: "Wollongong", ja: "ウーロンゴン", region: "AU", lat: -34.42, lon: 150.89, aliases: ["the gong", "shellharbour", "kiama"] },
  { name: "Hobart", ja: "ホバート", region: "AU", lat: -42.88, lon: 147.33, aliases: ["sandy bay", "battery point", "kingston", "glenorchy"] },
  { name: "Geelong", ja: "ジーロング", region: "AU", lat: -38.15, lon: 144.36, aliases: ["torquay", "ocean grove", "bellarine"] },
  { name: "Townsville", ja: "タウンズビル", region: "AU", lat: -19.26, lon: 146.82 },
  { name: "Cairns", ja: "ケアンズ", region: "AU", lat: -16.92, lon: 145.77, aliases: ["port douglas"] },
  { name: "Darwin", ja: "ダーウィン", region: "AU", lat: -12.46, lon: 130.84, aliases: ["palmerston"] },
  { name: "Toowoomba", ja: "トゥーンバ", region: "AU", lat: -27.56, lon: 151.95 },
  { name: "Ballarat", ja: "バララット", region: "AU", lat: -37.56, lon: 143.85 },
  { name: "Bendigo", ja: "ベンディゴ", region: "AU", lat: -36.76, lon: 144.28 },
  { name: "Launceston", ja: "ローンセストン", region: "AU", lat: -41.43, lon: 147.14 },
  { name: "Albury", ja: "アルベリー", region: "AU", lat: -36.08, lon: 146.92, aliases: ["wodonga", "albury wodonga"] },
  { name: "Byron Bay", ja: "バイロンベイ", region: "AU", lat: -28.64, lon: 153.61, aliases: ["byron", "lismore", "ballina"] },
  { name: "Alice Springs", ja: "アリススプリングス", region: "AU", lat: -23.7, lon: 133.88, aliases: ["alice"] },
  { name: "Australia", ja: "オーストラリア", region: "AU", lat: -25.5, lon: 134, aliases: ["aus", "oz", "aussie"] },
  { name: "Auckland", ja: "オークランド", region: "NZ", lat: -36.85, lon: 174.76, aliases: ["akl", "ponsonby", "parnell", "takapuna", "manukau", "north shore"] },
  { name: "Wellington", ja: "ウェリントン", region: "NZ", lat: -41.29, lon: 174.78, aliases: ["welly"] },
  { name: "Christchurch", ja: "クライストチャーチ", region: "NZ", lat: -43.53, lon: 172.64, aliases: ["chch"] },
  { name: "Queenstown", ja: "クイーンズタウン", region: "NZ", lat: -45.03, lon: 168.66 },
  { name: "New Zealand", ja: "ニュージーランド", region: "NZ", lat: -41, lon: 174, aliases: ["nz", "aotearoa"] },
  { name: "Vancouver", ja: "バンクーバー", region: "CA", lat: 49.28, lon: -123.12, aliases: ["burnaby", "north vancouver", "surrey", "victoria bc"] },
  { name: "Toronto", ja: "トロント", region: "CA", lat: 43.65, lon: -79.38, aliases: ["mississauga", "brampton", "markham"] },
  { name: "Montreal", ja: "モントリオール", region: "CA", lat: 45.5, lon: -73.57, aliases: ["montréal"] },
  { name: "Calgary", ja: "カルガリー", region: "CA", lat: 51.05, lon: -114.07 },
  { name: "Edmonton", ja: "エドモントン", region: "CA", lat: 53.55, lon: -113.49 },
  { name: "Ottawa", ja: "オタワ", region: "CA", lat: 45.42, lon: -75.7 },
  { name: "Winnipeg", ja: "ウィニペグ", region: "CA", lat: 49.9, lon: -97.14 },
  { name: "Halifax", ja: "ハリファックス", region: "CA", lat: 44.65, lon: -63.57 },
  { name: "Canada", ja: "カナダ", region: "CA", lat: 53, lon: -100 },
  { name: "Tokyo", ja: "東京", region: "JP", lat: 35.68, lon: 139.69, aliases: ["shibuya", "shinjuku", "yokohama"] },
  { name: "Osaka", ja: "大阪", region: "JP", lat: 34.69, lon: 135.5, aliases: ["namba", "umeda"] },
  { name: "Kyoto", ja: "京都", region: "JP", lat: 35.01, lon: 135.77 },
  { name: "Kobe", ja: "神戸", region: "JP", lat: 34.69, lon: 135.2 },
  { name: "Nara", ja: "奈良", region: "JP", lat: 34.69, lon: 135.8 },
  { name: "Nagoya", ja: "名古屋", region: "JP", lat: 35.18, lon: 136.91 },
  { name: "Fukuoka", ja: "福岡", region: "JP", lat: 33.59, lon: 130.4 },
  { name: "Hiroshima", ja: "広島", region: "JP", lat: 34.39, lon: 132.46 },
  { name: "Sapporo", ja: "札幌", region: "JP", lat: 43.06, lon: 141.35 },
  { name: "Already in Japan", ja: "日本国内から", region: "JP", lat: 36.4, lon: 138.9, aliases: ["japan", "nihon", "nippon"] },
  // Main hubs, off the map: their lines come in from the edge they'd fly from
  ...([
    ["Singapore", "シンガポール", "west"], ["Hong Kong", "香港", "west"], ["Seoul", "ソウル", "west"], ["Taipei", "台北", "west"], ["Shanghai", "上海", "west"], ["Beijing", "北京", "west"],
    ["Bangkok", "バンコク", "west"], ["Kuala Lumpur", "クアラルンプール", "west"], ["Bali", "バリ", "west"], ["Jakarta", "ジャカルタ", "west"], ["Manila", "マニラ", "west"],
    ["Dubai", "ドバイ", "west"], ["Doha", "ドーハ", "west"], ["London", "ロンドン", "west"], ["Paris", "パリ", "west"], ["Frankfurt", "フランクフルト", "west"], ["Amsterdam", "アムステルダム", "west"],
    ["Los Angeles", "ロサンゼルス", "east"], ["San Francisco", "サンフランシスコ", "east"], ["Seattle", "シアトル", "east"], ["New York", "ニューヨーク", "east"], ["Honolulu", "ホノルル", "east"], ["Fiji", "フィジー", "east"],
  ] as const).map(([name, ja, edge]) => ({ name, ja, region: null, lat: 0, lon: 0, edge, aliases: name === "Los Angeles" ? ["la", "lax"] : name === "New York" ? ["nyc", "ny"] : name === "San Francisco" ? ["sf"] : name === "Bali" ? ["denpasar"] : name === "Fiji" ? ["nadi"] : undefined })),
  { name: "Somewhere else", ja: "その他", region: null, lat: 0, lon: 0, edge: "west", aliases: ["other", "elsewhere"] },
]
const BY_NAME = new Map(PLACE_LIST.map((p) => [p.name, p]))
// Older answers on this device (before 18f) were the fixed list itself
const LEGACY: Record<string, string> = { "Elsewhere in Australia": "Australia" }
export const placeOf = (name: string | null | undefined) => (name ? BY_NAME.get(LEGACY[name] ?? name) ?? null : null)

/** What a guest sees before typing: the big ones, then Somewhere else */
export const STARTERS = ["Brisbane", "Sydney", "Melbourne", "Perth", "Adelaide", "Gold Coast", "Canberra", "Auckland", "Vancouver", "Toronto", "Already in Japan", "Somewhere else"]

// Accents off (Montréal), Japanese kept as it is
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
/** Edits between two words (a swap of neighbours counts as one) */
function edits(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
  }
  return d[a.length][b.length]
}
const allowed = (n: number) => (n < 4 ? 0 : n < 7 ? 1 : 2)
// Every way to say each place: its name (and Japanese) first, then its aliases
const LABELS = PLACE_LIST.flatMap((p, order) => [norm(p.name), norm(p.ja), ...(p.aliases ?? []).map(norm)].map((label, k) => ({ p, label, main: k < 2, order })))
// Australian states and territories, and postcode ranges, to the nearest listed city
const STATES: [RegExp, string][] = [
  [/\b(vic|victoria)\b/, "Melbourne"], [/\b(nsw|new south wales)\b/, "Sydney"], [/\b(qld|queensland)\b/, "Brisbane"], [/\b(wa|western australia)\b/, "Perth"],
  [/\b(sa|south australia)\b/, "Adelaide"], [/\b(tas|tasmania)\b/, "Hobart"], [/\b(nt|northern territory)\b/, "Darwin"], [/\b(act)\b/, "Canberra"],
]
const POSTCODE = (pc: number) => (pc >= 800 && pc < 1000 ? "Darwin" : pc >= 2600 && pc < 2620 || pc >= 2900 && pc < 2921 ? "Canberra" : pc >= 1000 && pc < 3000 ? "Sydney" : pc >= 3000 && pc < 4000 ? "Melbourne" : pc >= 4000 && pc < 5000 ? "Brisbane" : pc >= 5000 && pc < 6000 ? "Adelaide" : pc >= 6000 && pc < 7000 ? "Perth" : pc >= 7000 && pc < 8000 ? "Hobart" : null)

/** The places that fit what's typed, best first: exact, then starting with it, then near misses. */
export function findPlaces(typed: string, limit = 6): Place[] {
  const q = norm(typed)
  if (!q) return STARTERS.map((n) => BY_NAME.get(n)!)
  const best = new Map<Place, number>()
  const score = (q: string) => {
    for (const { p, label, main, order } of LABELS) {
      const slack = main ? 0 : 0.5, tie = order / 1000
      let s = Infinity
      if (label === q) s = 0
      else if ((q.length >= 2 || /[^a-z0-9 ]/.test(q)) && label.startsWith(q)) s = 1
      else if (q.length >= 4) {
        const d = Math.min(edits(q, label.slice(0, q.length)), edits(q, label))
        if (d <= allowed(q.length)) s = 2 + d
      }
      if (s < Infinity) { const v = s + slack + tie; if (v < (best.get(p) ?? Infinity)) best.set(p, v) }
    }
  }
  // The whole thing, then each part of "North Melbourne, VIC 3051"
  score(q)
  if (!best.size) for (const part of typed.split(/[,/]/).map(norm).filter(Boolean)) score(part)
  if (!best.size) {
    const state = STATES.find(([re]) => re.test(q))?.[1], pc = q.match(/\b(\d{4})\b/)
    const by = state ?? (pc ? POSTCODE(Number(pc[1])) : null) ?? (/\baustralia\b/.test(q) ? "Australia" : null)
    if (by) return [BY_NAME.get(by)!]
  }
  return [...best.entries()].sort((a, b) => a[1] - b[1]).slice(0, limit).map(([p]) => p)
}

const km = (a: Place, b: Place) => {
  const r = Math.PI / 180, x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r), y = (b.lat - a.lat) * r
  return Math.hypot(x, y) * 6371
}
const BUCKETS = ["Brisbane", "Melbourne", "Sydney", "Perth", "Adelaide"] as const
/** The fixed answer the sheet counts (unchanged back end): the nearest of its five Australian cities, Canada, Japan,
 *  or somewhere else */
export function bucketOf(p: Place): Flying {
  if (p.region === "AU") return p.name === "Australia" ? "Elsewhere in Australia" : BUCKETS.reduce((a, b) => (km(p, BY_NAME.get(b)!) < km(p, BY_NAME.get(a)!) ? b : a))
  if (p.region === "CA") return "Canada"
  if (p.region === "JP") return "Already in Japan"
  return "Somewhere else"
}

/** Where a place's line starts on the guest map */
export function pointOf(p: Place): [number, number] {
  if (p.region) return onMap(p.region, p.lat, p.lon)
  return p.edge === "east" ? [392, 150] : [10, 168]
}
