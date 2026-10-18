// node scripts/cities-build.mjs — "Where are you flying from?" city search data (final run), from GeoNames
// (https://www.geonames.org, CC BY 4.0). Downloads the dumps once into node_modules/.cache/geonames, then writes:
//   public/data/cities.json   the search index, loaded only when the field is focused (never on page load)
//   src/data/flying-chips.json the quick chips, resolved from src/content/flying-chips.ts
// Kept: every city of 5000+ people in Australia, New Zealand, Canada and Japan (where guests come from), and 100,000+
// elsewhere. Each row: id, name, ASCII name, other names (Japanese names, and a few English ones for the biggest),
// region (admin1), country, lat, lon, population, and whether it's a regional capital. Suburbs that the alias table
// sends to their city (North Melbourne, Brunswick…) are left out so they never show as cities of their own.
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

const CACHE = "node_modules/.cache/geonames"
const FILES = ["cities5000.zip", "admin1CodesASCII.txt", "countryInfo.txt"]
fs.mkdirSync(CACHE, { recursive: true })
for (const f of FILES) {
  const to = path.join(CACHE, f)
  if (fs.existsSync(to)) continue
  const r = await fetch(`https://download.geonames.org/export/dump/${f}`)
  if (!r.ok) throw new Error(`${f}: ${r.status}`)
  fs.writeFileSync(to, Buffer.from(await r.arrayBuffer()))
  console.log("downloaded", f)
}
if (!fs.existsSync(path.join(CACHE, "cities5000.txt"))) execFileSync("unzip", ["-o", "-q", path.join(CACHE, "cities5000.zip"), "-d", CACHE])

const HOME = new Set(["AU", "NZ", "CA", "JP"])
const { SUBURBS } = await import("../src/lib/city-aliases.ts")
const suburbNames = new Set(Object.keys(SUBURBS).map((s) => s.toLowerCase()))
const admin1 = new Map(fs.readFileSync(path.join(CACHE, "admin1CodesASCII.txt"), "utf8").split("\n").filter(Boolean).map((l) => { const [code, name] = l.split("\t"); return [code, name] }))
const countries = Object.fromEntries(fs.readFileSync(path.join(CACHE, "countryInfo.txt"), "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => { const c = l.split("\t"); return [c[0], c[4]] }))
const CJK = /[぀-ヿ㐀-鿿]/
const rows = []
for (const line of fs.readFileSync(path.join(CACHE, "cities5000.txt"), "utf8").split("\n")) {
  if (!line) continue
  const c = line.split("\t")
  const [id, name, ascii, alternates, lat, lon, , fcode, cc, , a1] = c
  const pop = Number(c[14])
  if (!(HOME.has(cc) ? pop >= 5000 : pop >= 100000)) continue
  if (fcode === "PPLX" || fcode === "PPLH" || fcode === "PPLQ") continue // parts of a city, historical, abandoned
  if ((cc === "AU" || cc === "NZ") && suburbNames.has(name.toLowerCase())) continue
  const alts = new Set()
  for (const a of (alternates ?? "").split(",")) {
    if (!a || a === name || a === ascii) continue
    // Japanese names: every city in Japan (東京, 札幌, 京都), and the bigger ones elsewhere (only kana or kanji)
    if (CJK.test(a) && a.length <= 12 && (cc === "JP" || pop >= 500_000) && (cc === "JP" || /[\u3040-\u30ff]/.test(a))) alts.add(a)
    else if (pop >= 1_000_000 && /^[A-Za-z .'-]{3,24}$/.test(a)) alts.add(a) // the biggest cities' other English names
  }
  const region = admin1.get(`${cc}.${a1}`) ?? ""
  // Japanese first (kana, then kanji), then the rest, up to eight
  const kana = /[\u3040-\u30ff]/, ordered = [...alts].sort((a, b) => Number(CJK.test(b)) - Number(CJK.test(a)) || Number(kana.test(b)) - Number(kana.test(a)))
  rows.push([Number(id), name, ascii === name ? "" : ascii, ordered.slice(0, 8).join("|"), region, cc, +(+lat).toFixed(3), +(+lon).toFixed(3), pop, fcode === "PPLA" || fcode === "PPLC" ? 1 : 0])
}
rows.sort((a, b) => b[8] - a[8])
const used = [...new Set(rows.map((r) => r[5]))].sort()
const data = { v: 1, source: "GeoNames (geonames.org), CC BY 4.0", fields: ["id", "name", "ascii", "alts", "region", "country", "lat", "lon", "pop", "capital"], countries: Object.fromEntries(used.map((c) => [c, countries[c] ?? c])), rows }
fs.mkdirSync("public/data", { recursive: true })
const json = JSON.stringify(data)
fs.writeFileSync("public/data/cities.json", json)
const gz = execFileSync("gzip", ["-9c", "public/data/cities.json"]).length
console.log(`public/data/cities.json  ${rows.length} cities, ${Math.round(json.length / 1024)} kB, ${Math.round(gz / 1024)} kB gzipped`)

// The quick chips: each "Name, CC" (or "Name, Region, CC") from the config, resolved to its city
const { CHIPS } = await import("../src/content/flying-chips.ts")
const chips = CHIPS.map((spec) => {
  if (spec === "Already in Japan") return { id: "jp", name: "Already in Japan", region: "", country: "JP", lat: 35.68, lon: 139.69 }
  const parts = spec.split(",").map((s) => s.trim()), cc = parts.at(-1), name = parts[0], reg = parts.length > 2 ? parts[1] : null
  const hit = rows.find((r) => r[5] === cc && (r[1] === name || r[2] === name) && (!reg || r[4].startsWith(reg)))
  if (!hit) throw new Error(`chip not found: ${spec}`)
  return { id: hit[0], name: hit[1], region: hit[4], country: cc, lat: hit[6], lon: hit[7] }
})
fs.mkdirSync("src/data", { recursive: true })
fs.writeFileSync("src/data/flying-chips.json", JSON.stringify(chips, null, 1) + "\n")
console.log("src/data/flying-chips.json", chips.map((c) => c.name).join(", "))
