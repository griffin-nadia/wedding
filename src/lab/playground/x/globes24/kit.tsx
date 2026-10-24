import { useEffect, useMemo, useRef, useState } from "react"
import { getJourneys, SAMPLE_JOURNEYS, type Journey } from "@/lib/api"
import { Segmented } from "@/components/segmented"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { Stage } from "../../stage"
import { still } from "../../motion"
import { getParam, setParam, useKnob, useParam } from "../../params"
import type { Knob } from "../../types"
import { BRISBANE_SAMPLE, ICONS, LINE_STYLES, TUNE, demoCrowd, trips, type Icon, type Kind, type LineStyle } from "./kit-data"
import { iconFor } from "./kit-lines"
import { P, Swatch, View, WIDTH, arcOf, inksOf, viewCss, type Inks, type Look, type Tune } from "./kit-view"

export type { Inks, Look } from "./kit-view"

/**
 * THE GLOBE KIT (lab run 24b, area globes24). Everything a globe look needs except its painting: the journey data, the
 * crowd switch, the Globe/Map switch that curls the paper map into the globe and back, the same key under both views,
 * the place names, the line styles, the turn, and reduced motion. Run 27: the view itself is kit-view.tsx (so the looks
 * picker ships it without the lab), and this is the lab's page round it; the chapter pins and the Kyoto close-up are
 * gone from every look (the marks are the site's: the Kyoto seal, G, N, the guests' dots and "You").
 *
 * HOW TO ADD A LOOK:
 * 1. Make `globe-<name>.tsx`: `export const look: Look = { line: "dots", paint: async ({ night, width }) => canvas }`
 *    (import type { Look } from kit-view.tsx). paint() returns a 2:1 picture (lon -180..180 across, lat 90..-90 down),
 *    painted in steps with `await breathe(g)` between them (kit-paint.ts has land(), sheet(), grain(), seeded(),
 *    lonX/latY). Cache nothing yourself: the kit keeps one picture per look and theme.
 * 2. Optional (see Look in kit-view.tsx): seeThrough, shade, rim, glow, glsl (fragment shader lines acting on `col`,
 *    with vUv, vK = 0 flat .. 1 globe, vZ = how much a point faces you, uLon and uTilt), segments, tilt, inks, farLines,
 *    nearest, weight, back, decor and css (classes prefixed x-<id>-).
 * 3. In the area's index.ts add an entry with `knobs: globeKnobs("<its default line>")` and
 *    `Component: lookPage(() => import("./globe-<name>"))`; for the picker, add it to src/looks/looks.ts.
 * The look never touches Three.js, the lines or the labels: kit-three.ts bends the paper (one plane mesh, a vertex
 * shader between the flat map and the sphere), kit-geo.ts is the same projection on the CPU for the 2D layer the
 * lines and labels are drawn on, and kit-lines.ts draws the line styles.
 *
 * The data: Nadia's line from Brisbane and Griffin's from Victoria (BC), every coming household's city from
 * getJourneys() (the sample cities in the lab), and the household's own line (the sample household: Melbourne).
 * The crowd knob adds made-up demo households only (never real guests), labelled as demo. Place names (run 24 §3):
 * Kyoto, Brisbane and Victoria always; a guest city by name on hover, focus or tap only with 2 or more households,
 * otherwise its country. Reduced motion: no turning or coasting, every line drawn, nothing travelling, and Globe/Map
 * fades instead of curling.
 */
const css = `
.${P} { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); width: 100%; }
.${P}-toggle { flex: none; }
.${P}-note { margin: 0; font-size: var(--type-small-size); color: var(--ink-muted, var(--ink-soft)); text-align: center; }
.${P}-views { display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-end; gap: var(--space-4) var(--space-5); width: 100%; }
.${P}-view { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); margin: 0; flex: 1 1 360px; max-width: 620px; }
.${P}-view[data-size="stop"] { flex: 0 1 280px; }
.${P}-view figcaption { font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink-soft); }
.${P}-view > .${P}-box { width: 100%; }
.${P}-tune { width: min(100%, 680px); border-top: 1px solid var(--line-hairline); padding-top: var(--space-2); }
.${P}-tune summary { display: flex; align-items: center; min-height: 44px; cursor: pointer; font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink); }
.${P}-tune summary:focus-visible, .${P}-tune-reset:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; border-radius: 4px; }
.${P}-tune-body { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-1) var(--space-5); }
.${P}-tune-row { display: grid; grid-template-columns: 8.5em 1fr 3.2em; align-items: center; gap: var(--space-2); min-height: 44px; font-size: var(--type-small-size); color: var(--ink-soft); }
.${P}-tune-row select { grid-column: 2 / 4; }
.${P}-tune-row input { width: 100%; accent-color: var(--action); }
.${P}-tune-row output { font-variant-numeric: tabular-nums; color: var(--ink); text-align: right; }
.${P}-tune-reset { justify-self: start; min-height: 44px; padding: 0 var(--space-2); border: 0; background: none; color: var(--action); font: 500 var(--type-small-size) / 1.3 var(--font-label); text-decoration: underline; cursor: pointer; }
`

/**
 * The whole take for one look (see the top of this file). Run 26: the same look in two views, the story stop's size and
 * the full screen's, with one Globe / Map switch above both, so they curl together; and the tuning panel under the key.
 */
