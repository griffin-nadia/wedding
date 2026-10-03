import { useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Press and hold to stamp (v3 T, the Planner's "Hanko RSVP" idea): holding fills the button like ink pressing
 * down, and it fires once full (900 ms). Let go early and nothing happens. Enter or Space still work as a plain
 * press for keyboards and switch users, and the fill is instant under reduced motion.
 */
export function HoldButton({ onDone, children, hint, className }: { onDone: () => void; children: ReactNode; hint: string; className?: string }) {
  const [p, setP] = useState(0)
  const raf = useRef(0), start = useRef(0)
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const stop = () => { cancelAnimationFrame(raf.current); start.current = 0; setP(0) }
  const tick = () => {
    const v = Math.min(1, (performance.now() - start.current) / 900)
    setP(v)
    if (v >= 1) { stop(); onDone(); return }
    raf.current = requestAnimationFrame(tick)
  }
  return (
    <button type="button" className={cn("btn-primary hold-btn relative inline-flex h-(--button-height) items-center justify-center overflow-hidden rounded-(--button-radius) px-(--button-pad) font-label font-medium", className)}
      onPointerDown={(e) => { if (e.button !== 0) return; if (still) { onDone(); return } start.current = performance.now(); raf.current = requestAnimationFrame(tick) }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDone() } }}
      aria-describedby="hold-hint">
      <span aria-hidden className="hold-fill" style={{ transform: `scaleX(${p})` }} />
      <span className="relative">{children}</span>
      <span id="hold-hint" className="sr-only">{hint}</span>
    </button>
  )
}
