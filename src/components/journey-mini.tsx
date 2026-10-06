import { useId, useState } from "react"
import type { Flying } from "@/lib/api"
import { ART } from "@/lib/art"
import { FROM, KYOTO, PLACES, arc } from "@/lib/journey"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/**
 * The land on every map: Nadia's painting once ART.mapLand is set (painted on the template, so its dashed box is
 * this 400 × 320 viewBox exactly), otherwise the drawn land: Australia, Japan, a corner of Canada.
 */
export function JourneyLand() {
  if (ART.mapLand) return <image href={`${import.meta.env.BASE_URL}${ART.mapLand}`} x="0" y="0" width="400" height="320" preserveAspectRatio="none" className="journey-land-art" />
  return (
    <>
      <defs><pattern id="journey-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" className="journey-dot-grain" /></pattern></defs>
      <path className="journey-land" d="M60 236c26-30 82-40 118-30 30-14 60-2 74 22 12 24 0 50-24 64-34 18-90 20-128 8-36-12-60-34-40-64z" />
      <path className="journey-land journey-land-green" d="M120 150c8-20 22-34 30-52 8-16 20-30 34-38 8 8 0 22-8 32-12 16-22 32-34 48-8 12-18 18-22 10z" />
      <path className="journey-land" d="M300 6c30-10 70-6 96 6v70c-22 8-50 0-68-12-18-14-40-50-28-64z" />
    </>
  )
}

/** Brisbane and Canada named on the map, and Kyoto under its seal ("KYOTO · 15 OCT 2027"), as in the hi-fi. */
export function JourneyPlaces() {
  const { t } = useLang()
  return (
    <g aria-hidden className="journey-places">
      <circle cx={PLACES.brisbane[0]} cy={PLACES.brisbane[1]} r="3" className="journey-place-dot" />
      <text x={PLACES.brisbane[0] + 8} y={PLACES.brisbane[1] + 4} className="journey-place">{t.journey.brisbane}</text>
      <circle cx={PLACES.canada[0]} cy={PLACES.canada[1]} r="3" className="journey-place-dot" />
      <text x={PLACES.canada[0] + 8} y={PLACES.canada[1] + 4} className="journey-place">{t.journey.canada}</text>
      {/* Two lines left of the seal, in the open water: KYOTO / 15 OCT 2027 */}
      <text x={KYOTO[0] - 22} y={KYOTO[1] - 2} textAnchor="end" className="journey-place journey-place-kyoto">
        {t.journey.kyoto.split(/ · |・/).map((part, i) => <tspan key={i} x={KYOTO[0] - 22} dy={i ? 12 : 0}>{part}</tspan>)}
      </text>
    </g>
  )
}

