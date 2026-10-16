import meta from "@/content/scenes.json"
import type { Theme } from "@/lib/theme"

/**
 * Which scene sits behind each page: their photo, one per mode.
 * Rule: the letter sits over the quietest part of the scene, faces never under it, and the busy
 * night lane only behind the arrival and Lantern home.
 */
export type SceneName = keyof typeof meta
export type SceneSource = { photo: SceneName }
export const SCENES = meta as Record<SceneName, { w: number; h: number; lqip: string; face?: number[]; wide?: { w: number; h: number; lqip: string; face?: number[] } }>

/** Which photo a mode shows (Jehan, 6 Oct): the hill above Kyoto by day, the lantern lane in Lantern. */
export function photoFor(theme: Theme): SceneName {
  return theme === "lantern" ? "night-lane" : "kyoto-view"
}
/** One photo per mode behind every page and the sealed envelope (Jehan, 6 Oct). */
export const sceneFor = (theme: Theme): SceneSource => ({ photo: photoFor(theme) })

export const pageOf = (pathname: string) => {
  const p = pathname.replace(/^\/+|\/+$/g, "")
  if (p === "the-day") return "day"
  if (p === "travel" || p === "getting-there" || p === "stay") return "travel"
  if (p === "faqs" || p === "qa") return "qa"
  if (p === "our-story") return "story"
  return "home"
}
