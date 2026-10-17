// node scripts/ja-pack.mjs [since-commit] — the Japanese read pack: every Japanese line on the site next to its English,
// grouped by page, the ones new or changed since <since-commit> marked, as docs/japanese-read.md and
// docs/japanese-read.csv (paste into a sheet for whoever reads it). Placeholders (pending.ts) and the music credit too.
import { build } from "esbuild"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const since = process.argv[2] ?? "2daa138"
const root = path.resolve("src")
const oldJa = execFileSync("git", ["show", `${since}:src/content/ja.ts`], { encoding: "utf8" })
const alias = { name: "alias", setup(b) {
  b.onResolve({ filter: /^@\// }, (a) => ({ path: path.join(root, a.path.slice(2)) + (fs.existsSync(path.join(root, a.path.slice(2)) + ".ts") ? ".ts" : ".tsx") }))
  b.onResolve({ filter: /^virtual:ja-old$/ }, () => ({ path: "ja-old", namespace: "v" }))
  b.onLoad({ filter: /.*/, namespace: "v" }, () => ({ contents: oldJa, loader: "ts", resolveDir: path.join(root, "content") }))
} }
const entry = `export { en } from "@/content/en"; export { ja } from "@/content/ja"; export { ja as jaOld } from "virtual:ja-old"; export { PENDING, JA_TO_READ } from "@/content/pending"; export { ART } from "@/lib/art"`
const out = await build({ stdin: { contents: entry, resolveDir: root, loader: "ts" }, bundle: true, format: "esm", platform: "node", write: false, plugins: [alias], logLevel: "silent", define: { "import.meta.env": "{}" } })
const tmp = path.resolve("node_modules/.tmp/ja-pack.mjs")
fs.mkdirSync(path.dirname(tmp), { recursive: true }); fs.writeFileSync(tmp, out.outputFiles[0].text)
const { en, ja, jaOld, PENDING, ART } = await import(tmp + "?" + Date.now())

// A function's words: called with placeholders ({1}, {2}…) so its shape shows; if it needs real values, say so
const words = (v) => {
  if (typeof v === "string") return v
  if (typeof v === "function") { try { const r = v(...Array.from({ length: Math.max(1, v.length) }, (_, i) => `{${i + 1}}`)); return typeof r === "string" ? r : null } catch { return null } }
  return null
}
const get = (o, keys) => keys.reduce((x, k) => (x == null ? undefined : x[k]), o)
const rows = []
const walk = (node, keys) => {
  if (node == null) return
  if (typeof node === "string" || typeof node === "function") {
    const e = words(node), jv = get(ja, keys), j = jv === undefined ? null : words(jv), was = get(jaOld, keys), w = was === undefined ? null : words(was)
    if (e == null && j == null) return
    rows.push({ keys, en: e ?? "(a function: see en.ts)", ja: jv === undefined ? "" : j ?? "(a function: see ja.ts)", status: jv === undefined ? "missing (shows English)" : was === undefined ? "new" : j !== w ? "changed" : "" })
    return
  }
  if (typeof node === "object") for (const k of Object.keys(node)) walk(node[k], [...keys, k])
}
walk(en, [])
for (const [k, v] of Object.entries(PENDING)) rows.push({ keys: ["placeholders", k], en: v.en, ja: v.ja, status: "placeholder (until their words arrive)" })
rows.push({ keys: ["music", "credit"], en: ART.music.credit.en, ja: ART.music.credit.ja, status: "changed" })

const PAGES = [
  ["Everywhere (bar, nav, letter, music, theme)", ["meta", "nav", "letter", "music", "theme", "please", "name", "nameJa", "addressJa", "notFound", "unknown", "paused", "offline", "loading"]],
  ["Home", ["home", "countdownMore"]], ["The day", ["day", "trail", "kyotoMap"]], ["Travel", ["travel", "getting", "stay", "driver"]],
  ["Our story and the map", ["story", "journey", "flying", "photos"]], ["FAQs", ["qa"]], ["Reply (RSVP), fortune", ["rsvp", "fortune"]],
  ["Placeholders", ["placeholders"]],
]
const pageOf = (r) => (PAGES.find(([, ks]) => ks.includes(r.keys[0])) ?? ["Other"])[0]
const key = (r) => r.keys.join(".")
const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ")
const counts = { all: rows.length, newer: rows.filter((r) => r.status === "new" || r.status === "changed").length, missing: rows.filter((r) => r.status.startsWith("missing")).length }

let md = `# Japanese read pack

**For Nadia:** the translating is done; it just needs someone fluent to read it over.

Every Japanese line on the site, next to its English, by page. ${counts.all} lines: ${counts.newer} new or changed since 17 Oct
(marked), ${counts.missing} with no Japanese yet (the site shows the English there). The rest are the 6 Oct draft,
which has never had a native read either. Fix anything straight in this file or the CSV
([japanese-read.csv](japanese-read.csv), for a sheet) and Jehan puts it into \`src/content/ja.ts\`.

Notes for the reader: polite form (です・ます) throughout; nothing should say more than the English does; {1}, {2}
are filled in by the site (a name, a date, a number).

`
for (const [page] of [...PAGES, ["Other"]]) {
  const list = rows.filter((r) => pageOf(r) === page)
  if (!list.length) continue
  md += `## ${page}\n\n| | English | Japanese | Key |\n|---|---|---|---|\n`
  for (const r of list) md += `| ${r.status === "new" ? "**new**" : r.status === "changed" ? "**changed**" : r.status.startsWith("missing") ? "missing" : r.status.startsWith("placeholder") ? "placeholder" : ""} | ${cell(r.en)} | ${cell(r.ja)} | \`${key(r)}\` |\n`
  md += "\n"
}
const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`
const csv = ["page,key,english,japanese,status,fix", ...rows.map((r) => [pageOf(r), key(r), r.en, r.ja, r.status, ""].map(csvCell).join(","))].join("\n") + "\n"
fs.writeFileSync("docs/japanese-read.md", md)
fs.writeFileSync("docs/japanese-read.csv", "﻿" + csv) // a BOM, so a spreadsheet opens it as UTF-8
console.log(counts)
