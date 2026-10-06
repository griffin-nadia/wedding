/**
 * Nadia's real artwork, switched on here once her files are in public/art (nothing else changes).
 * Until a flag is true, guests see the plain paper envelope and the typed names; crew can still preview
 * the placeholder painting through Options → Painted envelope.
 *
 * envelope: replace public/art/envelope/placeholder-820.webp and placeholder-2400.webp with her scan
 *           (same names, 820 and 2400 px wide), then set envelope: true.
 * names:    put her lettering in public/art/names/names.svg (black on transparent, any size; the site
 *           recolours it), set the width:height below, then set names: true.
 */
export const ART = {
  envelope: false,
  names: false,
  /** Width ÷ height of names.svg, so the space is held before it loads (no jump) */
  namesRatio: 3,
  /**
   * Nadia's drawn envelope (Options → Arrival → Nadia's envelope drawing): closed and open, cut from her scan with
   * the hand-drawn edge kept, transparent, as <name>-380 and <name>-760 in .avif and .webp. Her 600 dpi rescan
   * replaces the files under the same names; nothing else changes.
   */
  drawnEnvelope: { closed: "art/envelope/drawn-closed", open: "art/envelope/drawn-open", widths: [380, 760] },
  /**
   * Her garden on The day (Options → The day → Garden drawing). kind "ink": line art used as a mask in the page's
   * ink colour (dark by day, cream in Lantern). kind "colour": shown as a picture. When the coloured version lands,
   * swap the file and the kind. Either way it's cropped to the pagoda and the aisle.
   */
  garden: { src: "art/garden/garden-ink.webp", kind: "ink" as "ink" | "colour" },
  /**
   * Background music (Options → Music toggle). Cleared by the artist (6 Oct 2026). Off until a guest taps it, 50%.
   */
  music: { src: "audio/orange-hues.mp3", title: "orange hues", artist: "Aqualina", year: undefined as number | undefined },
  /**
   * Nadia's painted land for the journey map: one image painted on the map template (photos-private/art/templates),
   * covering exactly the template's dashed box, which is the map's 400 × 320 viewBox. Empty until it lands; the
   * drawn SVG land shows meanwhile. Put the file in public/art/map/ and set its path here (e.g. "art/map/land.webp").
   */
  mapLand: "",
}
