import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ExternalLink, Laptop, Smartphone } from "lucide-react"
import { Segmented } from "@/components/segmented"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ALL, AREAS, REFERENCE, liveUrl, openLive } from "./registry"
import { PhoneQr } from "./controls"
import { PerfBadge } from "./perf"

// Baked by scripts/lab-thumbs.mjs (local only, like everything here): <id>.webp, and <id>--<take>.webp per take
const THUMBS = import.meta.glob<string>("../thumbs/*.webp", { eager: true, import: "default", query: "?url" })
export const thumb = (id: string, take?: string) => THUMBS[`../thumbs/${id}${take ? `--${take}` : ""}.webp`] ?? (take ? THUMBS[`../thumbs/${id}.webp`] : undefined)
// The lab's own pages: under the lab's path when it's built (vite.config.ts, LAB_PATH), else beside it
const labBase = import.meta.env.VITE_LAB_BASE || import.meta.env.BASE_URL
export const playUrl = (id: string, rest = "") => `${labBase}lab-play.html?x=${id}${rest ? `&${rest}` : ""}`

type E = (typeof ALL)[number]

/** "On a phone": a QR for the experiment on the wifi (npm run lab -- --host) */
function PhoneButton({ e }: { e: E }) {
  return (
    <Sheet>
      <SheetTrigger className="btn-text inline-flex min-h-11 items-center gap-1 text-small"><Smartphone className="size-4" aria-hidden />On a phone</SheetTrigger>
      <SheetContent aria-describedby={undefined} closeLabel="Close">
        <SheetHead><SheetTitle className="font-display text-heading text-foreground">{e.title} on a phone</SheetTitle></SheetHead>
        <SheetBody><PhoneQr search={`?x=${e.id}`} /></SheetBody>
      </SheetContent>
    </Sheet>
  )
}

