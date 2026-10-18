/// <reference types="vite/client" />

/** Couple photos are public (Nadia said yes). Off by default. */
declare const __PUBLIC_PHOTOS__: boolean
declare const __PAPER_ART__: string | null
declare const __SIGNOFF_ART__: boolean
/** private/song.mp3 exists (dev server only). */
declare const __PRIVATE_SONG__: boolean

/** The blank-page safety net (index.html, run 19) */
interface Window {
  /** Reloads once, past the cache; false if it already did within the last minute */
  __ngReload?: () => boolean
  /** Shows the plain "Something went wrong" card */
  __ngCrash?: () => void
  __ngBooted?: boolean
}
