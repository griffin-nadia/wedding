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
  // Credit links (run 25): the laptop seal's "Site by Jehan Baguley" goes to Jehan's LinkedIn; "Piano ZeroL" in the
  // "Who made this site?" FAQ goes to the track on Spotify
  links: { jehan: "https://au.linkedin.com/in/jehanbaguley", music: "https://open.spotify.com/track/53StnIsGVxhcKaSwcJiY0Y" },
}
