import { useLayoutEffect, useMemo, useRef, useState } from "react"
import type { Journey } from "@/lib/api"
import type { City } from "@/lib/city-search"
import { bundle, type Place } from "@/lib/journey-names"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { trips } from "@/components/globe/kit-data"
import { View, arcOf, inksOf, viewCss, type Inks, type Tune } from "@/components/globe/kit-view"
import { look } from "@/components/globe/globe-antique"

/**
 * The journey on the antique globe (run 27: Griffin and Nadia's pick on the looks picker, ported as it was picked).
 * One view for both: the paper curls into the globe, or opens out into the flat map you can drag round the world
 * (a fade under reduced motion). The look's paper at 88% land so it shows through, a little see-through, an ink rim,
 * a compass rose and the oceans lettered. The marks are the site's: the Kyoto seal, G at Victoria, N at Brisbane, a
 * dot per guest city (its name on hover, tap or focus), and this household's own line in gold with "You".
 * Three.js loads with it (kit-three.ts), only once a map shows.
 */
const TUNE: Tune = { land: 0.88, grain: 0, weight: 1, shadow: 0, iconSize: 1, icon: "plane", speed: 1, loop: false }

export function JourneyLook({ you, cities, label, mode = "globe", size = "stop" }: { you: City | null; cities: Journey[]; label: string; mode?: "globe" | "flat"; size?: "stop" | "full" }) {
  const { t, lang } = useLang()
  const { theme } = useTheme()
  const night = theme === "lantern"
  const root = useRef<HTMLDivElement>(null)
  // The line colours come off the page once it's themed
  const [inks, setInks] = useState<{ night: boolean; ink: Inks } | null>(null)
  useLayoutEffect(() => { if (root.current) setInks({ night, ink: inksOf(root.current, look, night) }) }, [night])
  const list = useMemo(() => {
    // The site's naming and bundling (lib/journey-names.ts): a city by name with 2 or more households, else its country
    const guests = bundle(cities.filter((c) => c.n > 0).map((c) => ({ name: c.name ?? "", country: c.country ?? "", lat: c.lat, lon: c.lon, n: c.n }) as Place), lang, t.journey.households)
    const mine = you && you.id !== "jp" && you.lat != null && you.lon != null ? { name: you.name, country: you.country ?? "", lat: you.lat, lon: you.lon, n: 1 } : null
    return trips(guests, [], mine, { brisbane: t.journey.from.nadia, victoria: t.journey.from.griffin }, { sample: false, label: (c) => (c as (typeof guests)[number]).label })
  }, [cities, you, lang, t.journey])
  const arcs = useMemo(() => list.map((x) => ({ trip: x, ...arcOf(x) })), [list])
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  const ink = inks?.night === night ? inks.ink : null
  return (
    <div ref={root} className="journey-look" data-size={size}>
      <style>{viewCss}{look.css}</style>
      {ink && <View key={String(night)} look={look} night={night} inks={ink} arcs={arcs} list={list} style={look.line} tune={TUNE} mode={mode} reduce={reduce} size={size} label={label} />}
    </div>
  )
}

/** Paints the look one stop early, in idle time, so the globe mounts on a ready painting */
export { paintGlobe as warmLook } from "@/lib/paint-globe"
