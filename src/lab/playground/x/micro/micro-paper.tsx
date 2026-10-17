import { Component, useState, type ReactNode } from "react"
import { PaperTexture } from "@paper-design/shaders-react"
import { useLang } from "@/lib/lang"
import { COLOURS, PRESETS, TILE, forTone, type PaperParams } from "@/lib/paper"
import { Stage } from "../../stage"
import paperLight from "@/assets/paper-light.webp"
import paperLantern from "@/assets/paper-lantern.webp"
import hatchLight from "./hatch-light.webp"
import hatchLantern from "./hatch-lantern.webp"

/**
 * The paper, four ways, each in Light and Lantern at the size the site draws it: Paper's PaperTexture live and still
 * (the site gets the same thing baked to an image). Pick one, nudge it with the sliders, then copy its settings. Last,
 * for comparison: Nadia's crosshatch, the paper from 18e (it stays in her drawn envelope either way).
 */
const css = `
.x-pp { width: min(100%, 880px); display: grid; gap: var(--space-4); padding: var(--space-4); }
.x-pp-list { display: grid; gap: var(--space-3); grid-template-columns: 1fr; }
@media (min-width: 768px) { .x-pp-list { grid-template-columns: 1fr 1fr; } }
.x-pp-row { display: grid; gap: var(--space-2); padding: var(--space-2); border: 1px solid var(--line-hairline); border-radius: var(--radius-control); background: var(--surface-raised); text-align: start; color: var(--ink); cursor: pointer; }
.x-pp-row[aria-checked="true"] { border-color: var(--action); box-shadow: 0 0 0 2px var(--action); }
.x-pp-row:focus-visible { outline: 2px solid var(--line-focus); outline-offset: 3px; }
.x-pp-name { font: 500 var(--type-label-size) / 1.4 var(--font-label); }
.x-pp-pair { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.x-pp-swatch { position: relative; height: 180px; overflow: hidden; border-radius: var(--radius-chip); }
.x-pp-swatch > div:first-child { position: absolute; top: 0; left: 0; }
.x-pp-swatch span { position: absolute; left: var(--space-3); bottom: var(--space-2); font: 400 var(--type-heading-size) / 1.2 var(--font-display); }
.x-pp-tools { display: grid; gap: var(--space-3); padding: var(--space-4); border-radius: var(--radius-control); background: var(--surface-raised); color: var(--ink); }
.x-pp-tools label { display: grid; grid-template-columns: 6rem 1fr 3rem; align-items: center; gap: var(--space-3); font: 500 var(--type-small-size) / 1.4 var(--font-label); }
.x-pp-tools input { width: 100%; min-height: 24px; accent-color: var(--action); }
.x-pp-tools output { font-variant-numeric: tabular-nums; text-align: end; }
`
const SLIDERS = [["folds", "Folds"], ["wrinkles", "Wrinkles"], ["drops", "Drops"], ["fiber", "Fibre"]] as const

/** No WebGL (an old phone, a headless test browser): the baked tile the site uses instead of the live one */
class NoGl extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Swatch({ params, tone, words }: { params: PaperParams; tone: "light" | "lantern"; words: string }) {
  return (
    <div className="x-pp-swatch">
      <NoGl fallback={<div style={{ width: TILE, height: TILE, background: `url(${tone === "light" ? paperLight : paperLantern}) 0 0 / ${TILE}px` }} />}>
        <PaperTexture speed={0} fit="cover" {...forTone(params, tone)} {...COLOURS[tone]} style={{ width: TILE, height: TILE }} />
      </NoGl>
      <span style={{ color: tone === "light" ? "#421a05" : "#f3e7d3" }}>{words}</span>
    </div>
  )
}

export default function Paper() {
  const { t } = useLang()
  const [sets, setSets] = useState(() => Object.fromEntries(PRESETS.map((p) => [p.id, p.params])) as Record<string, PaperParams>)
  const [pick, setPick] = useState("chosen")
  const [copied, setCopied] = useState(false)
  const now = sets[pick]
  const copy = async () => {
    const text = JSON.stringify({ preset: pick, params: now, lanternParams: forTone(now, "lantern"), colours: COLOURS }, null, 2)
    // A clipboard that never answers (some browsers wait on a permission) counts as failed after a second
    const wrote = await Promise.race([navigator.clipboard?.writeText(text).then(() => true, () => false) ?? false, new Promise<boolean>((r) => setTimeout(() => r(false), 1000))])
    if (!wrote) window.prompt("Copy these settings", text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Stage hint="Tap the one you like, nudge it, then Copy settings and send them over.">
      <style>{css}</style>
      <div className="x-pp">
        <div className="x-pp-list" role="radiogroup" aria-label="Paper">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={pick === p.id} className="x-pp-row" onClick={() => setPick(p.id)}>
              <span className="x-pp-name">{p.label}{pick === p.id && " (picked)"}</span>
              <span className="x-pp-pair">
                <Swatch params={sets[p.id]} tone="light" words={t.meta.shortTitle} />
                <Swatch params={sets[p.id]} tone="lantern" words={t.meta.shortTitle} />
              </span>
            </button>
          ))}
          <div className="x-pp-row" role="group" aria-label="Nadia's crosshatch (18e), for comparison">
            <span className="x-pp-name">Nadia's crosshatch (18e, for comparison)</span>
            <span className="x-pp-pair">
              <span className="x-pp-swatch" style={{ background: `url(${hatchLight}) 0 0 / 512px, ${COLOURS.light.colorPaper}`, backgroundBlendMode: "multiply" }}><span style={{ color: "#421a05" }}>{t.meta.shortTitle}</span></span>
              <span className="x-pp-swatch" style={{ background: `url(${hatchLantern}) 0 0 / 512px, ${COLOURS.lantern.colorPaper}`, backgroundBlendMode: "screen" }}><span style={{ color: "#f3e7d3" }}>{t.meta.shortTitle}</span></span>
            </span>
          </div>
        </div>
        <div className="x-pp-tools">
          {SLIDERS.map(([key, label]) => (
            <label key={key}>
              {label}
              <input type="range" min={0} max={1} step={0.01} value={now[key]}
                onChange={(e) => setSets((s) => ({ ...s, [pick]: { ...s[pick], [key]: Number(e.target.value) } }))} />
              <output>{now[key].toFixed(2)}</output>
            </label>
          ))}
          <button type="button" className="btn-primary h-11 rounded-(--button-radius) px-(--button-pad) font-label" onClick={copy}>{copied ? "Copied" : "Copy settings"}</button>
          <p className="text-small" aria-live="polite">{copied ? "Settings copied." : ""}</p>
        </div>
      </div>
    </Stage>
  )
}
