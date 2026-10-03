// Applies .brief/tune.json (exported from the tuning panel) to src/styles/tokens.css.
// "all" overrides change the first declaration of each token; "autumn" and "lantern" change the
// system tokens in that mode's block. Notes and options are printed for the next run to act on.
import fs from "node:fs"

const tunePath = process.argv[2] || ".brief/tune.json"
const cssPath = "src/styles/tokens.css"
const tune = JSON.parse(fs.readFileSync(tunePath, "utf8"))
let css = fs.readFileSync(cssPath, "utf8")
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

function setIn(block, name, value) {
  const start = block ? css.indexOf(block) : 0
  if (start < 0) return false
  const end = block ? css.indexOf("\n}", start) : css.length
  const re = new RegExp(`(\\n\\s*${esc(name)}:\\s*)[^;]+;`)
  const part = css.slice(start, end)
  if (!re.test(part)) return false
  css = css.slice(0, start) + part.replace(re, `$1${value};`) + css.slice(end)
  return true
}

const blocks = { autumn: ':root,\n[data-theme="autumn"] {\n  color-scheme: light;', lantern: '[data-theme="lantern"] {\n  color-scheme: dark;' }
let n = 0
for (const [name, value] of Object.entries(tune.overrides?.all ?? {})) (setIn(null, name, value) ? n++ : console.warn("not found:", name))
for (const mode of ["autumn", "lantern"]) for (const [name, value] of Object.entries(tune.overrides?.[mode] ?? {})) (setIn(blocks[mode], name, value) ? n++ : console.warn(`not found in ${mode}:`, name))
fs.writeFileSync(cssPath, css)
console.log(`${n} tokens updated in ${cssPath}`)
if (Object.keys(tune.options ?? {}).length) console.log("Options picked:", tune.options)
for (const note of tune.notes ?? []) console.log(`Note (${note.path}, ${note.viewport.w}×${note.viewport.h}, ${note.theme}) on ${note.selector}: ${note.text}`)
