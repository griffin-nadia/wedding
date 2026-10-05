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
}
