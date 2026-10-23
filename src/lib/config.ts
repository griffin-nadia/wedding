// Site-wide settings. The API URL comes from .env (VITE_API_URL) so it never lives in the repo.

import { DATES } from "./wedding-dates.ts"

export const config = {
  // Nadia's painted venue map (run 22). On since run 26 (Jehan, 23 Oct: "Everything live yeah"; Nadia wants it live).
  // false brings back the old drawn map; ?preview on any page then still shows hers.
  venueMap: true,
  apiUrl: import.meta.env?.VITE_API_URL as string | undefined, // ?. so the unit tests (plain Node, no Vite) can load it
  weddingStart: DATES.ceremony,
  rsvpDue: DATES.rsvpBy,
  // Changes lock (before final numbers)
  changesLock: DATES.changesLock,
  // Credit links (run 25): the laptop seal's "Site by Jehan Baguley" goes to Jehan's LinkedIn; "Piano ZeroL" in the
  // "Who made this site?" FAQ goes to the track on Spotify
  links: { jehan: "https://au.linkedin.com/in/jehanbaguley", music: "https://open.spotify.com/track/53StnIsGVxhcKaSwcJiY0Y" },
}
