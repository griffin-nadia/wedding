// Site-wide settings. The API URL comes from .env (VITE_API_URL) so it never lives in the repo.

import { DATES } from "./wedding-dates.ts"

export const config = {
  // Nadia's painted venue map (run 22): off until the invites have gone out (Nadia, 22 Oct). To switch it on, make this
  // true. ?preview on any page shows it meanwhile (the lab too).
  venueMap: false,
  apiUrl: import.meta.env?.VITE_API_URL as string | undefined, // ?. so the unit tests (plain Node, no Vite) can load it
  weddingStart: DATES.ceremony,
  rsvpDue: DATES.rsvpBy,
  // Changes lock (before final numbers)
  changesLock: DATES.changesLock,
  // The colophon's two links (run 25). Empty shows the words without a link. Jehan's is to be his LinkedIn
  // (https://au.linkedin.com/in/jehanbaguley) once he confirms; music is the song's page (Spotify), once he sends it.
  links: { jehan: "", music: "" },
}
