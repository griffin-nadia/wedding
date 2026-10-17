import { useEffect, useRef } from "react"
import { loop } from "@/lib/frame"

/**
 * Experiment: parallax layers from Nadia's art. Her drawn envelope (open and closed) and the G&N seal sit on three
 * layers that drift with the pointer (or the phone's tilt), each by a different amount, eased through the site's one
 * frame loop. Still under reduced motion.
 */
const css = `
.x-par { position: relative; height: 280px; overflow: hidden; border-radius: var(--radius-section); background: radial-gradient(120% 90% at 30% 20%, var(--brand-mitsu), var(--brand-kinari) 60%); }
.x-par img { position: absolute; left: 50%; top: 50%; pointer-events: none; will-change: transform; }
`
const base = import.meta.env.BASE_URL
export default function Parallax() {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const layers = [...el.querySelectorAll<HTMLElement>("[data-depth]")]
    let tx = 0, ty = 0, x = 0, y = 0
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5 }
    const tilt = (e: DeviceOrientationEvent) => { tx = Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 60)); ty = Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 60)) }
    el.addEventListener("pointermove", move); addEventListener("deviceorientation", tilt)
    const stop = loop(() => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08
      for (const l of layers) { const d = Number(l.dataset.depth); l.style.transform = `translate(calc(-50% + ${x * d}px), calc(-50% + ${y * d}px))` }
    })
    return () => { stop(); el.removeEventListener("pointermove", move); removeEventListener("deviceorientation", tilt) }
  }, [])
  return (
    <div ref={box} className="x-par" aria-label="Nadia's envelope drawings on three layers" role="img">
      <style>{css}</style>
      <img data-depth="12" src={`${base}art/envelope/drawn-open-760.webp`} alt="" width={300} style={{ transform: "translate(-50%, -50%)", opacity: 0.55 }} />
      <img data-depth="30" src={`${base}art/envelope/drawn-closed-760.webp`} alt="" width={220} style={{ transform: "translate(-50%, -50%)" }} />
      <img data-depth="56" src={`${base}brand/seal.svg`} alt="" width={56} style={{ transform: "translate(-50%, -50%)" }} />
    </div>
  )
}
