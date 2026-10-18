import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { PaperTexture } from "@paper-design/shaders-react"
import { PAPER, inkFor, nightOf, type PaperParams } from "@/lib/paper"

/**
 * The paper, made here (18f): Paper's PaperTexture shader draws one still sheet the size of the screen, at the
 * screen's pixel density, once per theme (no image is downloaded). It's copied out as the --paper-live background
 * every paper surface lays over itself (index.css), and the WebGL context is let go straight away, so nothing keeps
 * running. Light: white paper with warm grain, multiplied in. Lantern: the same inverted, light fibres on black,
 * screened in, so the dark paper lifts instead of darkening. Drawn again only when the theme or the screen's width
 * changes. Without WebGL the surfaces stay plain paper.
 */
const cache = new Map<string, { url: string; extreme: number }>()
const frame = () => new Promise((r) => requestAnimationFrame(r))

/** The sheet's url, and its most extreme pixel (0 to 1): the darkest by day, the lightest at night */
async function draw(params: PaperParams, night: boolean, w: number, h: number, dpr: number): Promise<{ url: string; extreme: number }> {
  const key = `${night}:${w}x${h}@${dpr}:${JSON.stringify(params)}`
  const hit = cache.get(key)
  if (hit) return hit
  // On the screen (the shader only draws what is) but see-through, so nobody sees it being made
  const host = document.createElement("div")
  host.setAttribute("aria-hidden", "true")
  // Laid out at the screen's device pixels and drawn at 1x, so the sheet comes out sharp wherever the browser
  // reports its pixel density late or not at all (the pattern is relative to the sheet, so it looks the same)
  const W = Math.round(w * dpr), H = Math.round(h * dpr)
  host.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;opacity:0;z-index:-1;overflow:hidden`
  document.body.append(host)
  const root = createRoot(host)
  try {
    root.render(createElement(PaperTexture, { ...(night ? nightOf(params) : params), ...inkFor(night), fit: "cover", speed: 0, minPixelRatio: 1, maxPixelCount: W * H, webGlContextAttributes: { preserveDrawingBuffer: true }, style: { width: W, height: H } }))
    // Wait until it's at full size and has drawn (its noise texture loads first)
    let canvas: HTMLCanvasElement | null = null
    for (let i = 0; i < 120; i++) {
      await frame()
      canvas = host.querySelector("canvas")
      if (canvas && canvas.width >= W * 0.95 && i > 6) break
    }
    for (let i = 0; i < 6; i++) await frame()
    if (!canvas) throw new Error("no WebGL")
    const url = await new Promise<string>((ok, fail) => canvas!.toBlob((b) => (b ? ok(URL.createObjectURL(b)) : fail(new Error("no blob"))), "image/webp", 0.85))
    // Its darkest (or, at night, lightest) spot, sampled small: what the text contrast has to survive
    const probe = new OffscreenCanvas(Math.round(W / 4), Math.round(H / 4)), x = probe.getContext("2d", { willReadFrequently: true })!
    x.drawImage(canvas, 0, 0, probe.width, probe.height)
    const d = x.getImageData(0, 0, probe.width, probe.height).data
    let extreme = night ? 0 : 255
    for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; extreme = night ? Math.max(extreme, v) : Math.min(extreme, v) }
    const out = { url, extreme: extreme / 255 }
    cache.set(key, out)
    return out
  } finally {
    root.unmount() // lets the WebGL context go
    host.remove()
  }
}

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

/** Starts it (main.tsx: after the first paint, at idle or the first input, whichever comes first), and again on a theme
 *  or width change. It fades in (index.css) once made. */
export function startPaper(params = PAPER) {
  const root = document.documentElement
  let width = 0
  const run = async () => {
    const night = root.getAttribute("data-theme") === "lantern"
    // The screen, not the card: every paper surface is about that size, and it's drawn as cover
    const w = Math.round(innerWidth), h = Math.round(innerHeight), dpr = Math.min(3, devicePixelRatio || 1)
    width = w
    try {
      const { url, extreme } = await draw(params, night, w, h, dpr)
      if ((root.getAttribute("data-theme") === "lantern") !== night) return // the theme changed meanwhile
      root.style.removeProperty("--paper-on")
      const want = parseFloat(getComputedStyle(root).getPropertyValue("--paper-strength")) || 0.45
      root.style.setProperty("--paper-live", `url("${url}")`)
      root.style.setProperty("--paper-on", String(aaStrength(night, extreme, want)))
      root.setAttribute("data-paper", "")
    } catch { /* no WebGL: plain paper */ }
  }
  const idle = (f: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 300))
  idle(run)
  // A new theme: the old sheet goes at once (it's the other theme's), the new one fades in when made
  new MutationObserver(() => { root.removeAttribute("data-paper"); idle(run) }).observe(root, { attributes: true, attributeFilter: ["data-theme"] })
  // A new width (a phone turned, a window resized) by more than a little; the keyboard only changes the height
  let t = 0
  addEventListener("resize", () => { clearTimeout(t); t = window.setTimeout(() => { if (Math.abs(innerWidth - width) > 40) void run() }, 600) })
}
