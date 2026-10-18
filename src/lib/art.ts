/**
 * Nadia's real artwork, switched on here once her files are in public/art (nothing else changes).
 *
 * Her files arrive full size in private/ and go through scripts/art-export.mjs, which writes the web versions into
 * public/art (trimmed, AVIF and WebP, 1x and 2x). The originals are never committed.
 */
export const ART = {
  /**
   * Her lettering for the names (17 Oct), as two masks (the names, the "&"), filled with theme tokens in CSS. The
   * page keeps the names as text for screen readers and the title. ratio holds the space before it loads (no jump).
   */
  names: { mask: "art/names/names-mask", amp: "art/names/amp-mask", ratio: 3.8023 }, // 18 Oct lettering, 520 and 1040 wide; the words pulled in to the "&" (final run P)
  /** Her wax seal and gum leaves on their own (17 Oct): the seal wherever the G&N seal shows alone, the leaves in the lab */
  seal: { src: "art/seal/wax-seal", widths: [64, 128, 256] },
  leaves: { src: "art/leaves/gum-leaves", widths: [160, 320], ratio: 0.743 },
  /**
   * Nadia's drawn envelope (17 Oct, painted): closed (maple, gum leaf and the G·N seal) and open, transparent, as
   * <name>-410 and <name>-820 in .avif and .webp. ratio: width ÷ height of the closed one, which sets the envelope's box.
   */
  drawnEnvelope: {
    closed: "art/envelope/envelope-closed",
    // 18 Oct: her clean open envelope as two layers the letter comes out between (scripts/envelope-layers.mjs,
    // docs/art.md): the back (back panel, inside and open flap) and the front (the pocket and the seal)
    open: "art/envelope/envelope-open-back", openFront: "art/envelope/envelope-open-front",
    widths: [410, 820], ratio: 1.3948,
  },
  /**
   * Background music (the speaker beside the sun): the file and its credit together. The credit is said once, in the
   * last FAQ ("Who made this site?"); artist is what a phone's Now Playing shows under "Griffin & Nadia". To swap the
   * song: replace public/audio/song.mp3 and this entry. See README → Music.
   */
  music: {
    src: "audio/song.mp3",
    artist: "Piano ZeroL",
    credit: { en: "“A Town With an Ocean View” (Joe Hisaishi)", ja: "「A Town With an Ocean View」（久石譲）" },
  },
  // The earlier song, cleared by the artist (6 Oct 2026). To switch back, see README → Music, then use this entry:
  // music: { src: "audio/song.mp3", artist: "Aqualina", credit: { en: "“orange hues” by Aqualina", ja: "Aqualina「orange hues」" } },
  /**
   * Nadia's painted land for the journey map: one image painted on the map template (photos-private/art/templates),
   * covering exactly the template's dashed box, which is the map's 400 × 320 viewBox. Empty until it lands; the
   * drawn SVG land shows meanwhile. Put the file in public/art/map/ and set its path here (e.g. "art/map/land.webp").
   */
  mapLand: "",
  /**
   * Nadia's painted land for the globe (final run): one 2:1 world painting (longitude -180 to 180 across, latitude 90
   * to -90 down, the equirectangular layout), sea included. Empty until it lands; the globe paints its own meanwhile
   * (src/lib/paint-globe.ts). Put the file in public/art/map/ and set its path here (e.g. "art/map/globe.webp").
   */
  globeLand: "",
}
