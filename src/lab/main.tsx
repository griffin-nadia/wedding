/**
 * Jehan's lab (npm run lab, local only). Never built into, deployed with or linked from the guest site: the build
 * only reads index.html, and the build check fails if any lab code ends up in dist.
 * Tabs: Playground (the open choices, the winners and two parked ideas, at phone or laptop size, any speed; the index
 * is the default) and Gallery (every component, variant and state, light and dark).
 */
/* eslint-disable react-refresh/only-export-components -- an entry file: it renders itself, nothing imports it */
import "../styles/fonts.css"
import "../index.css"
import "../styles/polish.css"
import "./lab.css"
import { StrictMode, Suspense, lazy, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "@/lib/theme"
import { LangProvider } from "@/lib/lang"
import { HouseholdProvider } from "@/lib/household"
import { SceneDimProvider } from "@/components/letter/letter"
import { Toaster } from "@/components/ui/toast"
import { Segmented } from "@/components/segmented"
import { LanternToggle } from "@/components/lantern-toggle"
import { Playground } from "./playground/shell"

const KitPage = lazy(() => import("@/pages/kit").then((m) => ({ default: m.KitPage })))

/** Marks the lab in a bundle: the guest build fails if this string ever reaches dist (vite.config.ts). */
const LAB_MARK = "__NG_LAB__"

const TABS = [["playground", "Playground"], ["gallery", "Gallery"]] as const

function Lab() {
  // The gallery keeps its own page in the hash (#type, #button…), so any other hash means the gallery
  const [tab, setTab] = useState(() => { const h = location.hash.slice(1); return h.startsWith("playground") || !h ? "playground" : "gallery" })
  useEffect(() => { if (tab !== "gallery" && !(tab === "playground" && location.hash.startsWith("#playground"))) history.replaceState(null, "", `#${tab}`) }, [tab])
  return (
    <div className="lab-shell" data-mark={LAB_MARK}>
      <header className="lab-bar">
        <p className="font-display text-heading">G&amp;N <span className="label-caps text-muted-foreground">lab · local only</span></p>
        {/* Phones: a select, so no tab is ever cut off; wider: the segmented tabs */}
        <span className="lab-tabs-wide"><Segmented label="Lab" value={tab} onChange={setTab} items={TABS.map(([value, label]) => ({ value, label }))} /></span>
        <label className="lab-tabs-narrow"><span className="sr-only">Lab</span>
          <select className="field" value={tab} onChange={(e) => setTab(e.target.value)}>{TABS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <span className="ml-auto"><LanternToggle /></span>
      </header>
      {tab === "playground" && <Playground />}
      {tab === "gallery" && <Suspense><KitPage /></Suspense>}
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
