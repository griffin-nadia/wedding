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
