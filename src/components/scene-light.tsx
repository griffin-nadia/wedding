import { useEffect, useRef } from "react"
import { faceRect } from "@/lib/face"
import { useTheme } from "@/lib/theme"

/**
 * Light, not a glow (Options → Light). Laptops with a fine pointer only; lazy-loaded.
 * - Day: komorebi, soft dappled light through leaves, drifting very slowly over the photo and the paper.
 * - Night: a warm lantern pool that drifts and breathes with a slight flicker, a few out-of-focus lantern bokeh far
 *   back, and the paper grain catching the light.
 * The pointer only nudges it, with a long eased lag; idle, it drifts on its own. Never a trail. Their faces get a
 * soft hole so the light never sits on them at full strength. ~30 fps, paused while the tab is hidden; a still frame
 * under reduced motion. Two builds to compare: CSS and SVG ("css"), or one ogl shader ("shader").
 */
export default function SceneLight({ variant }: { variant: "css" | "shader" }) {
  const ref = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const night = theme === "lantern"
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches
    // Faces: a soft hole in the light, refreshed on resize and when the photo changes size
    const hole = () => {
      const f = faceRect()
      el.style.setProperty("--face-x", f ? `${f.left + f.width / 2}px` : "-999px")
      el.style.setProperty("--face-y", f ? `${f.top + f.height / 2}px` : "-999px")
      el.style.setProperty("--face-r", f ? `${Math.max(f.width, f.height) * 0.62}px` : "0px")
    }
    hole(); const holeId = setTimeout(hole, 600)
    addEventListener("resize", hole)
    let stopGl: (() => void) | undefined
    if (variant === "shader") void import("./scene-light-gl").then((m) => { stopGl = m.startLight(el, night, still) })
    // The pointer nudges: a target that the light eases toward slowly (about 2% of the gap a frame, at 30 fps)
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, last = 0
    const move = (e: PointerEvent) => { if (e.pointerType === "mouse") { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2 } }
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (document.hidden || now - last < 33) return
      last = now
      x += (tx - x) * 0.02; y += (ty - y) * 0.02
      el.style.setProperty("--nx", x.toFixed(4)); el.style.setProperty("--ny", y.toFixed(4))
    }
    if (!still) { addEventListener("pointermove", move, { passive: true }); raf = requestAnimationFrame(tick) }
    return () => { clearTimeout(holeId); removeEventListener("resize", hole); removeEventListener("pointermove", move); cancelAnimationFrame(raf); stopGl?.() }
  }, [variant, night])
  return (
    <div ref={ref} aria-hidden className="scene-light" data-variant={variant} data-night={night || undefined}>
      {variant === "css" && (night
        ? <>
            <span className="scene-light-pool" />
            <span className="scene-light-grain" />
            <span className="scene-light-bokeh"><i /><i /><i /><i /><i /></span>
          </>
        : <>
            {/* Leaf gaps: soft noise thresholded into spots of sun, then softened; a far layer and a near one */}
            {[["far", "7", "0.006 0.009"], ["near", "23", "0.004 0.006"]].map(([k, seed, freq]) => (
              <svg key={k} className={`scene-light-leaves is-${k}`} preserveAspectRatio="none">
                <filter id={`komorebi-${k}`} x="0" y="0" width="100%" height="100%">
                  <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="3" seed={seed} />
                  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.8  9 0 0 0 -5.3" />
                  <feGaussianBlur stdDeviation={k === "far" ? "5" : "9"} />
                </filter>
                <rect width="100%" height="100%" filter={`url(#komorebi-${k})`} />
              </svg>
            ))}
          </>)}
    </div>
  )
}
