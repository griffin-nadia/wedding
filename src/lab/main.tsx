/**
 * Jehan's lab (npm run lab, local only). Never built into, deployed with or linked from the guest site: the build
 * only reads index.html, and the build check fails if any lab code ends up in dist.
 * Tabs: Playground (every area of the site in two to four takes each, at phone or laptop size, any speed; the index
 * is the default), Gallery (every component, variant and state, light and dark), Layouts (A to D, in three styles,
 * at phone and laptop size, with the Options panel beside them) and Experiments (the earlier cards).
 */
/* eslint-disable react-refresh/only-export-components -- an entry file: it renders itself, nothing imports it */
import "../styles/fonts.css"
import "../index.css"
import "../styles/polish.css"
import "./lab.css"
import { StrictMode, Suspense, lazy, useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { RotateCcw, SlidersHorizontal } from "lucide-react"
import { ThemeProvider } from "@/lib/theme"
import { LangProvider } from "@/lib/lang"
import { HouseholdProvider } from "@/lib/household"
import { SceneDimProvider } from "@/components/letter/letter"
import { Toaster } from "@/components/ui/toast"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { LanternToggle } from "@/components/lantern-toggle"
import { EXPERIMENTS } from "./experiments"
import { Playground } from "./playground/shell"

const KitPage = lazy(() => import("@/pages/kit").then((m) => ({ default: m.KitPage })))
const TunePanel = lazy(() => import("@/tune/panel").then((m) => ({ default: m.TunePanel })))
const base = import.meta.env.BASE_URL
/** Marks the lab in a bundle: the guest build fails if this string ever reaches dist (vite.config.ts). */
const LAB_MARK = "__NG_LAB__"

const LAYOUTS = [["A", "A · Five tabs"], ["B", "B · One letter"], ["C", "C · Invite as home"], ["D", "D · Three tabs"]] as const
const STYLES = [["site", "Site"], ["paper", "Paper"], ["quiet", "Quiet"], ["ink", "Ink"]] as const

function Layouts() {
  const [layout, setLayout] = useState("A")
  const [style, setStyle] = useState("site")
  const [n, setN] = useState(0)
  const [docked, setDocked] = useState(true)
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1440))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])
  const src = `${base}lab-frame.html?layout=${layout}&style=${style}&h=sample`
  return (
    <div className="lab-body" data-docked={docked || undefined}>
      {docked && <Suspense><TunePanel docked /></Suspense>}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Layout" value={layout} onChange={setLayout} items={LAYOUTS.map(([value, label]) => ({ value, label }))} />
          <Segmented label="Style" value={style} onChange={setStyle} items={STYLES.map(([value, label]) => ({ value, label }))} />
          <Button variant="secondary" size="sm" aria-pressed={docked} onClick={() => setDocked(!docked)}><SlidersHorizontal aria-hidden />Options</Button>
          <Button variant="quiet" size="sm" onClick={() => { try { localStorage.removeItem("ng-opened") } catch { /* fine */ } setN(n + 1) }}><RotateCcw aria-hidden />Replay arrival</Button>
        </div>
        <div className="lab-frames">
          <figure className="flex flex-col gap-2">
            <figcaption className="label-caps text-muted-foreground">Phone · 390 × 844</figcaption>
            <iframe key={`p${n}${src}`} title="Phone" src={src} className="lab-frame h-[844px] w-[390px]" />
          </figure>
          <figure className="flex min-w-0 flex-1 flex-col gap-2">
            <figcaption className="label-caps text-muted-foreground">Laptop · 1440 × 900 (scaled)</figcaption>
            <div ref={box} className="lab-desktop"><iframe key={`d${n}${src}`} title="Laptop" src={src} className="lab-frame" style={{ transform: `scale(${scale})` }} /></div>
          </figure>
        </div>
      </div>
    </div>
  )
}

function Experiments() {
  return (
    <div className="lab-body">
      <div className="lab-experiments">
        {EXPERIMENTS.map(({ id, title, note, Component }) => (
          <section key={id} id={id} aria-labelledby={`${id}-t`} className="lab-card">
            <h2 id={`${id}-t`} className="font-display text-heading text-foreground">{title}</h2>
            <p className="text-small text-muted-foreground">{note}</p>
            <Suspense fallback={<p className="text-small">Loading…</p>}><Component /></Suspense>
          </section>
        ))}
      </div>
    </div>
  )
}

function Lab() {
  // The gallery keeps its own page in the hash (#type, #button…), so any other hash means the gallery
  const [tab, setTab] = useState(() => { const h = location.hash.slice(1); return h.startsWith("playground") ? "playground" : ["layouts", "experiments"].includes(h) ? h : h ? "gallery" : "playground" })
  useEffect(() => { if (tab !== "gallery" && !(tab === "playground" && location.hash.startsWith("#playground"))) history.replaceState(null, "", `#${tab}`) }, [tab])
  return (
    <div className="lab-shell" data-mark={LAB_MARK}>
      <header className="lab-bar">
        <p className="font-display text-heading">G&amp;N <span className="label-caps text-muted-foreground">lab · local only</span></p>
        <Segmented label="Lab" value={tab} onChange={setTab} items={[{ value: "playground", label: "Playground" }, { value: "gallery", label: "Gallery" }, { value: "layouts", label: "Layouts" }, { value: "experiments", label: "Experiments" }]} />
        <span className="ml-auto"><LanternToggle /></span>
      </header>
      {tab === "playground" && <Playground />}
      {tab === "gallery" && <Suspense><KitPage /></Suspense>}
      {tab === "layouts" && <Layouts />}
      {tab === "experiments" && <Experiments />}
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider><LangProvider><HouseholdProvider><SceneDimProvider>
      <Lab />
      <Toaster />
    </SceneDimProvider></HouseholdProvider></LangProvider></ThemeProvider>
  </StrictMode>,
)