/** Nadia's line from Brisbane (rust) and Griffin's from Canada (moss), dotted, each drawn in by a mask. */
export function CoupleLines({ id }: { id: string }) {
  return (
    <>
      <defs>
        <mask id={`${id}-n`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320"><path d={arc(PLACES.brisbane, KYOTO)} className="journey-reveal" pathLength={1} /></mask>
        <mask id={`${id}-g`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320"><path d={arc(PLACES.canada, KYOTO, 0.2)} className="journey-reveal journey-reveal-2" pathLength={1} /></mask>
      </defs>
      <path d={arc(PLACES.brisbane, KYOTO)} className="journey-route journey-route-nadia" pathLength={1} mask={`url(#${id}-n)`} />
      <path d={arc(PLACES.canada, KYOTO, 0.2)} className="journey-route journey-route-griffin" pathLength={1} mask={`url(#${id}-g)`} />
    </>
  )
}

/** Nadia / Griffin / Guests (and Your line when there is one): what each colour of line means. */
export function JourneyLegend({ you = false }: { you?: boolean }) {
  const { t } = useLang()
  const items = [["nadia", t.journey.legend.nadia], ["griffin", t.journey.legend.griffin], ["guests", t.journey.legend.guests], ...(you ? [["you", t.journey.legend.you]] : [])]
  return (
    <ul className="journey-legend" aria-hidden>
      {items.map(([k, label]) => <li key={k}><span className={`journey-key journey-key-${k}`} />{label}</li>)}
    </ul>
  )
}

/**
 * The same hand-drawn map, small (Options → Journey map). Their gold line draws from the city they pick and redraws
 * when they change it; Nadia's and Griffin's lines are always there; everyone else's are faint gold (counts only,
 * never names), theirs drawing in last. Still under reduced motion: every line already drawn.
 */
export function JourneyMini({ you, counts, label, className }: { you: Flying | null; counts?: Partial<Record<Flying, number>> | null; label: string; className?: string }) {
  const id = useId().replace(/:/g, "")
  const others = counts ? (Object.keys(counts) as Flying[]).filter((c) => FROM[c] && (counts[c] ?? 0) > 0) : []
  const youDelay = 900 + others.length * 120
  return (
    <svg viewBox="0 0 400 320" role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className={cn("journey is-in journey-map journey-mini journey-hifi", className)}>
      <JourneyLand />
      <defs>
        {others.map((c, i) => (
          <mask key={c} id={`${id}-o${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320">
            <path d={arc(FROM[c], KYOTO, 0.15)} className="journey-reveal journey-reveal-guest" style={{ animationDelay: `${900 + i * 120}ms` }} pathLength={1} />
          </mask>
        ))}
      </defs>
      <CoupleLines id={id} />
      {others.map((c, i) => <path key={c} d={arc(FROM[c], KYOTO, 0.15)} className="journey-guest" mask={`url(#${id}-o${i})`} />)}
      {you && <path key={you} d={arc(FROM[you], KYOTO, 0.25)} className="journey-you" pathLength={1} style={{ animationDelay: `${youDelay}ms` }} />}
      {you && <circle key={`${you}-dot`} cx={FROM[you][0]} cy={FROM[you][1]} r="5" className="journey-you-dot" />}
      <JourneyPlaces />
      <g transform={`translate(${KYOTO[0] - 14} ${KYOTO[1] - 14})`} aria-hidden>
        <rect width="28" height="28" rx="6" className="journey-seal" />
        <text x="14" y="20" textAnchor="middle" className="journey-seal-text">京</text>
      </g>
    </svg>
  )
}

/**
 * The guest map with everything around it: the legend, "17 of 40 lines drawn so far", and See as a list (the same
 * lines in words, counts per city, never names). Used after the fortune and in Home's sheet.
 */
export function GuestMap({ you, flying, label }: { you: Flying | null; flying: { counts: Partial<Record<Flying, number>>; told: number; households: number } | null; label: string }) {
  const { t } = useLang()
  const [list, setList] = useState(false)
  const name = (c: Flying) => t.flying.cities[c] ?? c
  const cities = flying ? (Object.entries(flying.counts) as [Flying, number][]).filter(([, n]) => n > 0) : []
  return (
    <div className="flex flex-col gap-3">
      {list
        ? <ul className="flex flex-col gap-1">
            <li>{t.journey.list.nadia}</li>
            <li>{t.journey.list.griffin}</li>
            {you && <li className="font-medium text-foreground">{t.journey.list.you(name(you))}</li>}
            {cities.map(([c, n]) => <li key={c}>{t.journey.list.city(name(c), n)}</li>)}
          </ul>
        : <><JourneyMini you={you} counts={flying?.counts} label={label} /><JourneyLegend you={Boolean(you)} /></>}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {flying && flying.households > 0 ? <p className="text-sm text-muted-foreground">{t.journey.count(flying.told, flying.households)}</p> : <span />}
        <button type="button" className="btn-text min-h-11" onClick={() => setList((v) => !v)}>{list ? t.journey.seeMap : t.journey.seeList}</button>
      </div>
    </div>
  )
}
