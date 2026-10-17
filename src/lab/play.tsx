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
import { SiteShell } from "./playground/site-shell"
import { PRESETS } from "@/lib/paper"

// ?x=<experiment>&theme=light|lantern&paper=off|<preset> (the lab's viewer sets these; a link can too)
const q = new URLSearchParams(location.search)
const id = q.get("x") ?? ""
const entry = byId(id)
document.title = entry ? `${entry.title} · G&N lab` : "G&N lab · play"
// The theme for this view only (nothing saved, so the guest site on this device keeps its own)
if (q.get("theme")) document.documentElement.setAttribute("data-theme", q.get("theme") === "lantern" ? "lantern" : "autumn")
// Whole-page alternatives (the opening, navigation, page changes, and other takes on Home, Travel, the reply and Our
// story, each with its own photo and backdrop) and "the site today" (the real pages already) bring their own room;
// the component experiments (The day, the journey map, FAQs, micro, confirmation) sit in the site's own shell
const BARE = new Set(["opening", "navigation", "transitions", "home", "travel", "rsvp", "story"])
const bare = !entry || entry.current || BARE.has(entry.area)

function Play() {
  useEffect(() => installSpeed(), [])
  if (!entry) return <p className="p-6">No experiment called “{id}”. Open the lab index (lab.html#playground).</p>
  return <Suspense fallback={<p className="p-6 text-small text-muted-foreground">Loading…</p>}><div className="lab-play" data-mark="__NG_LAB__" data-shell={bare ? undefined : ""}>{bare ? <entry.Component /> : <SiteShell><entry.Component /></SiteShell>}</div></Suspense>
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
