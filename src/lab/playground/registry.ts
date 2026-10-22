import type { Entry } from "./types"
import { entries as opening } from "./x/opening"
import { entries as story } from "./x/story"
import { entries as journey } from "./x/journey"
import { entries as confirmation } from "./x/confirmation"
import { entries as paper } from "./x/paper"
import { entries as micro } from "./x/micro"
import { entries as logo } from "./x/logo"
import { entries as arrival } from "./x/arrival"
import { entries as loading } from "./x/loading"
import { entries as sheets } from "./x/sheets"
import { entries as map } from "./x/map"
import { entries as globes24 } from "./x/globes24"

/**
 * What the lab keeps (lab run 19): the choices still open and the parked ideas, by area in the order guests meet
 * them. Decided ones are deleted; what ships is under Reference (the live site, one per area).
 */
export const AREAS: { id: string; title: string; entries: Entry[] }[] = [
  { id: "loading", title: "Loading", entries: loading },
  { id: "opening", title: "Opening", entries: opening },
  { id: "arrival", title: "Arrival framing", entries: arrival },
  { id: "story", title: "Our story", entries: story },
  { id: "journey", title: "Journey", entries: journey },
  { id: "map", title: "Venue map", entries: map },
  { id: "globes24", title: "Globe looks (run 24b)", entries: globes24 },
  { id: "confirmation", title: "Confirmation", entries: confirmation },
  { id: "sheets", title: "Sheets and status", entries: sheets },
  { id: "paper", title: "Paper and light", entries: paper },
  { id: "micro", title: "Micro-interactions", entries: micro },
  { id: "logo", title: "Logo", entries: logo },
]
export const ALL = AREAS.flatMap((a) => a.entries.map((e) => ({ ...e, area: a.id, areaTitle: a.title })))
export const byId = (id: string) => ALL.find((e) => e.id === id)

/**
 * Reference: the site as it is today, one per area, opened as the live pages with the sample household. Every
 * experiment compares against these through its Compare with live, so no experiment keeps a copy of the site.
 * arrival: clear "opened" first, so the sealed envelope shows.
 */
export const REFERENCE: { id: string; title: string; path: string; note: string; arrival?: boolean }[] = [
  { id: "ref-opening", title: "Opening today", path: "/", arrival: true, note: "The sealed envelope, then the letter out of it (envelope.tsx, polish.css)." },
  { id: "ref-home", title: "Home today", path: "/", note: "The countdown, the reply's steps as tags, button depth (home.tsx)." },
  { id: "ref-story", title: "Our story today", path: "/our-story", note: "The spread, soft prints with tape, the painted globe (our-story.tsx, journey-globe.tsx)." },
  { id: "ref-faqs", title: "FAQs today", path: "/faqs", note: "The accordion and Ask us (faqs.tsx)." },
]
/** The live site at a path, as the lab opens it (the sample household, no back end) */
export const liveUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}${path.includes("?") ? "&" : "?"}h=sample`
/** Before opening the live site: the sealed envelope or not, and the same theme as the view (localhost only: the lab's
 *  origin is the dev server, never the guest site's) */
export const openLive = (r: { path: string; arrival?: boolean }) => {
  try {
    if (r.arrival) localStorage.removeItem("ng-opened"); else localStorage.setItem("ng-opened", "1")
    localStorage.setItem("ng-theme", document.documentElement.getAttribute("data-theme") === "lantern" ? "lantern" : "autumn")
  } catch { /* private mode */ }
}
