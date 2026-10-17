/**
 * The playground's frame (lab-play.html?x=<id>, local only): one experiment, full screen, with the site's providers,
 * a router for the ones that use real pages, and the playground's speed on every animation. Open it on a phone with
 * `npm run lab -- --host`, then the Network address + /wedding/lab-play.html?x=<id> (the lab index links each).
 */
/* eslint-disable react-refresh/only-export-components -- an entry file: it renders itself, nothing imports it */
import "../styles/fonts.css"
import "../index.css"
import "../styles/polish.css"
import "./lab.css"
import { StrictMode, Suspense, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { ThemeProvider } from "@/lib/theme"
import { LangProvider } from "@/lib/lang"
import { HouseholdProvider } from "@/lib/household"
import { SceneDimProvider } from "@/components/letter/letter"
import { Toaster } from "@/components/ui/toast"
import { byId } from "./playground/registry"
import { installSpeed } from "./playground/motion"

const id = new URLSearchParams(location.search).get("x") ?? ""
const entry = byId(id)
document.title = entry ? `${entry.title} · G&N lab` : "G&N lab · play"

function Play() {
  useEffect(() => installSpeed(), [])
  if (!entry) return <p className="p-6">No experiment called “{id}”. Open the lab index (lab.html#playground).</p>
  return <Suspense fallback={<p className="p-6 text-small text-muted-foreground">Loading…</p>}><div className="lab-play" data-mark="__NG_LAB__"><entry.Component /></div></Suspense>
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider><LangProvider><HouseholdProvider><SceneDimProvider>
      <MemoryRouter><Play /></MemoryRouter>
      <Toaster />
    </SceneDimProvider></HouseholdProvider></LangProvider></ThemeProvider>
  </StrictMode>,
)

// The site's paper, made the same way (18f)
addEventListener("load", () => { void import("@/lib/paper-live").then((m) => m.startPaper()) }, { once: true })
