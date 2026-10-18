/**
 * The playground's frame (lab-play.html?x=<id>, local only): one experiment, full screen, with the site's providers,
 * a router for the ones that use real pages, the playground's speed on every animation, and its controls (Compare
 * with live, Options). This is the page a phone opens: `npm run lab -- --host` prints a QR for the lab, and each
 * experiment's Options has one for its exact view.
 */
/* eslint-disable react-refresh/only-export-components -- an entry file: it renders itself, nothing imports it */
import "../styles/fonts.css"
import "../index.css"
import "../styles/polish.css"
import "./lab.css"
import { StrictMode, Suspense, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { ThemeProvider } from "@/lib/theme"
import { LangProvider } from "@/lib/lang"
import { HouseholdProvider } from "@/lib/household"
import { SceneDimProvider } from "@/components/letter/letter"
import { Toaster } from "@/components/ui/toast"
import { byId, liveUrl, openLive } from "./playground/registry"
import { installSpeed } from "./playground/motion"
import { SiteShell } from "./playground/site-shell"
import { Controls } from "./playground/controls"
import { useParam } from "./playground/params"
import { PRESETS } from "@/lib/paper"

// ?x=<experiment>&take=&theme=light|lantern&paper=off|<preset>&speed=&k.<knob>=&live=1 (the Options sheet writes these)
const q = new URLSearchParams(location.search)
const id = q.get("x") ?? ""
const entry = byId(id)
document.title = entry ? `${entry.title} · G&N lab` : "G&N lab · play"
// The theme for this view only (nothing saved, so the guest site on this device keeps its own)
if (q.get("theme")) document.documentElement.setAttribute("data-theme", q.get("theme") === "lantern" ? "lantern" : "autumn")
// Whole-page takes (the opening, Our story, arrival framing, loading), each with its own photo and backdrop, bring their
// own room; the component experiments sit in the site's own shell
const BARE = new Set(["opening", "story", "arrival", "loading"])
const bare = !entry || BARE.has(entry.area)

function Play() {
  useEffect(() => installSpeed(), [])
  const [n, setN] = useState(0)
  const [take] = useParam("take", "")
  const [liveOn, setLiveOn] = useParam("live", "")
  if (!entry) return <p className="p-6">No experiment called “{id}”. Open the lab index (lab.html).</p>
  const live = liveOn === "1" && !!entry.live
  const setLive = (v: boolean) => { if (v && entry.live) openLive(entry.live); setLiveOn(v ? "1" : ""); setN((x) => x + 1) }
  // A new take or a Replay starts the experiment again from its first frame
  const view = <entry.Component key={`${n}-${take}`} />
  return (
    <div className="lab-play" data-mark="__NG_LAB__" data-shell={bare || live ? undefined : ""}>
      {live && entry.live
        ? <iframe key={n} title={`${entry.title}: the live site`} src={liveUrl(entry.live.path)} className="lab-full" />
        : <Suspense fallback={<p className="p-6 text-small text-muted-foreground">Loading…</p>}>{bare ? view : <SiteShell>{view}</SiteShell>}</Suspense>}
      {live && <p className="lab-live-tag" role="status">Live site</p>}
      <Controls e={entry} live={live} setLive={setLive} replay={() => setN((x) => x + 1)} />
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider><LangProvider><HouseholdProvider><SceneDimProvider>
      <MemoryRouter><Play /></MemoryRouter>
      <Toaster />
    </SceneDimProvider></HouseholdProvider></LangProvider></ThemeProvider>
  </StrictMode>,
)

// The paper (18f, lab only for now): made the way the site would, with the chosen preset unless ?paper= names
// another or off
{
  const want = q.get("paper") ?? "chosen"
  const preset = PRESETS.find((p) => p.id === want)
  if (preset) addEventListener("load", () => { void import("@/lib/paper-live").then((m) => m.startPaper(preset.params)) }, { once: true })
}
