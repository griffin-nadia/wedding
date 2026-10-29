import { useId, useState } from "react"
import type { Flying } from "@/lib/api"
import { ART } from "@/lib/art"
import { FROM, KYOTO, PLACES, arc, pointOfCity } from "@/lib/journey"
import type { City } from "@/lib/city-search"
import { LAND } from "@/lib/map-land"
import { placeOf } from "@/lib/places"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/**
 * The land on every map: Nadia's painting once ART.mapLand is set (painted on the template, so its dashed box is
 * this 400 × 320 viewBox exactly), otherwise the real outlines of Australia, New Zealand, Japan and Canada (18f),
 * each whole inside the card at its own scale, with "Not to scale" said in the corner.
 */
export function JourneyLand() {
  if (ART.mapLand) return <image href={`${import.meta.env.BASE_URL}${ART.mapLand}`} x="0" y="0" width="400" height="320" preserveAspectRatio="none" className="journey-land-art" />
  return (
    <>
      <defs><pattern id="journey-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.3" className="journey-dot-grain" /></pattern></defs>
      <path className="journey-land" d={LAND.AU.d} />
      <path className="journey-land" d={LAND.NZ.d} />
      <path className="journey-land journey-land-green" d={LAND.JP.d} />
      <path className="journey-land" d={LAND.CA.d} />
    </>
  )
}

/** A place's name beside its dot, on whichever side keeps it inside the map (never cut at the edge) */
function Named({ at: [x, y], name, room = 64 }: { at: [number, number]; name: string; room?: number }) {
  const left = x + 8 + room > 400
  return (
    <>
      <circle cx={x} cy={y} r="3" className="journey-place-dot" />
      <text x={left ? x - 8 : x + 8} y={y + 4} textAnchor={left ? "end" : "start"} className="journey-place">{name}</text>
    </>
  )
}

/** A place's name in this language */
export function usePlaceName() {
  const { lang } = useLang()
  return (name: string) => { const p = placeOf(name); return p ? (lang === "ja" ? p.ja : p.name) : name }
}

/** Brisbane and Canada named on the map, and Kyoto under its seal ("KYOTO · 15 OCT 2027"), as in the hi-fi. */
export function JourneyPlaces() {
  const { t } = useLang()
  return (
    <g aria-hidden className="journey-places">
      <Named at={PLACES.brisbane} name={t.journey.brisbane} />
      <Named at={PLACES.canada} name={t.journey.canada} />
      <text x="396" y="314" textAnchor="end" className="journey-place journey-scale">{t.kyotoMap.notToScale}</text>
      {/* Two lines left of the seal, in the open water: KYOTO / 15 OCT 2027 */}
      <text x={KYOTO[0] - 28} y={KYOTO[1] - 6} textAnchor="end" className="journey-place journey-place-kyoto">
        {t.journey.kyoto.split(/ · |・/).map((part, i) => <tspan key={i} x={KYOTO[0] - 28} dy={i ? 12 : 0}>{part}</tspan>)}
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

/** Griffin / Nadia / Guests (and Your line when there is one): what each colour of line means. */
export function JourneyLegend({ you = false }: { you?: boolean }) {
  const { t } = useLang()
  // 28 Oct (Jehan): Griffin, Nadia, You, then the other guests, so the three solid lines sit together and the dashed one last
  const items = [["griffin", t.journey.legend.griffin], ["nadia", t.journey.legend.nadia], ...(you ? [["you", t.journey.legend.you]] : []), ["guests", t.journey.legend.guests]]
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
type Others = { name: string; country: string; lat: number; lon: number; n: number }[]
export function JourneyMini({ you, counts, cities, label, className }: { you: City | null; counts?: Partial<Record<Flying, number>> | null; cities?: Others | null; label: string; className?: string }) {
  const id = useId().replace(/:/g, "")
  // Everyone else's lines: per city once the sheet sends cities (final run), else the older per-answer counts
  const lines: { key: string; at: [number, number] }[] = cities?.length
    ? cities.filter((c) => c.n > 0).map((c) => ({ key: `${c.name}|${c.country}`, at: pointOfCity({ id: 0, name: c.name, region: "", country: c.country, lat: c.lat, lon: c.lon }) }))
    : counts ? (Object.keys(counts) as Flying[]).filter((c) => FROM[c] && (counts[c] ?? 0) > 0).map((c) => ({ key: c, at: FROM[c] })) : []
  const others = lines
  const youDelay = 900 + others.length * 120
  const mine = you && you.id !== "jp" ? pointOfCity(you) : null
  return (
    <svg viewBox="0 0 400 320" role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true} className={cn("journey is-in journey-map journey-mini journey-hifi", className)}>
      <JourneyLand />
      <defs>
        {others.map((c, i) => (
          <mask key={c.key} id={`${id}-o${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="320">
            <path d={arc(c.at, KYOTO, 0.15)} className="journey-reveal journey-reveal-guest" style={{ animationDelay: `${900 + i * 120}ms` }} pathLength={1} />
          </mask>
        ))}
      </defs>
      <CoupleLines id={id} />
      {others.map((c, i) => <path key={c.key} d={arc(c.at, KYOTO, 0.15)} className="journey-guest" mask={`url(#${id}-o${i})`} />)}
      {mine && <path key={String(you!.id)} d={arc(mine, KYOTO, 0.25)} className="journey-you" pathLength={1} style={{ animationDelay: `${youDelay}ms` }} />}
      {mine && <circle key={`${you!.id}-dot`} cx={mine[0]} cy={mine[1]} r="5" className="journey-you-dot" />}
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
 * lines in words, counts per city, never names). Our story's last stop shows it without its own list (the story
 * has one).
 */
export function GuestMap({ you, flying, label, listable = true }: { you: City | null; flying: { counts: Partial<Record<Flying, number>>; cities?: Others; told: number; households: number } | null; label: string; listable?: boolean }) {
  const { t } = useLang()
  const [list, setList] = useState(false)
  const name = (c: Flying) => t.flying.cities[c] ?? c
  const placeName = usePlaceName()
  const told = Boolean(flying && flying.households > 0)
  const cities = flying ? (Object.entries(flying.counts) as [Flying, number][]).filter(([, n]) => n > 0) : []
  return (
    <div className="flex flex-col gap-3">
      {list
        ? <ul className="flex flex-col gap-1">
            <li>{t.journey.list.griffin}</li>
            <li>{t.journey.list.nadia}</li>
            {you && <li className="font-medium text-foreground">{t.journey.list.you(placeName(you.name))}</li>}
            {cities.map(([c, n]) => <li key={c}>{t.journey.list.city(name(c), n)}</li>)}
          </ul>
        : <><JourneyMini you={you} counts={flying?.counts} cities={flying?.cities} label={label} /><JourneyLegend you={Boolean(you)} /></>}
      {/* 29 Oct (Jehan): the row is always there (blank until the count arrives), so nothing jumps */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-small text-muted-foreground">{told ? t.journey.count(flying!.told) : "\u00a0"}</p>
        {listable && <button type="button" className="btn-text min-h-11" onClick={() => setList((v) => !v)}>{list ? t.journey.seeMap : t.journey.seeList}</button>}
      </div>
    </div>
  )
}
