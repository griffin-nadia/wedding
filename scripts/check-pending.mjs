// npm run check:pending — lists every placeholder (src/content/pending.ts) still in use on the site, and checks each
// has English and Japanese. Exits 1 if a key is missing a language or the site uses a key that doesn't exist.
// Run it before launch: anything it lists is still standing in for Griffin and Nadia's own words or photos.
import fs from "node:fs"
import path from "node:path"

const file = fs.readFileSync("src/content/pending.ts", "utf8")
const keys = [...file.matchAll(/^\s+"([a-zA-Z.]+)": \{\n\s+en: "([^"]*)",\n\s+ja: "([^"]*)",/gm)].map((m) => ({ key: m[1], en: m[2], ja: m[3] }))
const declared = [...file.matchAll(/^\s+"([a-zA-Z.]+)": \{/gm)].map((m) => m[1])
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
const files = walk("src").filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith("pending.ts") && !/src\/(tune|lab)\//.test(f))
const uses = new Map()
for (const f of files) for (const m of fs.readFileSync(f, "utf8").matchAll(/pending\("([a-zA-Z.]+)"/g)) uses.set(m[1], [...(uses.get(m[1]) ?? []), f])

let bad = 0
for (const k of declared) if (!keys.find((x) => x.key === k && x.en && x.ja)) { console.error(`✖ ${k}: needs both en and ja`); bad++ }
for (const k of uses.keys()) if (!declared.includes(k)) { console.error(`✖ ${k}: used but not in pending.ts`); bad++ }
const live = keys.filter((k) => uses.has(k.key))
console.log(live.length ? `${live.length} placeholder${live.length === 1 ? "" : "s"} still in use:` : "No placeholders in use. Ready for launch.")
for (const k of live) console.log(`- ${k.key} (${[...new Set(uses.get(k.key))].join(", ")})\n    en: ${k.en}\n    ja: ${k.ja}`)
const unused = declared.filter((k) => !uses.has(k))
if (unused.length) console.log(`Not used any more (delete from pending.ts): ${unused.join(", ")}`)
process.exit(bad ? 1 : 0)
