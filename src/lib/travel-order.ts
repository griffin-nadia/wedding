/**
 * Travel's section order. From 14 days before the wedding, or once the site is in "week of" mode, On the day comes
 * first (and the jump links follow); before that it's the order a guest plans in. Kept free of imports so tests run
 * it under plain Node.
 */
export const SECTIONS = ["to-kyoto", "stay", "before", "on-the-day"] as const
export type Section = (typeof SECTIONS)[number]
export const DAY_FIRST_FROM = 14 * 86_400_000
const DAY_FIRST: readonly Section[] = ["on-the-day", "to-kyoto", "stay", "before"]

export function travelOrder(now: Date, weddingStart: string, mode: string): readonly Section[] {
  const soon = new Date(weddingStart).getTime() - now.getTime() <= DAY_FIRST_FROM
  return soon || mode === "week-of" ? DAY_FIRST : SECTIONS
}
