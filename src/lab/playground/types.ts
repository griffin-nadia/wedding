import type { ComponentType, LazyExoticComponent } from "react"

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
  /** Every kept item has one of these two (final run). Still open: what Griffin and Nadia or Jehan need to choose */
  deciding?: string
  /** An idea kept for later, not on the site (under Parked, collapsed) */
  parked?: string
  Component: LazyExoticComponent<ComponentType>
}
