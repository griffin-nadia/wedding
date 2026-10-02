import { useEffect, useRef, useState } from "react"

type Stop = { title: string; body: string }

/**
 * Option E: two dotted journeys (Brisbane, and Canada, town TBC) drawing in to Kyoto as the map
 * scrolls into view. Decorative map; the story stops below are the readable version.
 */
export function JourneyMap({ stops, labels }: { stops: Stop[]; labels: { brisbane: string; canada: string; kyoto: string } }) {
  const ref = useRef<SVGSVGElement>(null)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setDrawn(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect() } }, { rootMargin: "-10% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const line = (d: string, delay: string) => (
    <path d={d} pathLength={1} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"
      strokeDasharray="0.012 0.018" className="journey-line" style={{ strokeDashoffset: drawn ? 0 : 1, transitionDelay: delay }} />
  )
  return (
    <div className="space-y-6">
      <svg ref={ref} aria-hidden viewBox="0 0 400 260" className="w-full rounded-[1.25rem] bg-card ring-1 ring-border">
        <path d="M40 200c30-30 70-20 90-50s10-60 50-70" fill="none" stroke="var(--border)" strokeWidth="1" />
        <path d="M300 40c20 10 40 30 30 60s-40 40-20 70" fill="none" stroke="var(--border)" strokeWidth="1" />
        {line("M70 225C140 220 210 160 268 108", "0s")}
        {line("M360 40C330 50 300 70 272 100", ".4s")}
        <circle cx="70" cy="225" r="5" fill="var(--leaf)" /><text x="78" y="243" fontSize="12" fill="var(--body)">{labels.brisbane}</text>
        <circle cx="360" cy="40" r="5" fill="var(--leaf)" /><text x="300" y="28" fontSize="12" fill="var(--body)">{labels.canada}</text>
        <circle cx="270" cy="104" r="7" fill="var(--primary)" /><text x="252" y="130" fontSize="13" fill="var(--foreground)">{labels.kyoto}</text>
      </svg>
      <ol className="space-y-4">
        {stops.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-3">
            <span className="numerals text-2xl text-primary">{i + 1}</span>
            <span><span className="block font-semibold">{s.title}</span><span className="block text-body">{s.body}</span></span>
          </li>
        ))}
      </ol>
    </div>
  )
}
