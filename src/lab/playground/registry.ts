import type { Entry } from "./types"
import { entries as opening } from "./x/opening"
import { entries as navigation } from "./x/navigation"
import { entries as transitions } from "./x/transitions"
import { entries as home } from "./x/home"
import { entries as day } from "./x/day"
import { entries as travel } from "./x/travel"
import { entries as rsvp } from "./x/rsvp"
import { entries as story } from "./x/story"
import { entries as journey } from "./x/journey"
import { entries as confirmation } from "./x/confirmation"
import { entries as micro } from "./x/micro"
import { entries as faqs } from "./x/faqs"

/** Every playground experiment, by area, in the order guests meet them. Each area's folder owns its entries. */
export const AREAS: { id: string; title: string; entries: Entry[] }[] = [
  { id: "opening", title: "Opening", entries: opening },
  { id: "navigation", title: "Navigation", entries: navigation },
  { id: "transitions", title: "Page transitions", entries: transitions },
  { id: "home", title: "Home", entries: home },
  { id: "day", title: "The day", entries: day },
  { id: "travel", title: "Travel", entries: travel },
  { id: "rsvp", title: "RSVP", entries: rsvp },
  { id: "story", title: "Our story", entries: story },
  { id: "journey", title: "Journey map", entries: journey },
  { id: "faqs", title: "FAQs", entries: faqs },
  { id: "confirmation", title: "Confirmation", entries: confirmation },
  { id: "micro", title: "Micro", entries: micro },
]
export const ALL = AREAS.flatMap((a) => a.entries.map((e) => ({ ...e, area: a.id, areaTitle: a.title })))
export const byId = (id: string) => ALL.find((e) => e.id === id)