export function GlobeLab({ look }: { look: Look }) {
  const { t, lang } = useLang()
  const { theme } = useTheme()
  const night = theme === "lantern"
  const style = useKnob("line", look.line) as LineStyle
  const icon = useKnob("icon", look.icon ?? "auto") as Icon
  const crowdN = Number(useKnob("crowd", "0"))
  const views = useKnob("views", "both")
  const tune: Tune = {
    land: useKnob("land", 100) / 100, grain: useKnob("grain", 0) / 100, weight: useKnob("weight", 100) / 100,
    shadow: useKnob("shadow", 0) / 100, iconSize: useKnob("iconSize", 100) / 100, icon: iconFor(style, icon), speed: useKnob("speed", 100) / 100, loop: false,
  }
  const [mode, setMode] = useParam("view", "globe")
  const [cities, setCities] = useState<Journey[]>([])
  // Run 26c: plus lab sample travellers from Brisbane, so the map shows them in their own spots beside N
  useEffect(() => { void getJourneys().then((c) => setCities([...(c.length ? c : SAMPLE_JOURNEYS), BRISBANE_SAMPLE])) }, [])
  const crowd = useMemo(() => demoCrowd(crowdN), [crowdN])
  const list = useMemo(() => trips(cities, crowd, SAMPLE_JOURNEYS[0], { brisbane: t.journey.brisbane }), [cities, crowd, t.journey.brisbane])
  const arcs = useMemo(() => list.map((x) => ({ trip: x, ...arcOf(x) })), [list])
  const reduce = still()
  // The line colours, read from the theme once it's on the page; both views wait for them, so a theme change builds
  // each view once
  const root = useRef<HTMLDivElement>(null)
  const [inks, setInks] = useState<{ look: Look; night: boolean; ink: Inks } | null>(null)
  useEffect(() => { if (root.current) setInks({ look, night, ink: inksOf(root.current, look, night) }) }, [look, night])
  const ink = inks && inks.look === look && inks.night === night ? inks.ink : null
  const legend: [Kind, string][] = [["nadia", t.journey.legend.nadia], ["griffin", t.journey.legend.griffin], ["guest", t.journey.legend.guests], ["you", `${t.journey.legend.you} (sample)`]]
  const guests = list.filter((x) => x.kind === "guest")
  const common = ink && { look, night, inks: ink, arcs, list, style, tune, mode, reduce }
  return (
    <Stage hint="Drag to turn it. One switch curls every view.">
      <style>{viewCss}{css}{look.css ?? ""}</style>
      <div ref={root} className={P}>
        <Segmented className={`${P}-toggle`} label={(lang === "ja" ? "地図" : "Map")} size="sm" value={mode as "globe" | "flat"} onChange={setMode}
          items={[{ value: "globe", label: (lang === "ja" ? "地球儀" : "Globe") }, { value: "flat", label: (lang === "ja" ? "地図" : "Map") }]} />
        <div className={`${P}-views`}>
          {views === "both" && <figure className={`${P}-view`} data-size="stop">{common ? <View {...common} size="stop" label="In the story" /> : <div className={`${P}-box`} />}<figcaption>In the story</figcaption></figure>}
          <figure className={`${P}-view`} data-size="full">{common ? <View {...common} size="full" label="Full screen" /> : <div className={`${P}-box`} />}<figcaption>Full screen</figcaption></figure>
        </div>
        {ink && (
          <ul className={`${P}-legend`} aria-label="Key">
            {legend.map(([k, label]) => <li key={k}><Swatch style={style} colour={ink[k]} inks={ink} width={WIDTH[k] * tune.weight * (look.weight ?? 1)} back={look.back?.(night)} />{label}</li>)}
          </ul>
        )}
        {crowdN > 0 && <p className={`${P}-note`}>Demo crowd: {crowdN} made-up households, not guests.</p>}
        <TunePanel style={look.line} icon={look.icon ?? "auto"} />
        <ul className="sr-only">
          <li>{t.journey.list.nadia}</li><li>{t.journey.list.griffin}</li>
          {guests.map((x) => <li key={x.id}>{x.label}</li>)}
          <li>{t.journey.list.you(SAMPLE_JOURNEYS[0].name)}</li>
        </ul>
      </div>
    </Stage>
  )
}

/** The tuning panel (run 26): every slider on the page, under the key, so the globe stays in view while you tune.
 *  The same values as the Options sheet's knobs (they live in the address, so Copy settings carries them). */
function TunePanel({ style, icon: def }: { style: LineStyle; icon: Icon }) {
  const [line, setLine] = useParam("k.line", style)
  const [icon, setIcon] = useParam("k.icon", def)
  const reset = () => { for (const k of [...TUNE.map((x) => x.id), "icon"]) setParam(`k.${k}`, null) }
  // Open at first on a laptop, or when the link carries tuning; closed on a phone so both views come first
  const [first] = useState(() => matchMedia("(min-width: 900px)").matches || TUNE.some((k) => getParam(`k.${k.id}`) !== null))
  return (
    <details className={`${P}-tune`} open={first}>
      <summary>Tune the look</summary>
      <div className={`${P}-tune-body`}>
        <label className={`${P}-tune-row`}><span>Line style</span>
          <select className="field" value={line} onChange={(e) => setLine(e.target.value)}>{LINE_STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className={`${P}-tune-row`}><span>Travelling icon</span>
          <select className="field" value={icon} onChange={(e) => setIcon(e.target.value)}>{ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        {TUNE.map((k) => k.kind === "range" && <Slider key={k.id} k={k} />)}
        <button type="button" className={`${P}-tune-reset`} onClick={reset}>Back to the look as painted</button>
      </div>
    </details>
  )
}
function Slider({ k }: { k: Extract<Knob, { kind: "range" }> }) {
  const [v, set] = useParam(`k.${k.id}`, String(k.def))
  return (
    <label className={`${P}-tune-row`}><span>{k.label}</span>
      <input type="range" min={k.min} max={k.max} step={k.step} value={v} onChange={(e) => set(e.target.value)} aria-valuetext={`${v}${k.unit ?? ""}`} />
      <output>{v}{k.unit ?? ""}</output>
    </label>
  )
}
