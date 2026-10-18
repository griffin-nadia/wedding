/**
 * One frame loop for every animation on the site. Jobs join it, run once a frame together, and leave when they
 * return false or are cancelled. Nothing else calls requestAnimationFrame. A hidden page runs no frames, so anything
 * that must happen while hidden (the music stopping) never waits on one.
 */
type Job = (now: number) => boolean | void
const jobs = new Set<Job>()
let id = 0
const tick = (now: number) => {
  // Jobs added while these run wait for the next frame (id stays set, so loop() doesn't ask for a second one)
  for (const j of [...jobs]) if (j(now) === false) jobs.delete(j)
  id = jobs.size ? requestAnimationFrame(tick) : 0
}

/** Runs fn every frame until it returns false. Returns a cancel. */
export function loop(fn: Job): () => void {
  jobs.add(fn)
  if (!id) id = requestAnimationFrame(tick)
  return () => { jobs.delete(fn) }
}

/** Runs fn once, on the next frame. */
export const nextFrame = (fn: (now: number) => void) => loop((n) => { fn(n); return false })

/** The card's own scrolling box (18e: the card is a fixed frame and its content scrolls inside it), or null off the letter. */
export const letterScroll = () => document.querySelector<HTMLElement>(".letter-scroll")

/** Reduced motion: scrolls land at once */
export const still = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

/** How far down a scrolling box its stuck row reaches (Travel's tab row, run 19), from its CSS, so it's right before
 * the row has stuck as well as after; 0 where there's none. */
export function stuckBottom(box: HTMLElement) {
  const row = box.querySelector<HTMLElement>(".jump-links")
  if (!row) return 0
  return row.offsetHeight + (parseFloat(getComputedStyle(row).top) || 0) + (parseFloat(getComputedStyle(box).paddingTop) || 0)
}

/** The air between the stuck row and what a tap lands on */
export const LAND_GAP = 8

/** Scrolls the card so an element sits just under the stuck row: smooth, or at once under reduced motion. */
export function scrollToEl(el: HTMLElement | null, smooth = !still()) {
  if (!el) return
  const box = el.closest<HTMLElement>(".letter-scroll")
  if (!box) return el.scrollIntoView({ behavior: smooth ? "smooth" : "instant" })
  const top = box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - stuckBottom(box) - LAND_GAP
  box.scrollTo({ top: Math.max(0, Math.min(top, box.scrollHeight - box.clientHeight)), behavior: smooth ? "smooth" : "instant" })
}
