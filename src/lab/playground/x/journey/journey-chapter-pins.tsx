import { useMemo, useState } from "react"
import { SAMPLE_JOURNEYS, type Journey } from "@/lib/api"
import { useLang } from "@/lib/lang"
import { STORY_PLAN } from "@/content/story-plan"
import { chapterPins } from "@/lib/journey-names"
import { JourneyFlat, flatPoint } from "@/components/journey-flat"
import { useKnob, useTake } from "../../params"

/**
 * Run 25 (section 6): each chapter's place as a pin on the journey map, three looks, over the site's own flat map (the
 * globe uses the same pin markup, moved each frame). Pins have to read as "a chapter happened here", never as a guest's
 * line end (a small filled dot) or Kyoto's seal (a filled square). Tapping one says which stop it would go to.
 * The crowd knob adds made-up households in real towns (never guests) to judge the pins against many lines.
 */
const P = "x-cp"
const css = `
.${P} { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); width: 100%; padding: var(--space-5) var(--space-4); min-height: 100svh; }
.${P} .journey-flat { --flat-h: min(60svh, 560px); }
.${P}-pin { position: absolute; left: var(--x); top: var(--y); width: 0; height: 0; padding: 0; border: 0; background: none; z-index: 2; }
.${P}-pin:focus-visible > span:last-child { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.${P}-lead { position: absolute; left: 0; top: 0; height: 1px; background: var(--ink); opacity: .5; transform-origin: 0 50%; }
.${P}-mark { position: absolute; left: var(--dx); top: var(--dy); cursor: pointer; }
.${P}-mark::after { content: ""; position: absolute; inset: -12px; }
/* Stamp: a paper disc, an ink ring, the chapter's number */
.${P}-stamp .${P}-mark { translate: -50% -50%; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--letter-bg); box-shadow: 0 0 0 1.5px var(--ink), 0 1px 2px rgb(var(--tint-shadow) / .25); color: var(--ink); font: 600 11px / 1 var(--font-label); }
/* Tag: a little paper luggage tag with the year, its point on the place */
.${P}-tag .${P}-mark { translate: 4px -50%; padding: 3px 6px 3px 8px; clip-path: polygon(6px 0, 100% 0, 100% 100%, 6px 100%, 0 50%); background: var(--ink); color: var(--letter-bg); font: 600 10px / 1 var(--font-label); white-space: nowrap; }
/* Flag: a pennant on a short stalk, the number on the cloth */
.${P}-flag .${P}-mark { translate: 0 -100%; width: 18px; height: 22px; border-left: 1.5px solid var(--ink); }
.${P}-flag .${P}-mark i { position: absolute; left: 0; top: 0; width: 16px; height: 12px; clip-path: polygon(0 0, 100% 50%, 0 100%); background: var(--ink-story); color: var(--letter-bg); font: 600 8px / 12px var(--font-label); font-style: normal; padding-left: 2px; }
.${P}-said { min-height: 1.5em; color: var(--ink-soft); font-size: var(--type-small-size); }
`
/** Made-up households in real towns (from the run 24 globe kit), never guests */
const DEMO: Omit<Journey, "n">[] = [
  { name: "Hobart", country: "AU", lat: -42.88, lon: 147.33 }, { name: "Toronto", country: "CA", lat: 43.65, lon: -79.38 },
  { name: "Seattle", country: "US", lat: 47.61, lon: -122.33 }, { name: "Wellington", country: "NZ", lat: -41.29, lon: 174.78 },
  { name: "Manchester", country: "GB", lat: 53.48, lon: -2.24 }, { name: "Sapporo", country: "JP", lat: 43.06, lon: 141.35 },
  { name: "Darwin", country: "AU", lat: -12.46, lon: 130.84 }, { name: "Montreal", country: "CA", lat: 45.5, lon: -73.57 },
  { name: "San Francisco", country: "US", lat: 37.77, lon: -122.42 }, { name: "Christchurch", country: "NZ", lat: -43.53, lon: 172.64 },
  { name: "Edinburgh", country: "GB", lat: 55.95, lon: -3.19 }, { name: "Fukuoka", country: "JP", lat: 33.59, lon: 130.4 },
  { name: "Cairns", country: "AU", lat: -16.92, lon: 145.77 }, { name: "Halifax", country: "CA", lat: 44.65, lon: -63.57 },
  { name: "New York", country: "US", lat: 40.71, lon: -74.01 }, { name: "Queenstown", country: "NZ", lat: -45.03, lon: 168.66 },
  { name: "Canberra", country: "AU", lat: -35.28, lon: 149.13 }, { name: "Winnipeg", country: "CA", lat: 49.9, lon: -97.14 },
  { name: "Honolulu", country: "US", lat: 21.31, lon: -157.86 }, { name: "Bristol", country: "GB", lat: 51.45, lon: -2.59 },
  { name: "Sendai", country: "JP", lat: 38.27, lon: 140.87 }, { name: "Chicago", country: "US", lat: 41.88, lon: -87.63 },
]
const N = [3, 1, 2, 1, 1, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 4, 1, 2, 1, 1, 3, 1]
function crowd(households: number): Journey[] {
  const out: Journey[] = []
  for (let i = 0, left = households; left > 0 && i < DEMO.length; i++) { const n = Math.min(left, N[i]); out.push({ ...DEMO[i], n }); left -= n }
  return out
}

export default function JourneyChapterPins() {
  const look = useTake("stamp")
  const many = useKnob("crowd", "sample")
  const { t } = useLang()
  const [said, setSaid] = useState("")
  const cities = useMemo(() => (many === "sample" ? SAMPLE_JOURNEYS : crowd(Number(many))), [many])
  const pins = chapterPins(STORY_PLAN)
  const year = (key: string) => STORY_PLAN.find((c) => c.key === key)?.year ?? ""
  return (
    <div className={`${P} ${P}-${look}`}>
      <style>{css}</style>
      <JourneyFlat you={null} cities={cities} label={t.journey.title}>
        {pins.map((p) => {
          const [x, y] = flatPoint(p.at), [dx, dy] = p.nudge, len = Math.hypot(dx, dy)
          return (
            <button key={p.key} type="button" className={`${P}-pin`} style={{ "--x": `${x / 4}%`, "--y": `${y / 3.2}%`, "--dx": `${dx}px`, "--dy": `${dy}px` } as React.CSSProperties}
              aria-label={t.journey.pin(p.n, p.title, p.place)} onClick={() => setSaid(`Would go to: ${p.title} (${p.place})`)}>
              {len > 0 && <span aria-hidden className={`${P}-lead`} style={{ width: len, rotate: `${Math.atan2(dy, dx)}rad` }} />}
              <span aria-hidden className={`${P}-mark`}>{look === "tag" ? year(p.key) : look === "flag" ? <i>{p.n}</i> : p.n}</span>
            </button>
          )
        })}
      </JourneyFlat>
      <p className={`${P}-said`} aria-live="polite">{said}</p>
    </div>
  )
}
