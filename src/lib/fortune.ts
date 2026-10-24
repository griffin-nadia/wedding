import { toast } from "@/components/ui/toast"
import { copyText } from "@/lib/copy"
import type { useLang } from "@/lib/lang"
import type { Fortune } from "@/lib/api"
import { config } from "@/lib/config"
import { isDraws, mergeDraws, type Draw } from "@/lib/draws"

export const drawnKey = (token: string) => `ng-fortune-${token}`

/** A draw or a reveal happened (the reply sheet's card and Home's stay in step) */
export const FORTUNE_EVENT = "ng-fortune"

/** This device's draws for a household (run 26), append only: what an older back end can't keep */
const drawsKey = (token: string) => `ng-draws-${token}`
export function localDraws(token: string): Draw[] {
  try { const v = JSON.parse(localStorage.getItem(drawsKey(token)) ?? "[]"); return isDraws(v) ? v : [] } catch { return [] }
}
/** Adds to this device's list (never replacing a draw already in it), and tells any other fortune card on the page */
export function keepDraws(token: string, more: Draw[]) {
  const list = mergeDraws(localDraws(token), more)
  try { localStorage.setItem(drawsKey(token), JSON.stringify(list)) } catch { /* private mode: the back end has it */ }
  window.dispatchEvent(new Event(FORTUNE_EVENT))
  return list
}
/** Story-based drafts are drawn only with the switch on, or with ?preview in the address (to read them before) */
export const draftsOn = () => config.storyFortunes || (typeof location !== "undefined" && new URLSearchParams(location.search).has("preview"))

/** Android lets a page read a shake without asking; iPhones need a permission prompt, so there it's tap only. */
export const canShake = () => typeof window !== "undefined" && "DeviceMotionEvent" in window
  && typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission !== "function"
  && window.matchMedia("(pointer: coarse)").matches

/** Save to my phone: the share sheet where there is one, otherwise copied for their notes. */
export async function saveFortune(t: ReturnType<typeof useLang>["t"], f: Fortune) {
  const words = `${[f.tierJa, f.tier].filter(Boolean).join(" ")}${f.tier ? "." : "。"} ${f.text}`
  try {
    if (navigator.share) await navigator.share({ title: t.fortune.title, text: words })
    else if (await copyText(words)) toast(t.fortune.copied)
  } catch { /* cancelled */ }
}
