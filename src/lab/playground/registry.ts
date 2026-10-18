import type { Entry } from "./types"
import { entries as opening } from "./x/opening"
import { entries as story } from "./x/story"
import { entries as journey } from "./x/journey"
import { entries as confirmation } from "./x/confirmation"
import { entries as micro } from "./x/micro"

/**
 * What the lab keeps (final run): the choices still open, the winners (each with what's left to decide) and two
 * parked ideas. Everything else was decided and deleted. By area, in the order guests meet them.
 */
export const AREAS: { id: string; title: string; entries: Entry[] }[] = [
  { id: "opening", title: "Opening", entries: opening },
  { id: "story", title: "Our story", entries: story },
  { id: "journey", title: "Journey map", entries: journey },
  { id: "confirmation", title: "Confirmation", entries: confirmation },
  { id: "micro", title: "Micro", entries: micro },
]
export const ALL = AREAS.flatMap((a) => a.entries.map((e) => ({ ...e, area: a.id, areaTitle: a.title })))
export const byId = (id: string) => ALL.find((e) => e.id === id)
