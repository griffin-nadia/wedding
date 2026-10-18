import type { ComponentType, LazyExoticComponent } from "react"

/** A setting an experiment exposes in its Options sheet. Its value lives in the address (?k.<id>=), so a link keeps it. */
export type Knob =
  | { id: string; label: string; kind: "range"; min: number; max: number; step: number; def: number; unit?: string }
  | { id: string; label: string; kind: "select"; options: [value: string, label: string][]; def: string }

/** One playground experiment: self-contained in its own file, shown full screen in lab-play.html?x=<id>. */
export type Entry = {
  id: string
  title: string
  /** One or two plain sentences: what it is and how it feels */
  summary: string
  /** Where the idea comes from (the references in .brief and docs) */
  refs: { label: string; href: string }[]
  /** What it would take to ship it on the guest site: the work, the weight on phones, the risks */
  promote: string
  /** Every kept item has one of these two. Still open: what Griffin and Nadia or Jehan need to choose */
  deciding?: string
  /** An idea kept for later, not on the site (under Parked) */
  parked?: string
  /** Two or three takes on the same idea (?take=<id>; the first is the default). The Shortlist shows them side by side */
  takes?: { id: string; label: string }[]
  /** Settings in the Options sheet, read with useKnob() */
  knobs?: Knob[]
  /** Where the site does this today, for Compare with live. arrival: show the sealed envelope (clears "opened") */
  live?: { path: string; arrival?: boolean }
  Component: LazyExoticComponent<ComponentType>
}
