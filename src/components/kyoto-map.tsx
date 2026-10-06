import { useState } from "react"
import { MapPin } from "lucide-react"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/** Where each place sits on the 360 × 260 plate (schematic, not to scale): the river runs north–south between them */
const AT: Record<string, [number, number]> = { station: [96, 214], gion: [204, 96], pagoda: [304, 110], venue: [262, 160] }

/** A few maple and ginkgo leaves in the autumn colours from their moodboard (mustard, orange, rust) */
const LEAVES: [number, number, number, string][] = [[40, 40, -20, "var(--brand-hachimitsu)"], [318, 44, 25, "var(--brand-kabocha)"], [150, 232, 10, "var(--brand-sabi)"], [330, 214, -35, "var(--brand-hachimitsu)"], [52, 150, 40, "var(--brand-kabocha)"]]

/**
 * Around the venue (Nadia: "I like this if we have time"). A hand-drawn-feeling plate: the Kamo river, the taxi
 * route from Kyoto Station and the walk from Gion-Shijo, four places. Each place is a real button (44px target,
 * in reading order); the chosen one's card sits under the plate and is announced. Nothing animates but the
 * chosen dot and the card (and those not under reduced motion). No map API, no tracking, about 3 kB.
 */
export function KyotoMap() {
  const { t } = useLang()
  const m = t.kyotoMap
  const [on, setOn] = useState("venue")
  const place = m.places.find((p) => p.id === on) ?? m.places[3]
  return (
    <section aria-labelledby="kyoto-map-title" className="flex flex-col gap-4">
      <h3 id="kyoto-map-title" className="font-display text-xl text-foreground">{m.title}</h3>
      <p className="text-sm text-muted-foreground">{m.intro}</p>
      <div className="kmap">
        <svg viewBox="0 0 360 260" className="kmap-plate" role="img" aria-label={m.label}>
          <rect width="360" height="260" rx="14" className="kmap-land" />
          {LEAVES.map(([x, y, r, c], i) => <path key={i} transform={`translate(${x} ${y}) rotate(${r})`} fill={c} className="kmap-leaf"
            d="M0 -9 L2.4 -3.2 L8.6 -4.4 L5 0.6 L8 6 L2 4.6 L0 10 L-2 4.6 L-8 6 L-5 0.6 L-8.6 -4.4 L-2.4 -3.2 Z" />)}
          <path className="kmap-river" d="M150 -10 C 142 40, 166 80, 152 130 S 140 210, 156 270" />
          <text className="kmap-river-label" x="128" y="52" transform="rotate(-82 128 52)">{m.river}</text>
          <path className="kmap-route kmap-taxi" pathLength={1} d={`M${AT.station[0]} ${AT.station[1]} C 150 220, 220 210, ${AT.venue[0]} ${AT.venue[1]}`} />
          <path className="kmap-route kmap-walk" pathLength={1} d={`M${AT.gion[0]} ${AT.gion[1]} C 230 110, 240 140, ${AT.venue[0]} ${AT.venue[1]}`} />
          <text className="kmap-note" x="18" y="246">{m.notToScale}</text>
        </svg>
        {m.places.map((p) => (
          <button key={p.id} type="button" aria-pressed={on === p.id} onClick={() => setOn(p.id)}
            className={cn("kmap-pin", `kmap-pin-${p.id}`, AT[p.id][0] > 180 && "is-east", on === p.id && "is-on")}
            style={{ left: `${(AT[p.id][0] / 360) * 100}%`, top: `${(AT[p.id][1] / 260) * 100}%` }}>
            <span className="kmap-dot" aria-hidden />
            <span className="kmap-tag"><span lang="ja" className="font-ja">{p.ja}</span><span>{p.name}</span></span>
          </button>
        ))}
      </div>
      <div key={place.id} className="kmap-card" aria-live="polite">
        <p className="font-medium text-foreground">{place.name} <span lang="ja" className="font-ja text-muted-foreground">{place.ja}</span></p>
        <p>{place.body}</p>
        <a href={place.maps} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center gap-1 self-start"><MapPin className="size-4" aria-hidden />{m.directions}</a>
      </div>
      <p className="kmap-legend text-sm text-muted-foreground"><span className="kmap-key kmap-key-taxi" aria-hidden />{m.taxiRoute}<span className="kmap-key kmap-key-walk" aria-hidden />{m.walkRoute}</p>
    </section>
  )
}
