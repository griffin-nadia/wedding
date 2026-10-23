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

/** What a guest can draw from: drafts (see `draft` on Fortune) only while the storyFortunes switch is on. */
export const livePool = <F extends Drawable>(all: F[], drafts: boolean) => all.filter((f) => drafts || !f.draft)

/**
 * The fortune for draw n, as an index into the pool. The first is the household's own, from its token as before run
 * 26 (so nobody's first fortune changes); each redraw comes from the token and its number, and is never the same as
 * the draw just before it. The same on every device, so a draw shows the same fortune wherever it's opened.
 */
export function fortuneFor(token: string, n: number, of: number) {
  let i = 0, prev = -1
  for (let k = 1; k <= Math.max(1, n); k++) {
    i = fortuneIndex(k === 1 ? token : `${token}#${k}`, of)
    if (i === prev && of > 1) i = (i + 1) % of
    prev = i
  }
  return i
}

const whole = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 999
export const isDraws = (v: unknown): v is Draw[] => Array.isArray(v) && v.every((d) => typeof d === "object" && d !== null && whole((d as Draw).draw) && whole((d as Draw).no))

/** Adds draws to a list, never replacing one: a number already there keeps the fortune it had first. */
export const mergeDraws = (into: Draw[], more: Draw[]) =>
  more.reduce((list, d) => (list.some((x) => x.draw === d.draw) ? list : [...list, d]), into).sort((a, b) => a.draw - b.draw)

/** The latest draw's number (0: none yet). */
export const lastDraw = (list: Draw[]) => list.reduce((n, d) => Math.max(n, d.draw), 0)
