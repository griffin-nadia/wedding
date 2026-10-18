import { useSyncExternalStore } from "react"

/**
 * An experiment's view lives in its address (lab-play.html?x=<id>&take=&theme=&speed=&k.<knob>=), so a link opens
 * exactly it. Writes replace the history entry (no back-button trail) and tell the lab's viewer, if it frames this
 * page, so its own address keeps the same view.
 */
const subs = new Set<() => void>()
let q = new URLSearchParams(typeof location === "undefined" ? "" : location.search)
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

export const getParam = (key: string) => q.get(key)
export function setParam(key: string, value: string | null) {
  q = new URLSearchParams(location.search)
  if (value === null) q.delete(key); else q.set(key, value)
  history.replaceState(history.state, "", `${location.pathname}?${q}${location.hash}`)
  subs.forEach((f) => f())
  if (parent !== window) parent.postMessage({ type: "ng-lab-view", q: q.toString() }, location.origin)
}
export function useParam(key: string, def: string): [string, (v: string) => void] {
  const v = useSyncExternalStore(subscribe, () => q.get(key) ?? def)
  return [v, (next) => setParam(key, next === def ? null : next)]
}
/** The take showing (?take=), the first one by default */
export const useTake = (def: string) => useParam("take", def)[0]
/** A knob's value (?k.<id>=); numbers for range knobs */
export function useKnob(id: string, def: number): number
export function useKnob(id: string, def: string): string
export function useKnob(id: string, def: number | string) {
  const [v] = useParam(`k.${id}`, String(def))
  return typeof def === "number" ? Number(v) : v
}
