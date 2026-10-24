/**
 * The globe looks picker (run 27), at /wedding/looks/qx26de88/: an unlisted page (no link anywhere, noindex) where
 * Griffin and Nadia try every globe look on sample cities only (never guest data), tune it, and send Jehan their pick.
 * The one lab-derived page that ships: its own entry in the normal build, its own chunks, the site's tokens and fonts.
 * Everything it shows lives in its address (?look=&view=&theme=&land=&lines=&planes=), so a link opens the same view.
 *
 * Sending: through the back end's Ask us action (no household token, so it asks for a name and an email, as Ask us
 * does), never a mailto: the shared address lives only in Script Properties, and the build fails on any address.
 * With no back end (a local build), it shows the note and a Copy button instead.
 */
/* eslint-disable react-refresh/only-export-components -- an entry file: it renders itself, nothing imports it */
import "../styles/fonts.css"
import "../index.css"
import { StrictMode, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { createRoot } from "react-dom/client"
import { SAMPLE_JOURNEYS, askUs } from "@/lib/api"
import { config } from "@/lib/config"
import { copyText } from "@/lib/copy"
import { LangProvider, useLang } from "@/lib/lang"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { useParam } from "@/lab/playground/params"
import { BRISBANE_SAMPLE, trips } from "@/lab/playground/x/globes24/kit-data"
import { iconFor } from "@/lab/playground/x/globes24/kit-lines"
import { P, Swatch, View, WIDTH, arcOf, inksOf, viewCss, type Inks, type Look, type Tune } from "@/lab/playground/x/globes24/kit-view"
import { DEFAULT_LOOK, GROUPS, LOOKS, pickMessage } from "./looks"

const css = `
.lp { max-width: 720px; margin: 0 auto; padding: var(--space-4) 16px var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); color: var(--ink-soft); }
.lp h1 { margin: 0; font: 400 var(--type-heading-size, 28px) / 1.15 var(--font-display); color: var(--ink); }
.lp h2 { margin: 0 0 var(--space-2); font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink); text-transform: uppercase; letter-spacing: 0.06em; }
.lp-intro { margin: 0; }
.lp-rest { display: flex; flex-direction: column; gap: var(--space-4); }
.lp-stage { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--space-2); }
.lp-stage .${P}-box { width: 100%; }
.lp-full-btn { min-height: 44px; min-width: 44px; padding: 0 var(--space-3); border: 1px solid var(--line-hairline); border-radius: 999px; background: color-mix(in oklab, var(--letter-bg) 88%, transparent); color: var(--ink); font: 500 var(--type-small-size) / 1 var(--font-label); cursor: pointer; }
.lp-full-btn:focus-visible, .lp-chip:has(input:focus-visible) { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.lp-stage[data-full="true"] { position: fixed; inset: 0; z-index: 50; justify-content: center; padding: 16px; background: var(--surface-paper); animation: lp-in 160ms ease-out; }
.lp-stage[data-full="true"] .${P}-box { width: min(100%, calc((100svh - 140px) * 1.25)); }
@keyframes lp-in { from { opacity: 0 } to { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .lp-stage[data-full="true"] { animation-duration: 1ms; } }
.lp-now { margin: 0; text-align: center; font-size: var(--type-small-size); }
.lp-now b { color: var(--ink); font-weight: 600; }
.lp-switches { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2) var(--space-4); }
.lp-group { margin: 0; padding: 0; border: 0; }
.lp-group legend { padding: 0; margin-bottom: var(--space-2); font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink); }
.lp-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.lp-chip { position: relative; display: inline-flex; align-items: center; min-height: 44px; padding: 0 var(--space-3); border: 1px solid var(--line-hairline); border-radius: 999px; background: color-mix(in oklab, var(--letter-bg) 80%, transparent); color: var(--ink); font: 500 var(--type-small-size) / 1.2 var(--font-label); cursor: pointer; }
.lp-chip input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.lp-chip:has(input:checked) { border-color: var(--action); box-shadow: inset 0 0 0 1.5px var(--action); background: color-mix(in oklab, var(--action) 12%, var(--letter-bg)); }
.lp-chip:hover { border-color: var(--ink-soft); }
.lp-looks { display: flex; flex-direction: column; gap: var(--space-4); }
.lp-tune { display: grid; gap: var(--space-1); }
.lp-row { display: grid; grid-template-columns: 7.5em 1fr 3.2em; align-items: center; gap: var(--space-2); min-height: 44px; font-size: var(--type-small-size); }
.lp-row input { width: 100%; min-height: 44px; accent-color: var(--action); }
.lp-row output { font-variant-numeric: tabular-nums; color: var(--ink); text-align: right; }
.lp-send { display: flex; flex-direction: column; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--line-hairline); }
.lp-send label { display: flex; flex-direction: column; gap: var(--space-1); font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink); }
.lp-msg { margin: 0; padding: var(--space-3); border-radius: var(--radius-md, 8px); background: var(--surface-raised); color: var(--ink); font: 500 var(--type-small-size) / 1.4 var(--font-label); overflow-wrap: anywhere; }
.lp-status { margin: 0; min-height: 1.4em; font-size: var(--type-small-size); color: var(--ink); }
.lp-honey { position: absolute; left: -9999px; }
`

const num = (v: string, def: number, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def }

function Picker() {
  const { t } = useLang()
  const [lookId, setLookId] = useParam("look", DEFAULT_LOOK)
  const [mode, setMode] = useParam("view", "globe")
  const [time, setTime] = useParam("theme", "day")
  const [landV, setLand] = useParam("land", "100")
  const [linesV, setLines] = useParam("lines", "100")
  const [planesV, setPlanes] = useParam("planes", "100")
  const item = LOOKS.find((l) => l.id === lookId) ?? LOOKS.find((l) => l.id === DEFAULT_LOOK)!
  const night = time === "night"
  const land = num(landV, 100, 0, 100), lines = num(linesV, 100, 50, 300), planes = num(planesV, 100, 25, 300)

  // Day or night: the site's two themes, on this page only (nothing saved, so the guest site keeps its own)
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", night ? "lantern" : "autumn")
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", night ? "#2e1b12" : "#f3e7d3")
  }, [night])

  // The picked look, loaded on demand, with its line colours read from the theme once it's on the page
  const root = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState<{ id: string; look: Look } | null>(null)
  useEffect(() => { let on = true; void item.load().then((m) => { if (on) setLoaded({ id: item.id, look: m.look }) }); return () => { on = false } }, [item])
  const look = loaded?.id === item.id ? loaded.look : null
  const [inks, setInks] = useState<{ look: Look; night: boolean; ink: Inks } | null>(null)
  useEffect(() => {
    if (root.current && look) setInks({ look, night, ink: inksOf(root.current, look, night) })
  }, [look, night])
  const ink = look && inks?.look === look && inks.night === night ? inks.ink : null

  // Sample cities only (never the back end's journeys), the sample household's own line from Melbourne
  const list = useMemo(() => trips([...SAMPLE_JOURNEYS, BRISBANE_SAMPLE], [], SAMPLE_JOURNEYS[0], { brisbane: t.journey.brisbane }), [t.journey.brisbane])
  const arcs = useMemo(() => list.map((x) => ({ trip: x, ...arcOf(x) })), [list])
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
  const style = look?.line ?? "ink"
  const tune: Tune = { land: land / 100, grain: 0, weight: lines / 100, shadow: 0, iconSize: 1, icon: iconFor(style, look?.icon ?? "auto"), speed: planes / 100, loop: true }

  // Full screen: a tap on the map (not a drag) or the button; Escape or the button again closes it
  const [full, setFull] = useState(false)
  const tap = useRef<{ x: number; y: number; t: number } | null>(null)
  const fullBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!full) return
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false) }
    addEventListener("keydown", key)
    document.body.style.overflow = "hidden"
    return () => { removeEventListener("keydown", key); document.body.style.overflow = "" }
  }, [full])
  // Focus stays on the button that opens and closes it (not on the first load)
  const opened = useRef(false)
  useEffect(() => { if (opened.current) fullBtn.current?.focus({ preventScroll: true }); opened.current = true }, [full])

  const message = pickMessage({ title: item.title, land, lines, planes, view: mode === "flat" ? "map" : "globe", time: night ? "night" : "day" })
  const legend: [keyof Inks, string][] = [["nadia", t.journey.legend.nadia], ["griffin", t.journey.legend.griffin], ["guest", `${t.journey.legend.guests} (sample)`], ["you", `${t.journey.legend.you} (sample)`]]

  return (
    <main ref={root} className="lp">
      <style>{viewCss}{css}{look?.css ?? ""}</style>
      <header inert={full}>
        <h1>Globe looks</h1>
        <p className="lp-intro">Pick the look you like for the journey globe, tune it, and send Jehan your pick. Sample cities only.</p>
      </header>

      <div className="lp-stage" data-full={full}
        onPointerDown={(e) => { tap.current = (e.target as Element).closest("button") ? null : { x: e.clientX, y: e.clientY, t: e.timeStamp } }}
        onPointerUp={(e) => { const s = tap.current; tap.current = null; if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8 && e.timeStamp - s.t < 350 && (e.target as Element).closest(`.${P}-box`)) setFull((f) => !f) }}>
        {look && ink
          ? <View key={item.id} look={look} night={night} inks={ink} arcs={arcs} list={list} style={style} tune={tune} mode={mode} reduce={reduce} size="full" label={item.title} />
          : <div className={`${P}-box`}><p className={`${P}-wait`} aria-live="polite">Painting the globe…</p></div>}
        {ink && look && (
          <ul className={`${P}-legend`} aria-label="Key">
            {legend.map(([k, label]) => <li key={k}><Swatch style={style} colour={ink[k]} inks={ink} width={WIDTH[k as "nadia"] * (lines / 100) * (look.weight ?? 1)} back={look.back?.(night)} />{label}</li>)}
          </ul>
        )}
        <button ref={fullBtn} type="button" className="lp-full-btn" aria-pressed={full} onClick={() => setFull((f) => !f)}>{full ? "Close full screen" : "Full screen"}</button>
      </div>
      <div className="lp-rest" inert={full}>
      <p className="lp-now" aria-live="polite"><b>{item.title}</b>. {item.line}</p>

      <div className="lp-switches">
        <Segmented label="Globe or map" size="sm" value={mode as "globe" | "flat"} onChange={setMode} items={[{ value: "globe", label: "Globe" }, { value: "flat", label: "Map" }]} />
        <Segmented label="Day or night" size="sm" value={night ? "night" : "day"} onChange={setTime} items={[{ value: "day", label: "Day" }, { value: "night", label: "Night" }]} />
      </div>

      <section className="lp-looks" aria-labelledby="lp-looks">
        <h2 id="lp-looks">Looks</h2>
        {GROUPS.map((g) => (
          <fieldset key={g} className="lp-group">
            <legend>{g}</legend>
            <div className="lp-chips">
              {LOOKS.filter((l) => l.group === g).map((l) => (
                <label key={l.id} className="lp-chip"><input type="radio" name="look" value={l.id} checked={l.id === item.id} onChange={() => setLookId(l.id)} />{l.title}</label>
              ))}
            </div>
          </fieldset>
        ))}
      </section>

      <section className="lp-tune" aria-labelledby="lp-tune">
        <h2 id="lp-tune">Tune it</h2>
        <Slider label="Land opacity" value={land} min={0} max={100} step={5} set={setLand} />
        <Slider label="Line weight" value={lines} min={50} max={300} step={10} set={setLines} />
        <Slider label="Plane speed" value={planes} min={25} max={300} step={25} set={setPlanes} />
      </section>

      <Send message={message} />
      </div>
    </main>
  )
}