/** One experiment's card: thumbnail, title, Deciding (or Parked), the performance badge, open it or test on a phone */
function Card({ e, open }: { e: E; open: (id: string) => void }) {
  return (
    <li className="lab-index-card">
      <a href={playUrl(e.id)} onClick={(ev) => { if (!narrow()) { ev.preventDefault(); open(e.id) } }} className="lab-card-link">
        {thumb(e.id, e.takes?.[0].id) ? <img src={thumb(e.id, e.takes?.[0].id)} alt="" loading="lazy" className="lab-thumb" /> : <span aria-hidden className="lab-thumb" />}
        <span className="font-medium text-foreground">{e.title}{e.takes && <span className="label-caps text-muted-foreground"> · {e.takes.length} takes</span>}</span>
      </a>
      {e.deciding && <p className="lab-deciding"><strong>Deciding:</strong> {e.deciding}</p>}
      {e.parked && <p className="text-small text-muted-foreground"><strong>Parked:</strong> {e.parked}</p>}
      <PerfBadge id={e.id} />
      <PhoneButton e={e} />
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
        The open questions with what needs choosing, the parked ideas, and the site as it is today. Local only (npm run lab; npm run lab --
        --host for a phone). Each experiment has Options (takes, theme, speed, Replay, Copy settings) and Compare with live, and its link
        keeps the exact view. The Shortlist puts every open decision side by side.
      </p>
      <section aria-labelledby="g-deciding" className="flex flex-col gap-6">
        <h2 id="g-deciding" className="font-display text-heading text-foreground lab-group">Deciding</h2>
        {openAreas.map((a) => (
          <section key={a.id} aria-labelledby={`area-${a.id}`} className="flex flex-col gap-3">
            <h3 id={`area-${a.id}`} className="label-caps text-foreground">{a.title} <span className="label-caps text-muted-foreground">{a.entries.length}</span></h3>
            <ul className="lab-index">{a.entries.map((e) => <Card key={e.id} e={e} open={open} />)}</ul>
          </section>
        ))}
      </section>
      <section aria-labelledby="g-parked" className="flex flex-col gap-3">
        <h2 id="g-parked" className="font-display text-heading text-foreground lab-group">Parked <span className="label-caps text-muted-foreground">{parked.length}</span></h2>
        <ul className="lab-index">{parked.map((e) => <Card key={e.id} e={e} open={open} />)}</ul>
      </section>
      <section aria-labelledby="g-reference" className="flex flex-col gap-3">
        <h2 id="g-reference" className="font-display text-heading text-foreground lab-group">Reference <span className="label-caps text-muted-foreground">{REFERENCE.length}</span></h2>
        <ul className="lab-index">
          {REFERENCE.map((r) => (
            <li key={r.id} className="lab-index-card">
              <a className="lab-card-link" href={liveUrl(r.path)} target="_blank" rel="noreferrer" onClick={() => openLive(r)}>
                {thumb(r.id) ? <img src={thumb(r.id)} alt="" loading="lazy" className="lab-thumb" /> : <span aria-hidden className="lab-thumb" />}
                <span className="font-medium text-foreground">{r.title} <ExternalLink className="inline size-4" aria-label="(opens in a new tab)" /></span>
              </a>
              <p className="text-small text-muted-foreground">{r.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const narrow = () => matchMedia("(max-width: 599px)").matches

/**
 * One experiment from 600 up: the phone or laptop frame, scaled to fit, with the notes beside it. The frame is the
 * phone page itself (lab-play.html), with its own Options and Compare with live; whatever it sets is mirrored into
 * this page's address, so a link opens the same view here. Under 600 the cards go straight to the phone page.
 */
function Viewer({ v, rest, close }: { v: string; rest: string; close: () => void }) {
  const e = ALL.find((x) => x.id === v)
  const [device, setDevice] = useState<"phone" | "laptop">(() => { try { return (sessionStorage.getItem("ng-lab-device") as "phone" | "laptop") ?? "phone" } catch { return "phone" } })
  const box = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ w: 1, h: 1 })
  // The src is set once per experiment, so the frame's own changes don't reload it
  const [src] = useState(() => playUrl(v, rest))
  useEffect(() => { try { sessionStorage.setItem("ng-lab-device", device) } catch { /* fine */ } }, [device])
  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([r]) => setFit({ w: r.contentRect.width, h: innerHeight - r.target.getBoundingClientRect().top - 16 }))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [device])
  if (!e) return <div className="lab-body"><p>Not found. <button type="button" className="btn-text" onClick={close}>Back to the index</button></p></div>
  const frame = <iframe title={`${e.title}, ${device}`} src={src} className={device === "phone" ? "lab-device-screen" : "lab-frame"} />
  const [w, h] = device === "phone" ? [414, 868] : [1440, 900]
  const scale = Math.min(1, fit.w / w, Math.max(0.3, fit.h / h))
  return (
    <div className="lab-body lab-viewer">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-text inline-flex min-h-11 items-center gap-1" onClick={close}><ArrowLeft className="size-4" aria-hidden />All experiments</button>
          <Segmented label="Device" value={device} onChange={setDevice} items={[{ value: "phone", label: <><Smartphone className="size-4" aria-hidden /> Phone</> }, { value: "laptop", label: <><Laptop className="size-4" aria-hidden /> Laptop</> }]} />
        </div>
        <div ref={box} className="lab-stagebox" style={{ height: h * scale }}>
          <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            {device === "phone" ? <div className="lab-device">{frame}</div> : frame}
          </div>
        </div>
      </div>
      <aside className="lab-notes" aria-label="About this experiment">
        <p className="label-caps text-muted-foreground">{e.areaTitle}</p>
        <h2 className="font-display text-heading text-foreground">{e.title}</h2>
        {e.deciding && <p className="lab-deciding"><strong>Deciding:</strong> {e.deciding}</p>}
        {e.parked && <p className="text-small"><strong>Parked:</strong> {e.parked}</p>}
        <p>{e.summary}</p>
        <PerfBadge id={e.id} />
        <p className="text-small text-muted-foreground">The take, theme, speed, Replay, Copy settings and Compare with live are in the frame's Options.</p>
        <h3 className="font-medium text-foreground">Inspired by</h3>
        <ul className="flex flex-col gap-1">{e.refs.map((r) => <li key={r.href}><a href={r.href} target="_blank" rel="noreferrer" className="btn-text text-small">{r.label}</a></li>)}</ul>
        <h3 className="font-medium text-foreground">To promote it</h3>
        <p className="text-small">{e.promote}</p>
        <a href={src} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center gap-1 text-small">Full screen<ExternalLink className="size-4" aria-hidden /></a>
        <PhoneButton e={e} />
      </aside>
    </div>
  )
}

/**
 * The playground tab. The view lives in the address: ?v=<experiment>&<the frame's own view> (take, theme, speed,
 * knobs), so a link opens exactly it. No v is the index. Older #playground/<id> links still open.
 */
export function Playground() {
  const read = () => {
    const q = new URLSearchParams(location.search)
    const v = q.get("v") ?? location.hash.match(/^#playground\/(.+)$/)?.[1] ?? ""
    q.delete("v"); q.delete("x")
    return v ? { v, rest: q.toString() } : null
  }
  const [view, setView] = useState(read)
  useEffect(() => {
    const on = () => setView(read())
    // The frame tells us its view; it goes into our address (without reloading the frame)
    const msg = (ev: MessageEvent) => {
      if (ev.origin !== location.origin || ev.data?.type !== "ng-lab-view") return
      const q = new URLSearchParams(String(ev.data.q)); const v = q.get("x"); q.delete("x")
      if (v) history.replaceState(null, "", `${location.pathname}?v=${v}${q.size ? `&${q}` : ""}#playground`)
    }
    addEventListener("popstate", on); addEventListener("hashchange", on); addEventListener("message", msg)
    return () => { removeEventListener("popstate", on); removeEventListener("hashchange", on); removeEventListener("message", msg) }
  }, [])
  const open = (v: string) => { history.pushState(null, "", `${location.pathname}?v=${v}#playground`); setView({ v, rest: "" }); scrollTo(0, 0) }
  const close = () => { history.pushState(null, "", `${location.pathname}#playground`); setView(null) }
  return view ? <Viewer key={view.v} v={view.v} rest={view.rest} close={close} /> : <Index open={open} />
}
