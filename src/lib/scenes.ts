import meta from "@/content/scenes.json"
import type { Theme } from "@/lib/theme"

/**
 * Which scene sits behind each page. Photos now; painted plates later through the same names
 * (public/art/<scene>/{sky,mid,fore}), so dropping art in changes nothing else.
 * Rule: the letter sits over the quietest part of the scene, faces never under it, and the busy
 * night lane only behind the arrival and Lantern home.
 */
export type SceneName = keyof typeof meta
export type SceneSource = { photo: SceneName } | { plate: string }
export const SCENES = meta as Record<SceneName, { w: number; h: number; lqip: string }>

const LIGHT: Record<string, SceneName> = { home: "kyoto-view", day: "castle", travel: "cedar-forest", stay: "cedar-forest", qa: "stone-lantern" }
const NIGHT: Record<string, SceneName> = { home: "night-lane", day: "pontocho", travel: "pontocho", stay: "pontocho", qa: "pontocho" }

export function sceneFor(page: string, theme: Theme): SceneSource {
  const map = theme === "lantern" ? NIGHT : LIGHT
  return { photo: map[page] ?? map.home }
}

export const pageOf = (pathname: string) => {
  const p = pathname.replace(/^\/+|\/+$/g, "")
  if (p === "the-day") return "day"
  if (p === "getting-there" || p === "travel") return "travel"
  if (p === "stay") return "stay"
  if (p === "qa") return "qa"
  return "home"
}
