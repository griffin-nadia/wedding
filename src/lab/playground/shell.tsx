import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ExternalLink, RotateCcw, Smartphone, Laptop, SlidersHorizontal, X } from "lucide-react"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { ALL, AREAS, REFERENCE, liveUrl, openLive } from "./registry"
import { setSpeed, useSpeed } from "./motion"

const base = import.meta.env.BASE_URL
// Baked by scripts/lab-thumbs.mjs (local only, like everything here)
const THUMBS = import.meta.glob<string>("../thumbs/*.webp", { eager: true, import: "default", query: "?url" })
const thumb = (id: string) => THUMBS[`../thumbs/${id}.webp`]
// The lab's own pages: under the lab's path when it's built into the site (vite.config.ts, LAB_PATH), else beside it
const labBase = import.meta.env.VITE_LAB_BASE || base
const PAPERS = [["chosen", "Chosen"], ["subtle", "Very subtle"], ["fibre", "More fibre"], ["nofolds", "No folds"], ["off", "Off"]] as const
type View = { v: string; theme: "light" | "lantern"; paper: string }
export const playUrl = (id: string, view?: Partial<View>) =>
  `${labBase}lab-play.html?x=${id}&h=sample${view?.theme ? `&theme=${view.theme}` : ""}${view?.paper ? `&paper=${view.paper}` : ""}`

/** One experiment's card in the index */
function Card({ e, open }: { e: (typeof ALL)[number]; open: (id: string) => void }) {
  return (
    <li>
      <button type="button" className="lab-index-card" onClick={() => open(e.id)}>
        {thumb(e.id) ? <img src={thumb(e.id)} alt="" loading="lazy" className="lab-thumb" /> : <span aria-hidden className="lab-thumb" />}
        <span className="flex flex-col gap-1 text-left">
          <span className="font-medium text-foreground">{e.title}</span>
          {e.deciding && <span className="lab-deciding"><strong>Deciding:</strong> {e.deciding.replace(/^[^:]+: /, "")}</span>}
          {e.parked && <span className="text-small text-muted-foreground"><strong>Parked:</strong> {e.parked}</span>}
          {!e.parked && <span className="text-small text-muted-foreground">{e.summary}</span>}
        </span>
      </button>
    </li>
  )
}

