import { useState } from "react"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { Stage } from "../../stage"

/**
 * Home's letter with its paper on sliders: how much grain, how much washi fibre, and the edge shadow on or off,
 * live. A tick on each slider marks what the site uses today, so you can see how far a change goes.
 */
const SITE = { grain: 0.06, fibre: 1 }
const css = `
.x-gr { display: grid; gap: var(--space-6); width: min(100%, 980px); align-items: center; }
@media (min-width: 900px) { .x-gr { grid-template-columns: minmax(0, 1fr) 300px; } }
.x-gr-letter { position: relative; isolation: isolate; display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-7) var(--space-6); border-radius: var(--letter-radius); background: var(--letter-bg); color: var(--ink-soft); transition: box-shadow var(--duration-fast) var(--ease-paper); }
.x-gr-letter::before, .x-gr-letter::after { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; pointer-events: none; }
.x-gr-letter::before { background-image: var(--texture-grain); background-size: 256px; mix-blend-mode: var(--texture-blend); opacity: var(--g); }
.x-gr-letter::after { background-image: var(--texture-hatch); background-size: 512px; mix-blend-mode: var(--paper-blend); opacity: var(--f); }
.x-gr-letter[data-edge] { box-shadow: 0 0 0 0.5px rgb(var(--tint-shadow) / 0.14), 0 1px 2px rgb(var(--tint-shadow) / 0.12), 0 8px 18px -10px rgb(var(--tint-shadow) / 0.34), 0 24px 40px -26px rgb(var(--tint-shadow) / 0.3), inset 0 1px 0 rgb(255 255 255 / 0.5); }
.x-gr-panel { display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-5); border-radius: var(--radius-section); background: var(--letter-bg); box-shadow: var(--elevation-paper); }
.x-gr-field { display: flex; flex-direction: column; gap: var(--space-2); }
.x-gr-field label { display: flex; justify-content: space-between; font: 500 var(--type-small-size) / 1.4 var(--font-label); color: var(--ink); }
.x-gr-track { position: relative; }
.x-gr-track input { width: 100%; min-height: 44px; accent-color: var(--action); }
.x-gr-mark { position: absolute; bottom: 2px; width: 2px; height: 10px; translate: -1px 0; background: var(--ink-muted); pointer-events: none; }
.x-gr-check { display: flex; align-items: center; gap: var(--space-2); min-height: 44px; font: 500 var(--type-small-size) / 1.4 var(--font-label); color: var(--ink); }
`

function Slider({ id, label, value, max, onChange, site }: { id: string; label: string; value: number; max: number; onChange: (v: number) => void; site: number }) {
  return (
    <div className="x-gr-field">
      <label htmlFor={id}>{label}<output className="numerals">{value.toFixed(2)}</output></label>
      <div className="x-gr-track">
        <input id={id} type="range" min={0} max={max} step={max / 100} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
        <span aria-hidden className="x-gr-mark" style={{ left: `${(site / max) * 100}%` }} title="The site today" />
      </div>
    </div>
  )
}

export default function Grain() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [g, setG] = useState(SITE.grain), [f, setF] = useState(0.6), [edge, setEdge] = useState(true)
  const names = household?.guests.filter((x) => !x.plusOne).map((x) => x.firstName) ?? []
  return (
    <Stage hint="Move the sliders; the small tick is the site today">
      <style>{css}</style>
      <div className="x-gr">
        <article className="x-gr-letter" data-edge={edge || undefined} style={{ ["--g" as string]: g, ["--f" as string]: f }}>
          <h2 className="names">Griffin <span style={{ color: "var(--leaf)" }}>&amp;</span> Nadia</h2>
          <p className="date-badge">{t.home.dateLine}</p>
          <p><span className="text-foreground">{t.home.dear(t.home.dearNames(names))}</span> {t.home.greetingLine}</p>
          <p className="voice text-foreground">{t.letter.signOff}</p>
        </article>
        <div className="x-gr-panel">
          <Slider id="x-gr-g" label="Grain" value={g} max={0.2} onChange={setG} site={SITE.grain} />
          <Slider id="x-gr-f" label="Nadia's paper (her crosshatch)" value={f} max={1} onChange={setF} site={SITE.fibre} />
          <label className="x-gr-check"><input type="checkbox" checked={edge} onChange={(e) => setEdge(e.target.checked)} className="size-5 accent-(--action)" />Edge shadow (paper on the table)</label>
          <button type="button" className="btn-text min-h-11 self-start text-small" onClick={() => { setG(SITE.grain); setF(SITE.fibre); setEdge(false) }}>Back to the site today</button>
        </div>
      </div>
    </Stage>
  )
}
