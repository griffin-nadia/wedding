/**
 * One passive scroll listener for the whole site: everything that follows the page's scroll subscribes here and runs
 * at most once a frame, together, instead of each adding its own listener. Resizes run the same callbacks.
 */
const subs = new Set<() => void>()
let raf = 0
const run = () => { raf = 0; subs.forEach((f) => f()) }
const queue = () => { if (!raf) raf = requestAnimationFrame(run) }

export function onScroll(fn: () => void): () => void {
  if (!subs.size) { window.addEventListener("scroll", queue, { passive: true }); window.addEventListener("resize", queue) }
  subs.add(fn)
  return () => {
    subs.delete(fn)
    if (!subs.size) { window.removeEventListener("scroll", queue); window.removeEventListener("resize", queue); cancelAnimationFrame(raf); raf = 0 }
  }
}
