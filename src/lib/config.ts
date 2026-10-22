// Site-wide settings. The API URL comes from .env (VITE_API_URL) so it never lives in the repo.

import { DATES } from "./wedding-dates.ts"

export const config = {
  apiUrl: import.meta.env?.VITE_API_URL as string | undefined, // ?. so the unit tests (plain Node, no Vite) can load it
  weddingStart: DATES.ceremony,
  rsvpDue: DATES.rsvpBy,
  // Changes lock (before final numbers)
  changesLock: DATES.changesLock,
}
