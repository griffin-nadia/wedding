// The leaves turn as the day gets closer: fully green on invite day (15 Oct 2026),
// fully red in wedding week (15 Oct 2027). Static per day, no animation.
const INVITE = Date.parse("2026-10-15T00:00:00+11:00")
const WEDDING_WEEK = Date.parse("2027-10-08T00:00:00+09:00")

/** How green the leaves are today, 0 to 100. */
export function seasonGreen(now = Date.now()) {
  const t = (now - INVITE) / (WEDDING_WEEK - INVITE)
  return Math.round(100 * (1 - Math.min(1, Math.max(0, t))))
}

/** Sets --season-green on the page. A ?season=yyyy-mm-dd query mocks the date (for checking). */
export function applySeason() {
  const mock = new URLSearchParams(location.search).get("season")
  const when = mock ? Date.parse(`${mock}T12:00:00+09:00`) : Date.now()
  document.documentElement.style.setProperty("--season-green", `${seasonGreen(Number.isNaN(when) ? Date.now() : when)}%`)
}
