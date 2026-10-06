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
export const SCENES = meta as Record<SceneName, { w: number; h: number; lqip: string; face?: number[]; wide?: { w: number; h: number; lqip: string; face?: number[] } }>


// The four painted plates (from Nadia, Jehan or commissioned), named now so dropping art in changes nothing else
const PLATES: Record<string, string> = { home: "morning-hills", day: "the-garden", travel: "the-road", qa: "morning-hills" }

export type SceneKind = "photo" | "paper" | "plate" | "walk"
/** The scene kind: the lab's Scene option if set, otherwise the theme's (Letter: photo, Storybook: painted, Crisp: paper). */
export function sceneKind(option: string | null, preset: string | null): SceneKind {
  // v3 S (Jehan, for now): their photo behind every page; Paper, Painted and Walk stay as options
  void preset
  if (option === "auto" || option === "paper") return "paper"
  if (option === "plate" || option === "walk") return option
  return "photo"
}
/** Behind the sealed envelope only: the photo with their faces (the one photo on the launch site). */
/** Which of the two photos a mode shows. "Photo" option (Jehan, 6 Oct): one per mode, or the same one in both. */
export function photoFor(theme: Theme): SceneName {
  const opt = typeof document === "undefined" ? null : document.documentElement.getAttribute("data-opt-photo")
  if (opt === "day") return "kyoto-view"
  if (opt === "night") return "night-lane"
  return theme === "lantern" ? "night-lane" : "kyoto-view"
}
export const arrivalScene = (theme: Theme): { photo: SceneName } => ({ photo: photoFor(theme) })

export function sceneFor(page: string, theme: Theme, kind: SceneKind = "paper"): SceneSource {
  // One photo per mode on every page (Jehan, 6 Oct): the arrival photo, kyoto-view by day, night-lane in Lantern
  const photo = arrivalScene(theme).photo
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
