// Run 26: the omikuji's five tier colours stay readable on the cream slip in both themes. Run 26c: each tier's one ink
// is on the tier, 第七番, No. x of 25, the top and bottom bands and the seal's ring, so the tier shows at a glance. The
// words need 4.5:1 (WCAG AA text); the bands (drawn at their palest stop) and the ring (at the seal's opacity) are
// graphics and need 3:1. Reads tokens.css and index.css, so a token or style change can't slip below.
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"

const css = fs.readFileSync("src/styles/tokens.css", "utf8")
const app = fs.readFileSync("src/index.css", "utf8")
const block = (sel: string) => { const i = css.indexOf(`${sel} {`); return css.slice(i, css.indexOf("\n}", i)) }
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
const mix = (a: string, b: string, t: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, "0")).join("")
// The slip's washi (index.css): #f8f1e2 at 96%, over the light card, or over the walnut card at night
const WASHI = "#f8f1e2"
const root = block(':root, [data-theme="autumn"], .paper:not(.letter)')
const themes = { autumn: { css: root, slip: mix(WASHI, "#fbf5ea", 0.96) }, lantern: { css: block('[data-theme="lantern"]'), slip: mix(WASHI, "#382317", 0.96) } }
const TIERS = ["good", "great", "special", "grand", "super"]

// The palest stop of the bands' gradient, and the seal's opacity, as index.css draws them
const band = app.match(/--washi-band-top:\s*([^;]+);/)?.[1] ?? ""
const bandMin = Math.min(...[...band.matchAll(/var\(--tier\)\s+(\d+)%/g)].map((m) => Number(m[1]) / 100))
const sealOpacity = Number(app.match(/\.omikuji-seal\s*\{[^}]*opacity:\s*([\d.]+)/)?.[1] ?? 1)

test("the tier's ink is on every tier mark of the slip", () => {
  assert.ok(band && bandMin > 0 && bandMin <= 1, "bands read")
  assert.match(app, /\.omikuji-slip::before\s*\{[^}]*var\(--washi-band-top\)[^}]*var\(--washi-band-bottom\)/, "top and bottom bands")
  assert.match(app, /--washi-band-bottom:\s*var\(--washi-band-top\)/, "the bottom band is the top's ink")
  for (const [sel, prop] of [[".omikuji-no", "color"], [".omikuji-kichi", "color"], [".omikuji-hand", "color"], [".omikuji-slip .omikuji-tier", "color"], [".omikuji-seal .hanko-rim", "stroke"], [".omikuji-seal .hanko-rim-inner", "stroke"]]) {
    const rule = app.match(new RegExp(`(?:^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`))?.[1] ?? ""
    assert.match(rule, new RegExp(`${prop}:\\s*var\\(--tier\\)`), `${sel} ${prop}`)
  }
  // No. x of 25 is the hand style (its colour), not overridden
  assert.doesNotMatch(app, /\.omikuji-count\s*\{[^}]*color:/)
  for (const tier of TIERS.filter((t) => t !== "great")) assert.match(app, new RegExp(`\\[data-tier="${tier}"\\]\\s*\\{[^}]*--tier:\\s*var\\(--tier-${tier}\\)`), tier)
})

for (const [name, th] of Object.entries(themes)) {
  test(`every tier meets AA on the slip (${name})`, () => {
    for (const tier of TIERS) {
      const re = new RegExp(`--tier-${tier}:\\s*(#[0-9a-f]{6})`, "i")
      const ink = th.css.match(re)?.[1] ?? root.match(re)?.[1]
      assert.ok(ink, `${name} ${tier}: token missing`)
      assert.ok(ratio(ink, th.slip) >= 4.5, `${name} ${tier} words ${ratio(ink, th.slip).toFixed(2)}`)
      const bar = ratio(mix(ink, th.slip, bandMin), th.slip), ring = ratio(mix(ink, th.slip, sealOpacity), th.slip)
      assert.ok(bar >= 3, `${name} ${tier} bands ${bar.toFixed(2)}`)
      assert.ok(ring >= 3, `${name} ${tier} ring ${ring.toFixed(2)}`)
    }
  })
}

test("the five tiers are told apart by colour, not only by their names", () => {
  // hue in degrees from sRGB; neighbours at least 20 degrees apart
  const hue = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), max = Math.max(r, g, b), d = max - Math.min(r, g, b)
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    return (h * 60 + 360) % 360
  }
  const hues = TIERS.map((t) => hue(root.match(new RegExp(`--tier-${t}:\\s*(#[0-9a-f]{6})`, "i"))![1])).sort((a, b) => a - b)
  for (let k = 0; k < hues.length; k++) {
    const gap = k ? hues[k] - hues[k - 1] : hues[0] + 360 - hues[hues.length - 1]
    assert.ok(gap >= 20, `hues ${hues.map((h) => h.toFixed(0)).join(", ")}`)
  }
})
