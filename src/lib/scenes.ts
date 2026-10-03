import meta from "@/content/scenes.json"
import type { Theme } from "@/lib/theme"

/**
 * Which scene sits behind each page. Photos now; painted plates later through the same names
 * (public/art/<scene>/{sky,mid,fore}), so dropping art in changes nothing else.
 * Rule: the letter sits over the quietest part of the scene, faces never under it, and the busy
 * night lane only behind the arrival and Lantern home.
 */
export type SceneName = keyof typeof meta
export type SceneSource = { photo: SceneName } | { plate: string; fallback?: SceneName } | { paper: true } | { walk: true }
export const SCENES = meta as Record<SceneName, { w: number; h: number; lqip: string }>

const LIGHT: Record<string, SceneName> = { home: "kyoto-view", day: "castle", travel: "cedar-forest", stay: "cedar-forest", qa: "stone-lantern" }
const NIGHT: Record<string, SceneName> = { home: "night-lane", day: "pontocho", travel: "pontocho", stay: "pontocho", qa: "pontocho" }

// The four painted plates (from Nadia, Jehan or commissioned), named now so dropping art in changes nothing else
const PLATES: Record<string, string> = { home: "morning-hills", day: "the-garden", travel: "the-road", qa: "morning-hills" }

export type SceneKind = "photo" | "paper" | "plate" | "walk"
/** The scene kind: the lab's Scene option if set, otherwise the theme's (Letter: photo, Storybook: painted, Crisp: paper). */
export function sceneKind(option: string | null, preset: string | null): SceneKind {
  // Photos only ever sit behind the envelope (v3); an old "photo" choice saved in a browser is ignored
  if (option === "paper" || option === "plate" || option === "walk") return option as SceneKind
  // v3: paper everywhere for launch; photos only behind the envelope (and in the lab)
  return preset === "storybook" ? "plate" : "paper"
}
/** Behind the sealed envelope only: the photo with their faces (the one photo on the launch site). */
export const arrivalScene = (theme: Theme): SceneSource => ({ photo: theme === "lantern" ? "night-lane" : "kyoto-view" })

export function sceneFor(page: string, theme: Theme, kind: SceneKind = "paper"): SceneSource {
  const map = theme === "lantern" ? NIGHT : LIGHT
  const photo = map[page] ?? map.home
  if (kind === "paper") return { paper: true }
  if (kind === "walk") return { walk: true }
  if (kind === "plate") return { plate: theme === "lantern" ? "lantern-night" : PLATES[page] ?? PLATES.home, fallback: photo }
  return { photo }
}

export const pageOf = (pathname: string) => {
  const p = pathname.replace(/^\/+|\/+$/g, "")
  if (p === "the-day") return "day"
  if (p === "travel" || p === "getting-there" || p === "stay") return "travel"
  if (p === "faqs" || p === "qa") return "qa"
  if (p === "our-story") return "story"
  return "home"
}
