import SHEETS from "@/data/paper-sheets.json"

/**
 * The paper (run 26): one sheet exported ahead of time (scripts/paper-export.mjs: the same PaperTexture sheet that
 * src/lib/paper-live.ts used to make here with WebGL, seconds after the page had settled), as AVIF at the size this
 * screen shows it. index.html picks the file and preloads it from the first paint, and covers the page with a plain
 * paper veil (the seal, breathing; still under reduced motion) until it's in, at most 1.5 s from its first paint, on a first visit only.
 * Once it has decoded it's laid over every paper surface (index.css, --paper-live) at the strength that keeps text AA.
 * A theme switch swaps in the other theme's sheet; turning the phone or resizing the window by more than a little
 * picks the size again. A browser that can't decode AVIF keeps the plain paper. Off under Save-Data.
 */
type PaperBoot = { on: boolean; at: (night: boolean) => string; done: (src: string, ok: boolean) => void }
declare global { interface Window { __ngPaper?: PaperBoot } }

// sRGB 0 to 1 per channel of any CSS colour (oklch included), through a 1px canvas
const rgb = (css: string): [number, number, number] => {
  const c = new OffscreenCanvas(1, 1).getContext("2d")!
  c.fillStyle = css; c.fillRect(0, 0, 1, 1)
  const d = c.getImageData(0, 0, 1, 1).data
  return [d[0] / 255, d[1] / 255, d[2] / 255]
}
const lum = ([r, g, b]: number[]) => { const f = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }

/**
 * How strongly the paper can go on and keep text AA (4.5:1) on its most extreme spot: the faintest text (--ink-muted)
 * over the paper (--letter-bg), both multiplied by the darkest grain by day, both screened with the lightest at night,
 * at the theme's own strength or less. If the plain page is already under 4.5 there, it's kept no worse.
 */
export function aaStrength(night: boolean, extreme: number, want: number) {
  const css = getComputedStyle(document.documentElement)
  const text = rgb(css.getPropertyValue("--ink-muted")), paper = rgb(css.getPropertyValue("--letter-bg"))
  const apply = (c: number[], s: number) => c.map((v) => (night ? v + s * extreme * (1 - v) : v * (1 - s * (1 - extreme))))
  const floor = Math.min(4.5, ratio(text, paper))
  let lo = 0, hi = want
  if (ratio(apply(text, hi), apply(paper, hi)) >= floor) return hi
  for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (ratio(apply(text, mid), apply(paper, mid)) >= floor) lo = mid; else hi = mid }
  return lo
}

export function startPaperSheet() {
  const boot = window.__ngPaper
  if (!boot?.on) return
  const root = document.documentElement
  let width = innerWidth, n = 0
  const run = () => {
    const night = root.getAttribute("data-theme") === "lantern", src = boot.at(night), id = ++n
    const img = new Image()
    img.src = src
    img.decode().then(() => {
      if (id !== n) return
      const want = parseFloat(getComputedStyle(root).getPropertyValue("--paper-strength")) || 0.45
      root.style.setProperty("--paper-live", `url("${src}")`)
      root.style.setProperty("--paper-on", String(aaStrength(night, night ? SHEETS.lantern : SHEETS.autumn, want)))
      root.setAttribute("data-paper", "")
      boot.done(src, true)
    }, () => boot.done(src, false))
  }
  run()
  // A new theme: the old sheet goes at once (it's the other theme's), the new one fades in once it has decoded
  new MutationObserver(() => { root.removeAttribute("data-paper"); run() }).observe(root, { attributes: true, attributeFilter: ["data-theme"] })
  // A new width (a phone turned, a window resized) by more than a little; the keyboard only changes the height
  let t = 0
  addEventListener("resize", () => { clearTimeout(t); t = window.setTimeout(() => { if (Math.abs(innerWidth - width) > 40) { width = innerWidth; run() } }, 600) })
}
