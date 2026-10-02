// Site-wide settings. The API URL comes from .env (VITE_API_URL) so it never lives in the repo.

export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string | undefined,
  weddingStart: "2027-10-15T11:00:00+09:00",
  rsvpDue: "2027-02-15",
  // Changes lock (TBC with Nadia & Griffin, suggested 30 Apr 2027, before final numbers)
  changesLock: "2027-04-30",
  homeTimeZone: "Australia/Melbourne",
  maxSongs: 3,
}
