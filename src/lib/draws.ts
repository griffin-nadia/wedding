/**
 * Run 26: a household can draw again. Each draw is kept with its number (1, 2, 3...) and the fortune it gave (its No.),
 * append only: a redraw adds the next number and never rewrites one before it. The back end keeps them in the sheet's
 * Draws tab; an older back end (no draws in its answer) leaves this device's list (localStorage, ng-draws-<token>),
 * which is append only too. Kept free of imports so the unit tests run it under plain Node.
 */
export type Draw = { draw: number; no: number }
type Drawable = { no: number; draft?: boolean }

/** The same fortune for a household on any device: picked from its token, over however many there are. */
export function fortuneIndex(token: string, of: number) {
  let h = 0
  for (const c of token) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % of
}

/**
 * May this fortune be drawn? Not a draft (see `draft` on Fortune) while the storyFortunes switch is off, and not the
 * one to avoid (the draw just before). From index i, steps forward through the numbered pool to the first that may.
 */
function stepFrom<F extends Drawable>(i: number, pool: F[], drafts: boolean, avoid?: number) {
  for (const skip of [avoid, undefined]) // a pool of one: allow the same again rather than nothing
    for (let k = 0; k < pool.length; k++) {
      const j = (i + k) % pool.length
      if ((drafts || !pool[j].draft) && pool[j].no !== skip) return j
    }
  return -1 // nothing may be drawn (every line a draft): the caller falls back to the built-in tips
}

/** One draw's pick, as an index into the whole numbered pool (in No. order, drafts included): the same hash over the
 *  same pool as before run 26, then forward past a draft (or the line to avoid). */
export const pickFor = <F extends Drawable>(token: string, n: number, pool: F[], drafts: boolean, avoid?: number) =>
  stepFrom(fortuneIndex(n <= 1 ? token : `${token}#${n}`, pool.length), pool, drafts, avoid)

/**
 * The fortune for draw n, as an index into the whole pool. The first is the household's own, exactly as before run 26
 * (the pool stays all 25, so "No. x of 25" and everyone's fortune hold); only a household whose line is a draft moves
 * on to the next line that isn't. Each redraw comes from the token and its number, never a draft and never the same
 * as the draw before. The same on every device.
 */
export function fortuneFor<F extends Drawable>(token: string, n: number, pool: F[], drafts: boolean) {
  let i = -1
  for (let k = 1; k <= Math.max(1, n); k++) i = pickFor(token, k, pool, drafts, i >= 0 ? pool[i].no : undefined)
  return i
}

const whole = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 999
export const isDraws = (v: unknown): v is Draw[] => Array.isArray(v) && v.every((d) => typeof d === "object" && d !== null && whole((d as Draw).draw) && whole((d as Draw).no))

/** Adds draws to a list, never replacing one: a number already there keeps the fortune it had first. */
export const mergeDraws = (into: Draw[], more: Draw[]) =>
  more.reduce((list, d) => (list.some((x) => x.draw === d.draw) ? list : [...list, d]), into).sort((a, b) => a.draw - b.draw)

/** The latest draw's number (0: none yet). */
export const lastDraw = (list: Draw[]) => list.reduce((n, d) => Math.max(n, d.draw), 0)
