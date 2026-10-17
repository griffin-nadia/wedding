import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { PaperTexture } from "@paper-design/shaders-react"
import { PAPER, inkFor, type PaperParams } from "@/lib/paper"

/**
 * The paper, made here (18f): Paper's PaperTexture shader draws one still sheet the size of the screen, at the
 * screen's pixel density, once per theme (no image is downloaded). It's copied out as the --paper-live background
 * every paper surface lays over itself (index.css), and the WebGL context is let go straight away, so nothing keeps
 * running. Light: white paper with warm grain, multiplied in. Lantern: the same inverted, light fibres on black,
 * screened in, so the dark paper lifts instead of darkening. Drawn again only when the theme or the screen's width
 * changes. Without WebGL the surfaces stay plain paper.
 */
const cache = new Map<string, string>()
const frame = () => new Promise((r) => requestAnimationFrame(r))

async function draw(params: PaperParams, night: boolean, w: number, h: number, dpr: number): Promise<string> {
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
    root.render(createElement(PaperTexture, { ...params, ...inkFor(night), fit: "cover", speed: 0, minPixelRatio: 1, maxPixelCount: W * H, webGlContextAttributes: { preserveDrawingBuffer: true }, style: { width: W, height: H } }))
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
    cache.set(key, url)
    return url
  } finally {
    root.unmount() // lets the WebGL context go
    host.remove()
  }
}

/** Starts it (main.tsx calls it on the first input), when the browser is idle; then again on a theme or width change */
export function startPaper(params = PAPER) {
  const root = document.documentElement
  let width = 0
  const run = async () => {
    const night = root.getAttribute("data-theme") === "lantern"
    // The screen, not the card: every paper surface is about that size, and it's drawn as cover
    const w = Math.round(innerWidth), h = Math.round(innerHeight), dpr = Math.min(3, devicePixelRatio || 1)
    width = w
    try {
      const url = await draw(params, night, w, h, dpr)
      if ((root.getAttribute("data-theme") === "lantern") !== night) return // the theme changed meanwhile
      root.style.setProperty("--paper-live", `url("${url}")`)
    } catch { /* no WebGL: plain paper */ }
  }
  const idle = (f: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 300))
  idle(run)
  new MutationObserver(() => idle(run)).observe(root, { attributes: true, attributeFilter: ["data-theme"] })
  // A new width (a phone turned, a window resized) by more than a little; the keyboard only changes the height
  let t = 0
  addEventListener("resize", () => { clearTimeout(t); t = window.setTimeout(() => { if (Math.abs(innerWidth - width) > 40) void run() }, 600) })
}
