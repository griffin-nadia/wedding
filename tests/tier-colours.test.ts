// Run 26: the omikuji's five tier colours stay readable on the cream slip in both themes: the tier's ink at 4.5:1 or
// more (WCAG AA text), its seal ring at 3:1 or more (a graphic). Reads tokens.css, so a token change can't slip below.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const css = fs.readFileSync("src/styles/tokens.css", "utf8")
const block = (sel: string) => { const i = css.indexOf(`${sel} {`); return css.slice(i, css.indexOf("\n}", i)) }
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
const mix = (a: string, b: string, t: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, "0")).join("")
// The slip's washi (index.css): #f8f1e2 at 96%, over the light card, or over the walnut card at night
const WASHI = "#f8f1e2"
const themes = { autumn: { css: block(':root, [data-theme="autumn"], .paper:not(.letter)'), slip: mix(WASHI, "#fbf5ea", 0.96) }, lantern: { css: block('[data-theme="lantern"]'), slip: mix(WASHI, "#382317", 0.96) } }

for (const [name, th] of Object.entries(themes)) {
  test(`every tier meets AA on the slip (${name})`, () => {
    for (const tier of ["good", "great", "special", "grand", "super"]) {
      const get = (k: string) => th.css.match(new RegExp(`--${k}:\\s*(#[0-9a-f]{6})`, "i"))?.[1]
      const ink = get(`tier-${tier}`), ring = get(`tier-${tier}-ring`)
      assert.ok(ink && ring, `${name} ${tier}: tokens missing`)
      assert.ok(ratio(ink, th.slip) >= 4.5, `${name} ${tier} ink ${ratio(ink, th.slip).toFixed(2)}`)
      assert.ok(ratio(ring, th.slip) >= 3, `${name} ${tier} ring ${ratio(ring, th.slip).toFixed(2)}`)
    }
  })
}
