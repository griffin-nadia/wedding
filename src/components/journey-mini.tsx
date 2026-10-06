import { useId } from "react"
import type { Flying } from "@/lib/api"
import { FROM, KYOTO, arc } from "@/lib/journey"
import { cn } from "@/lib/utils"

/** The land on every guest map: Australia, Japan, a corner of Canada (soft, painted feel). */
export function JourneyLand() {
  return (
    <>
      <defs><pattern id="journey-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" className="journey-dot-grain" /></pattern></defs>
      <path className="journey-land" d="M60 236c26-30 82-40 118-30 30-14 60-2 74 22 12 24 0 50-24 64-34 18-90 20-128 8-36-12-60-34-40-64z" />
      <path className="journey-land journey-land-green" d="M120 150c8-20 22-34 30-52 8-16 20-30 34-38 8 8 0 22-8 32-12 16-22 32-34 48-8 12-18 18-22 10z" />
      <path className="journey-land" d="M300 6c30-10 70-6 96 6v70c-22 8-50 0-68-12-18-14-40-50-28-64z" />
    </>
  )
}

/**
 * The same hand-drawn map, small (Options → Journey map). In the reply: their gold line draws from the city they
 * pick and redraws when they change it. After the fortune and on Home: everyone's lines faint first (counts only,
 * never names), theirs drawing in last. Still under reduced motion: every line already drawn.
 */
export function JourneyMini({ you, counts, label, className }: { you: Flying | null; counts?: Partial<Record<Flying, number>> | null; label: string; className?: string }) {
  const id = useId().replace(/:/g, "")
  const others = counts ? (Object.keys(counts) as Flying[]).filter((c) => FROM[c] && (counts[c] ?? 0) > 0) : []
  const youDelay = others.length ? 300 + others.length * 120 + 300 : 0
  return (
    <svg viewBox="0 0 400 320" role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className={cn("journey is-in journey-map journey-mini", className)}>
      <JourneyLand />
      <defs>
        {others.map((c, i) => (
          <mask key={c} id={`${id}-g${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320">
            <path d={arc(FROM[c], KYOTO, 0.15)} className="journey-reveal journey-reveal-guest" style={{ animationDelay: `${300 + i * 120}ms` }} pathLength={1} />
          </mask>
        ))}
      </defs>
      {others.map((c, i) => <path key={c} d={arc(FROM[c], KYOTO, 0.15)} className="journey-guest" mask={`url(#${id}-g${i})`} />)}
      {you && <path key={you} d={arc(FROM[you], KYOTO, 0.25)} className="journey-you" pathLength={1} style={{ animationDelay: `${youDelay}ms` }} />}
      {you && <circle key={`${you}-dot`} cx={FROM[you][0]} cy={FROM[you][1]} r="5" className="journey-you-dot" />}
      <g transform={`translate(${KYOTO[0] - 14} ${KYOTO[1] - 14})`} aria-hidden>
        <rect width="28" height="28" rx="6" className="journey-seal" />
        <text x="14" y="20" textAnchor="middle" className="journey-seal-text">京</text>
      </g>
    </svg>
  )
}