/** The index, in three groups: Deciding (by area), Parked, and Reference (the site today, one per area). */
function Index({ open }: { open: (id: string) => void }) {
  const openAreas = AREAS.map((a) => ({ ...a, entries: ALL.filter((e) => e.area === a.id && !e.parked) })).filter((a) => a.entries.length)
  const parked = ALL.filter((e) => e.parked)
  return (
    <div className="lab-body flex flex-col gap-8">
      <p className="max-w-[70ch] text-small text-muted-foreground">
        The open questions, each with what needs choosing, the parked ideas, and the site as it is today. Local only (npm run lab). A link keeps
        the exact view.
      </p>
      <section aria-labelledby="g-deciding" className="flex flex-col gap-6">
        <h2 id="g-deciding" className="font-display text-display text-foreground">Deciding</h2>
        {openAreas.map((a) => (
          <section key={a.id} aria-labelledby={`area-${a.id}`} className="flex flex-col gap-3">
            <h3 id={`area-${a.id}`} className="font-display text-heading text-foreground">{a.title} <span className="label-caps text-muted-foreground">{a.entries.length}</span></h3>
            <ul className="lab-index">{a.entries.map((e) => <Card key={e.id} e={e} open={open} />)}</ul>
          </section>
        ))}
      </section>
      <section aria-labelledby="g-parked" className="flex flex-col gap-3">
        <h2 id="g-parked" className="font-display text-display text-foreground">Parked <span className="label-caps text-muted-foreground">{parked.length}</span></h2>
        <ul className="lab-index">{parked.map((e) => <Card key={e.id} e={e} open={open} />)}</ul>
      </section>
      <section aria-labelledby="g-reference" className="flex flex-col gap-3">
        <h2 id="g-reference" className="font-display text-display text-foreground">Reference <span className="label-caps text-muted-foreground">{REFERENCE.length}</span></h2>
        <ul className="lab-index">
          {REFERENCE.map((r) => (
            <li key={r.id}>
              <a className="lab-index-card" href={liveUrl(r.path)} target="_blank" rel="noreferrer" onClick={() => openLive(r)}>
                {thumb(r.id) ? <img src={thumb(r.id)} alt="" loading="lazy" className="lab-thumb" /> : <span aria-hidden className="lab-thumb" />}
                <span className="flex flex-col gap-1 text-left">
                  <span className="font-medium text-foreground">{r.title}</span>
                  <span className="text-small text-muted-foreground">{r.note}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** The options, in one place: the variant (the other takes in the same area), theme, paper, replay, and back */
function Options({ e, view, set, replay, close, device, setDevice }: {
  e: (typeof ALL)[number]; view: View; set: (v: Partial<View>) => void; replay: () => void; close: () => void
  device?: "phone" | "laptop"; setDevice?: (d: "phone" | "laptop") => void
}) {
  const speed = useSpeed()
  const takes = ALL.filter((x) => x.area === e.area)
  return (
    <div className="lab-options">
      <label className="lab-field">
        <span className="label-caps text-muted-foreground">Variant</span>
        <select className="field" value={e.id} onChange={(ev) => set({ v: ev.target.value })}>
          {takes.map((x) => <option key={x.id} value={x.id}>{x.title}{x.parked ? " (parked)" : ""}</option>)}
        </select>
      </label>
      <Segmented label="Theme" value={view.theme} onChange={(theme) => set({ theme })} items={[{ value: "light", label: "Light" }, { value: "lantern", label: "Lantern" }]} />
      <label className="lab-field">
        <span className="label-caps text-muted-foreground">Paper</span>
        <select className="field" value={view.paper} onChange={(ev) => set({ paper: ev.target.value })}>
          {PAPERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {device && setDevice && <Segmented label="Device" value={device} onChange={setDevice} items={[{ value: "phone", label: <><Smartphone className="size-4" aria-hidden /> Phone</> }, { value: "laptop", label: <><Laptop className="size-4" aria-hidden /> Laptop</> }]} />}
      <label className="lab-speed">
        <span className="text-small text-muted-foreground">Motion</span>
        <input type="range" min={0.25} max={2} step={0.05} value={speed} onChange={(ev) => setSpeed(parseFloat(ev.target.value))} aria-valuetext={`${speed.toFixed(2)} times`} />
        <output className="numerals w-12 text-small text-foreground">{speed.toFixed(2)}×</output>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={replay}><RotateCcw aria-hidden />Replay</Button>
        <Button variant="quiet" size="sm" onClick={close}><ArrowLeft aria-hidden />All experiments</Button>
      </div>
    </div>
  )
}

const narrow = () => matchMedia("(max-width: 599px)").matches
function useNarrow() {
  const [n, setN] = useState(narrow)
  useEffect(() => { const mq = matchMedia("(max-width: 599px)"), on = () => setN(mq.matches); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on) }, [])
  return n
}

/**
 * One experiment. Under 600px: no frame, the experiment is the whole screen, and one floating Options button opens a
 * bottom sheet (variant, theme, paper, replay, back), titled with what's showing. From 600: the phone or laptop
 * frame, scaled to fit the window's height (never wider than the window), with the options and notes beside it.
 */
function Viewer({ view, set, close }: { view: View; set: (v: Partial<View>) => void; close: () => void }) {
  const e = ALL.find((x) => x.id === view.v)
  const small = useNarrow()
  const [device, setDevice] = useState<"phone" | "laptop">(() => { try { return (sessionStorage.getItem("ng-lab-device") as "phone" | "laptop") ?? "phone" } catch { return "phone" } })
  const [n, setN] = useState(0)
  const [sheet, setSheet] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ w: 1, h: 1 })
  useEffect(() => { try { sessionStorage.setItem("ng-lab-device", device) } catch { /* fine */ } }, [device])
  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([r]) => setFit({ w: r.contentRect.width, h: innerHeight - r.target.getBoundingClientRect().top - 16 }))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [device, small])
  if (!e) return <div className="lab-body"><p>Not found. <button type="button" className="btn-text" onClick={close}>Back to the index</button></p></div>
  const src = playUrl(e.id, view)
  const frame = <iframe key={`${n}${src}`} title={`${e.title}${small ? "" : `, ${device}`}`} src={src} className={small ? "lab-full" : device === "phone" ? "lab-device-screen" : "lab-frame"} />
  if (small) return (
    <>
      {frame}
      <button type="button" className="lab-fab btn-primary" onClick={() => setSheet(true)} aria-haspopup="dialog"><SlidersHorizontal className="size-5" aria-hidden />Options</button>
      {sheet && (
        <div className="lab-sheet-scrim" onClick={(ev) => { if (ev.target === ev.currentTarget) setSheet(false) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="lab-sheet-title" className="lab-sheet" onKeyDown={(ev) => ev.key === "Escape" && setSheet(false)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label-caps text-muted-foreground">{e.areaTitle}</p>
                <h2 id="lab-sheet-title" className="font-display text-heading text-foreground">{e.title}</h2>
              </div>
              <button type="button" className="utility-btn" aria-label="Close" onClick={() => setSheet(false)} autoFocus><X className="size-5" aria-hidden /></button>
            </div>
            {e.deciding && <p className="lab-deciding"><strong>Deciding:</strong> {e.deciding}</p>}
            <Options e={e} view={view} set={set} replay={() => { setN(n + 1); setSheet(false) }} close={close} />
          </div>
        </div>
      )}
    </>
  )
  // Phone: 414 × 868 with its bezel; laptop: 1440 × 900. Scaled to fit the room, never over 1
  const [w, h] = device === "phone" ? [414, 868] : [1440, 900]
  const scale = Math.min(1, fit.w / w, Math.max(0.3, fit.h / h))
  return (
    <div className="lab-body lab-viewer">
      <div className="flex min-w-0 flex-col gap-4">
        {e.deciding && <p className="lab-deciding"><strong>Deciding:</strong> {e.deciding}</p>}
        <div ref={box} className="lab-stagebox" style={{ height: h * scale }}>
          <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            {device === "phone" ? <div className="lab-device">{frame}</div> : frame}
          </div>
        </div>
      </div>
      <aside className="lab-notes" aria-label="About this experiment">
        <p className="label-caps text-muted-foreground">{e.areaTitle}</p>
        <h2 className="font-display text-heading text-foreground">{e.title}</h2>
        <Options e={e} view={view} set={set} replay={() => setN(n + 1)} close={close} device={device} setDevice={setDevice} />
        <p>{e.summary}</p>
        {e.parked && <p className="text-small"><strong>Parked:</strong> {e.parked}</p>}
        <h3 className="font-medium text-foreground">Inspired by</h3>
        <ul className="flex flex-col gap-1">{e.refs.map((r) => <li key={r.href}><a href={r.href} target="_blank" rel="noreferrer" className="btn-text text-small">{r.label}</a></li>)}</ul>
        <h3 className="font-medium text-foreground">To promote it</h3>
        <p className="text-small">{e.promote}</p>
        <a href={src} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center gap-1 text-small">Full screen<ExternalLink className="size-4" aria-hidden /></a>
      </aside>
    </div>
  )
}

/**
 * The playground tab. The view lives in the address, so a link opens exactly it: ?x=<area>&v=<experiment>&theme=&paper=
 * (no v is the index). Older #playground/<id> links still open.
 */
export function Playground() {
  const read = (): View | null => {
    const q = new URLSearchParams(location.search)
    const v = q.get("v") ?? location.hash.match(/^#playground\/(.+)$/)?.[1] ?? ""
    if (!v) return null
    return { v, theme: q.get("theme") === "lantern" ? "lantern" : "light", paper: q.get("paper") ?? "chosen" }
  }
  const [view, setView] = useState<View | null>(read)
  useEffect(() => { const on = () => setView(read()); addEventListener("popstate", on); addEventListener("hashchange", on); return () => { removeEventListener("popstate", on); removeEventListener("hashchange", on) } }, [])
  const write = (next: View | null, push: boolean) => {
    const area = next ? ALL.find((e) => e.id === next.v)?.area : null
    const qs = next ? `?x=${area}&v=${next.v}&theme=${next.theme}&paper=${next.paper}` : ""
    history[push ? "pushState" : "replaceState"](null, "", `${location.pathname}${qs}#playground`)
    setView(next)
  }
  const open = (v: string) => { write({ v, theme: view?.theme ?? "light", paper: view?.paper ?? "chosen" }, true); scrollTo(0, 0) }
  const close = () => write(null, true)
  return view ? <Viewer view={view} set={(p) => write({ ...view, ...p }, false)} close={close} /> : <Index open={open} />
}
