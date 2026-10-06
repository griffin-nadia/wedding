import { useEffect, useId, useRef, useState } from "react"
import { CarTaxiFront, Flower2, TrainFront } from "lucide-react"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/**
 * The trail (v3 A, K, Q1): Kyoto Station → taxi → The Sodoh, on Travel only. Phones stack the stops down
 * a moss line; from 768 they run left to right on the drawn path, inside the letter. Never scrolls
 * sideways, labels wrap. The line draws in once when it comes into view; still under reduced motion.
 */
export function Trail({ className }: { className?: string }) {
  const { t } = useLang()
  const ref = useRef<HTMLDivElement>(null)
  const [drawn, setDrawn] = useState(false)
  const clip = `trail-${useId().replace(/:/g, "")}`
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return setDrawn(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect() } }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const stops = [
    { icon: TrainFront, title: t.trail.station, note: t.trail.stationNote, x: 84 },
    { icon: CarTaxiFront, title: t.trail.taxi, note: t.trail.taxiNote, x: 300 },
    { icon: Flower2, title: t.trail.venue, note: t.trail.venueNote, x: 516 },
  ]
  return (
    <figure className={cn("trail", className)} aria-label={t.trail.label}>
      <div ref={ref} className="trail-plate">
        <div className="trail-track">
        <svg viewBox="0 0 600 72" preserveAspectRatio="none" className="trail-svg" aria-hidden>
          {/* Drawn in by a clip that sweeps left to right: a dash sized by pathLength comes up short on a stretched,
              non-scaling stroke, so the line used to stop before The Sodoh */}
          <defs><clipPath id={clip}><rect x="0" y="-12" width="600" height="96" className={cn("trail-reveal", drawn && "is-drawn")} /></clipPath></defs>
          <path d="M84 36 C 156 8, 228 64, 300 36 S 444 8, 516 36" vectorEffect="non-scaling-stroke" clipPath={`url(#${clip})`} className="trail-path" />
        </svg>
        <ol className={cn("trail-stops", drawn && "is-drawn")}>
          {stops.map((s, i) => (
            <li key={s.title} style={{ left: `${(s.x / 600) * 100}%`, transitionDelay: `${300 + i * 300}ms` }} className={cn("trail-stop", drawn && "is-drawn")}>
              <span className="trail-icon"><s.icon className="size-5" aria-hidden /></span>
              <span className="trail-text"><span className="font-medium text-foreground">{s.title}</span><span className="text-sm">{s.note}</span></span>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </figure>
  )
}
