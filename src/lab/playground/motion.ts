import { useSyncExternalStore } from "react"
import { loop } from "@/lib/frame"

/**
 * The playground's clock (local only). One speed for everything in an experiment, 0.25× to 2×, set by the slider in
 * the lab shell and shared with the experiment's frame through localStorage (and its storage event).
 * - CSS animations and transitions, Web Animations and view transitions: installSpeed() sets every running
 *   animation's playbackRate each frame, so experiments need nothing special for those.
 * - Script motion: use spring() / tween() here (their time runs at the speed) and ms() for timeouts.
 * - Reduced motion: still() is true; every experiment shows a still or fade-only version then.
 */
const KEY = "ng-lab-speed"
const read = () => { try { const v = parseFloat(localStorage.getItem(KEY) ?? "1"); return v >= 0.25 && v <= 2 ? v : 1 } catch { return 1 } }
// A link's ?speed= wins over the saved one, so a copied view plays at its own speed
const fromUrl = typeof location === "undefined" ? NaN : parseFloat(new URLSearchParams(location.search).get("speed") ?? "")
let speed = fromUrl >= 0.25 && fromUrl <= 2 ? fromUrl : read()
const subs = new Set<() => void>()
if (typeof window !== "undefined") addEventListener("storage", (e) => { if (e.key === KEY) { speed = read(); subs.forEach((f) => f()) } })

export const getSpeed = () => speed
export function setSpeed(v: number) {
  speed = Math.min(2, Math.max(0.25, v))
  try { localStorage.setItem(KEY, String(speed)) } catch { /* private mode */ }
  subs.forEach((f) => f())
}
export const useSpeed = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, getSpeed)
export const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
/** A duration in ms at the current speed (for setTimeout and sequenced steps) */
export const ms = (n: number) => n / speed

/** Every running animation at the playground's speed, each frame. Call once per page. */
export function installSpeed() {
  return loop(() => {
    document.documentElement.style.setProperty("--lab-speed", String(speed))
    for (const a of document.getAnimations()) if (a.playbackRate !== speed) a.playbackRate = speed
  })
}

/**
 * A spring from `from` to `to` (stiffness k, damping c, per unit mass), calling onFrame with the value each frame
 * until it settles. Time runs at the playground's speed. Returns a cancel. Under reduced motion it jumps.
 */
export function spring(from: number, to: number, onFrame: (v: number, done: boolean) => void, { k = 170, c = 20, v = 0 } = {}) {
  if (still()) { onFrame(to, true); return () => {} }
  let x = from, vel = v, then = performance.now()
  return loop((now) => {
    const dt = Math.min(0.032, (now - then) / 1000) * speed; then = now
    vel += (-k * (x - to) - c * vel) * dt; x += vel * dt
    const done = Math.abs(vel) < 0.001 && Math.abs(x - to) < 0.0005
    onFrame(done ? to : x, done)
    return !done
  })
}

/** A plain eased tween over `duration` ms (at the playground's speed). Returns a cancel. */
export function tween(duration: number, onFrame: (t: number, done: boolean) => void, ease = (t: number) => 1 - Math.pow(1 - t, 3)) {
  if (still()) { onFrame(1, true); return () => {} }
  let t = 0, then = performance.now()
  return loop((now) => {
    t = Math.min(1, t + ((now - then) * speed) / duration); then = now
    onFrame(ease(t), t >= 1)
    return t < 1
  })
}
