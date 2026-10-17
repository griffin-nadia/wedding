/**
 * Nadia's real artwork, switched on here once her files are in public/art (nothing else changes).
 *
 * names:    put her lettering in public/art/names/names.svg (black on transparent, any size; the site
 *           recolours it), set the width:height below, then set names: true.
 */
export const ART = {
  names: false,
  /** Width ÷ height of names.svg, so the space is held before it loads (no jump) */
  namesRatio: 3,
  /**
   * Nadia's drawn envelope: closed and open, cut from her scan with
   * the hand-drawn edge kept, transparent, as <name>-380 and <name>-760 in .avif and .webp. Her 600 dpi rescan
   * replaces the files under the same names; nothing else changes.
   */
  drawnEnvelope: { closed: "art/envelope/drawn-closed", open: "art/envelope/drawn-open", widths: [380, 760] },
  /**
   * Background music (the speaker beside the sun): the file and its credit together. The credit is said once, in the
   * last FAQ ("Who made this site?"); artist is what a phone's Now Playing shows under "Griffin & Nadia". To swap the
   * song: replace public/audio/song.mp3 and this entry. See README → Music.
   */
  music: {
    src: "audio/song.mp3",
    artist: "Piano ZeroL",
    credit: { en: "“A Town With an Ocean View” by Joe Hisaishi, piano by Piano ZeroL", ja: "久石譲「A Town With an Ocean View」（ピアノ：Piano ZeroL）" },
  },
  // The earlier song, cleared by the artist (6 Oct 2026). To switch back, see README → Music, then use this entry:
  // music: { src: "audio/song.mp3", artist: "Aqualina", credit: { en: "“orange hues” by Aqualina", ja: "Aqualina「orange hues」" } },
  /**
   * Nadia's painted land for the journey map: one image painted on the map template (photos-private/art/templates),
   * covering exactly the template's dashed box, which is the map's 400 × 320 viewBox. Empty until it lands; the
   * drawn SVG land shows meanwhile. Put the file in public/art/map/ and set its path here (e.g. "art/map/land.webp").
   */
  mapLand: "",
}
