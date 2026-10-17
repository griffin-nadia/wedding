import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, ExternalLink, RotateCcw, Smartphone, Laptop } from "lucide-react"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { ALL, AREAS } from "./registry"
import { setSpeed, useSpeed } from "./motion"

const base = import.meta.env.BASE_URL
// Baked by scripts/lab-thumbs.mjs (local only, like everything here)
const THUMBS = import.meta.glob<string>("../thumbs/*.webp", { eager: true, import: "default", query: "?url" })
const thumb = (id: string) => THUMBS[`../thumbs/${id}.webp`]
// The lab's own pages: under the lab's path when it's built into the site (vite.config.ts, LAB_PATH), else beside it
const labBase = import.meta.env.VITE_LAB_BASE || base
export const playUrl = (id: string) => `${labBase}lab-play.html?x=${id}&h=sample`

/** The index: every experiment by area, a thumbnail each. */
function Index({ open }: { open: (id: string) => void }) {
  return (
    <div className="lab-body flex flex-col gap-8">
      <p className="max-w-[70ch] text-small text-muted-foreground">
        {ALL.length} experiments in {AREAS.length} areas, each self-contained, with where it comes from and what it would take to ship. Open one to flip
        between phone and laptop, slow it down or speed it up, and replay it. On a phone: <code>npm run lab -- --host</code>, then the Network address it prints
        + <code>/wedding/lab.html#playground</code> (or any experiment's own link).
      </p>
      {AREAS.map((a) => (
        <section key={a.id} aria-labelledby={`area-${a.id}`} className="flex flex-col gap-3">
          <h2 id={`area-${a.id}`} className="font-display text-heading text-foreground">{a.title} <span className="label-caps text-muted-foreground">{a.entries.length}</span></h2>
          <ul className="lab-index">
            {a.entries.map((e) => (
              <li key={e.id}>
                <button type="button" className="lab-index-card" onClick={() => open(e.id)}>
                  {thumb(e.id) ? <img src={thumb(e.id)} alt="" loading="lazy" className="lab-thumb" /> : <span aria-hidden className="lab-thumb" />}
                  <span className="flex flex-col gap-1 text-left">
                    <span className="font-medium text-foreground">{e.title}{e.current && <span className="lab-tag">current</span>}</span>
                    <span className="text-small text-muted-foreground">{e.summary}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** One experiment: in a phone or laptop frame, at a chosen speed, with its notes. */
function Viewer({ id, open, close }: { id: string; open: (id: string) => void; close: () => void }) {
  const i = ALL.findIndex((e) => e.id === id), e = ALL[i]
  const speed = useSpeed()
  const [device, setDevice] = useState<"phone" | "laptop">(() => (sessionStorage.getItem("ng-lab-device") as "phone" | "laptop") ?? "phone")
  const [n, setN] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useEffect(() => { try { sessionStorage.setItem("ng-lab-device", device) } catch { /* fine */ } }, [device])
  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([r]) => setScale(Math.min(1, r.contentRect.width / 1440)))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [device])
  if (!e) return <div className="lab-body"><p>Not found. <button type="button" className="btn-text" onClick={close}>Back to the index</button></p></div>
  const src = playUrl(e.id)
  return (
    <div className="lab-body lab-viewer">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="quiet" size="sm" onClick={close}><ArrowLeft aria-hidden />Index</Button>
          <Segmented label="Device" value={device} onChange={setDevice} items={[{ value: "phone", label: <><Smartphone className="size-4" aria-hidden /> Phone</> }, { value: "laptop", label: <><Laptop className="size-4" aria-hidden /> Laptop</> }]} />
          <label className="lab-speed">
            <span className="text-small text-muted-foreground">Motion speed</span>
            <input type="range" min={0.25} max={2} step={0.05} value={speed} onChange={(ev) => setSpeed(parseFloat(ev.target.value))} aria-valuetext={`${speed.toFixed(2)} times`} />
            <output className="numerals w-12 text-small text-foreground">{speed.toFixed(2)}×</output>
          </label>
          <Button variant="quiet" size="sm" onClick={() => setSpeed(1)}>1×</Button>
          <Button variant="secondary" size="sm" onClick={() => setN(n + 1)}><RotateCcw aria-hidden />Replay</Button>
          <a href={src} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center gap-1 text-small">Full screen<ExternalLink className="size-4" aria-hidden /></a>
        </div>
        {device === "phone"
          ? <div className="lab-device"><iframe key={`${n}${src}`} title={`${e.title}, phone`} src={src} className="lab-device-screen" /></div>
          : <div ref={box} className="lab-desktop" style={{ maxWidth: 1440 }}><iframe key={`${n}${src}`} title={`${e.title}, laptop`} src={src} className="lab-frame" style={{ transform: `scale(${scale})` }} /></div>}
      </div>
      <aside className="lab-notes" aria-label="About this experiment">
        <p className="label-caps text-muted-foreground">{e.areaTitle}{e.current ? " · the site today" : ""}</p>
        <h2 className="font-display text-heading text-foreground">{e.title}</h2>
        <p>{e.summary}</p>
        <h3 className="font-medium text-foreground">Inspired by</h3>
        <ul className="flex flex-col gap-1">{e.refs.map((r) => <li key={r.href}><a href={r.href} target="_blank" rel="noreferrer" className="btn-text text-small">{r.label}</a></li>)}</ul>
        <h3 className="font-medium text-foreground">To promote it</h3>
        <p className="text-small">{e.promote}</p>
        <div className="mt-auto flex gap-2 pt-4">
          <Button variant="secondary" size="sm" disabled={i <= 0} onClick={() => open(ALL[i - 1].id)}><ArrowLeft aria-hidden />Previous</Button>
          <Button variant="secondary" size="sm" disabled={i >= ALL.length - 1} onClick={() => open(ALL[i + 1].id)}>Next<ArrowRight aria-hidden /></Button>
        </div>
      </aside>
    </div>
  )
}

/** The playground tab: #playground is the index, #playground/<id> one experiment. */
export function Playground() {
  const read = () => location.hash.match(/^#playground\/(.+)$/)?.[1] ?? null
  const [id, setId] = useState<string | null>(read)
  useEffect(() => { const on = () => setId(read()); addEventListener("hashchange", on); return () => removeEventListener("hashchange", on) }, [])
  const open = (x: string) => { location.hash = `playground/${x}`; scrollTo(0, 0) }
  const close = () => { location.hash = "playground" }
  return id ? <Viewer id={id} open={open} close={close} /> : <Index open={open} />
}