function Slider({ label, value, min, max, step, set }: { label: string; value: number; min: number; max: number; step: number; set: (v: string) => void }) {
  return (
    <label className="lp-row"><span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(e.target.value)} aria-valuetext={`${value}%`} />
      <output>{value}%</output>
    </label>
  )
}

/** "Send Jehan my pick": the back end's Ask us (no token, so a name and an email, as Ask us asks); locally a Copy */
function Send({ message }: { message: string }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [honey, setHoney] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "copied">("idle")
  const online = !!config.apiUrl
  const copy = async () => setState((await copyText(message)) ? "copied" : "failed")
  const send = async (e: FormEvent) => {
    e.preventDefault()
    setState("sending")
    try { await askUs({ question: message, name: name.trim(), email: email.trim(), website: honey }); setState("sent") } catch { setState("failed") }
  }
  return (
    <form className="lp-send" onSubmit={send} aria-labelledby="lp-send">
      <h2 id="lp-send">Send Jehan my pick</h2>
      <p className="lp-msg">{message}</p>
      {online ? <>
        <label>Your name<input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>
        <label>Your email (so Jehan can reply)<input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <input className="lp-honey" tabIndex={-1} aria-hidden autoComplete="off" value={honey} onChange={(e) => setHoney(e.target.value)} name="website" />
        <Button type="submit" loading={state === "sending"}>Send Jehan my pick</Button>
      </> : <Button type="button" variant="secondary" onClick={() => void copy()}>Copy my pick</Button>}
      <p className="lp-status" role="status">
        {state === "sent" ? "Sent. Jehan has your pick." : state === "copied" ? "Copied. Paste it to Jehan." : state === "failed" ? (online ? "That didn't send. Copy it and send it to Jehan another way." : "Couldn't copy. Select the note above and copy it.") : ""}
      </p>
      {online && state === "failed" && <Button type="button" variant="secondary" onClick={() => void copy()}>Copy my pick</Button>}
    </form>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider><Picker /></LangProvider>
  </StrictMode>,
)
