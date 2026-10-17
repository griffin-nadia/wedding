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
  /** "current" for the site as it is today, so it can be compared */
  current?: boolean
  Component: LazyExoticComponent<ComponentType>
}
