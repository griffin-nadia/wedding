import { useEffect, useRef, useState } from "react"
import { CarTaxiFront, Flower2, TrainFront } from "lucide-react"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/**
 * The trail (v3 A, K): Kyoto Station → taxi → The Sodoh, on a paper strip. The path draws in once
 * (1.2 s) when it comes into view; on phones the strip is wider than the screen and pans with a drag.
 * Shared by The day and Travel (and Our story B later). Still under reduced motion.
 */
export function Trail({ className }: { className?: string }) {
  const { t } = useLang()
  const ref = useRef<HTMLDivElement>(null)
  const [drawn, setDrawn] = useState(false)
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
      <div ref={ref} className="trail-plate" tabIndex={0} role="group" aria-label={t.trail.label}>
        <div className="trail-track">
        <svg viewBox="0 0 600 72" preserveAspectRatio="none" className="trail-svg" aria-hidden>
          <path d="M84 36 C 156 8, 228 64, 300 36 S 444 8, 516 36" pathLength={1} vectorEffect="non-scaling-stroke" className={cn("trail-path", drawn && "is-drawn")} />
        </svg>
        <ol className="trail-stops">
          {stops.map((s, i) => (
            <li key={s.title} style={{ left: `${(s.x / 600) * 100}%`, transitionDelay: `${300 + i * 300}ms` }} className={cn("trail-stop", drawn && "is-drawn")}>
              <span className="trail-icon"><s.icon className="size-5" aria-hidden /></span>
              <span className="font-medium text-foreground">{s.title}</span>
              <span className="text-sm">{s.note}</span>
            </li>
          ))}
        </ol>
        </div>
      </div>
    </figure>
  )
}
