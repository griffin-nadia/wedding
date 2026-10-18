// node scripts/cities-build.mjs — "Where are you flying from?" city search data (final run), from GeoNames
// (https://www.geonames.org, CC BY 4.0). Downloads the dumps once into node_modules/.cache/geonames, then writes:
//   public/data/cities.json   the search index, loaded only when the field is focused (never on page load)
//   src/data/country-numeric.json ISO country code to ISO numeric, so the globe can paint a guest's country
//     (world-atlas names countries by number)
// and checks every quick chip in src/data/flying-chips.json (the one config for them) is a real city here.
// Kept (run 19, every country): every city of 5000+ people in Australia, New Zealand, Canada and Japan (where guests
// come from), 30,000+ elsewhere (Nadi, Fiji is 42,000 and Suva 77,000; 15,000+ made the file 964 kB gzipped, this 600), and in every
// country its capital and its three biggest places whatever their size, so no country is missing. Each row: id, name, ASCII name, other names (Japanese names, and a few English ones for the biggest),
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
const info = fs.readFileSync(path.join(CACHE, "countryInfo.txt"), "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split("\t"))
const countries = Object.fromEntries(info.map((c) => [c[0], c[4]]))
const CUT = 30000
// Every country's capital and its three biggest places (cities5000 is sorted by nothing useful, so rank them first)
const always = new Set(), byCountry = new Map()
for (const line of fs.readFileSync(path.join(CACHE, "cities5000.txt"), "utf8").split("\n")) {
  if (!line) continue
  const c = line.split("\t"), [id, , , , , , , fcode, cc] = c
  if (fcode === "PPLX" || fcode === "PPLH" || fcode === "PPLQ") continue
  if (fcode === "PPLC") always.add(id)
  if (!byCountry.has(cc)) byCountry.set(cc, [])
  byCountry.get(cc).push([id, Number(c[14])])
}
for (const list of byCountry.values()) list.sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([id]) => always.add(id))
const CJK = /[぀-ヿ㐀-鿿]/
const rows = []
for (const line of fs.readFileSync(path.join(CACHE, "cities5000.txt"), "utf8").split("\n")) {
  if (!line) continue
  const c = line.split("\t")
  const [id, name, ascii, alternates, lat, lon, , fcode, cc, , a1] = c
  const pop = Number(c[14])
  if (!(HOME.has(cc) ? pop >= 5000 : pop >= CUT || always.has(id))) continue
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

// ISO code to ISO numeric (world-atlas's ids), for the globe's painted countries
fs.writeFileSync("src/data/country-numeric.json", JSON.stringify(Object.fromEntries(info.map((c) => [c[0], c[2]]))) + "\n")

// The quick chips (src/data/flying-chips.json, edited by hand): each one must be a real city in the index, with the
// same name and place, so a chip and a typed search save the same city
const groups = JSON.parse(fs.readFileSync("src/data/flying-chips.json", "utf8"))
for (const c of groups.flatMap((g) => g.cities)) {
  const hit = rows.find((r) => r[0] === c.id)
  if (!hit || hit[1] !== c.name || hit[5] !== c.country || hit[4] !== c.region || hit[6] !== c.lat || hit[7] !== c.lon) throw new Error(`chip doesn't match GeoNames: ${c.name} (${c.id})`)
}
console.log("src/data/flying-chips.json ok:", groups.map((g) => g.cities.map((c) => c.chip ?? c.name).join(", ")).join(" / "))
