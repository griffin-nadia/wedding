/**
 * Every date on the site, once (v3 P). Anything typed anywhere else is a bug: words in en.ts, the
 * calendar file, the RSVP date range and the back end's checks all read from here (Code.gs keeps its
 * own copy of the same values: DEFAULTS and DATE_RANGE).
 */
export const DATES = {
  /** The ceremony, Japan time */
  ceremony: "2027-10-15T11:00:00+09:00",
  ceremonyDay: "2027-10-15",
  /** When the day's schedule ends (Japan time), for the calendar and the Now marker */
  endsAt: "15:30",
  rsvpBy: "2027-02-15",
  changesLock: "2027-04-30",
  travelFrom: "2027-09-01",
  travelTo: "2027-11-30",
  invites: "2026-10-15",
} as const
