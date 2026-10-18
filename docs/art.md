# Nadia's art: where it goes and how to swap it

Originals stay in `private/` (gitignored, never committed or deployed). Only web exports go in `public/art/`.

## The open envelope (18 Oct)

The letter comes out of the envelope, so the open envelope is two layers with the letter between them:

| Layer | What's in it | Export (`public/art/envelope/`) |
|---|---|---|
| back | the back panel, its inside and the open flap | `envelope-open-back-410` and `-820`, `.webp` and `.avif` |
| front | the pocket (the left, right and bottom triangles) and the wax seal | `envelope-open-front-410` and `-820`, `.webp` and `.avif` |

`node scripts/envelope-layers.mjs` makes both from `private/nadia-art-18oct/envelope-open.png` (5000 × 5000).
- **The front cut:** a polygon traced along the top edge of each drawn diagonal (so the line stays with the pocket), joined under the seal, plus the seal itself (its red, grown a little to keep its outline).
- **The back** is the whole drawing.
- **The frame:** both are trimmed to the same box, so they stack exactly.

**Real layers from Nadia, as drop-in replacements.** Save them in `private/nadia-art-18oct/`:
- `envelope-open-back.png`: the back panel, its inside and the open flap
- `envelope-open-front.png`: the pocket and the seal

Both should be on the same 5000 × 5000 canvas, in the same position as `envelope-open.png`, with transparent backgrounds. When both files are there the script uses them as they are, with no cutting, and writes the same exports. Then commit the exports.

On the site (`src/components/envelope.tsx`, `src/styles/polish.css`) the stack is: the open back, then the letter, then the open front, then the closed envelope on top until it opens.

## The names lettering (18 Oct)

- From `private/nadia-art-18oct/lettering-dark-ink.png` (2500 × 2500), `node scripts/art-export.mjs` cuts two alpha masks on the same frame:
  - `names-mask` (the names without the "&")
  - `amp-mask` (the "&" alone, cut in the clear paper either side of it, between x 1106 and 1376)
- Each is exported at 520 and 1040 wide (1x and 2x, WebP).
- The site fills the masks with the theme: the names in `--ink` (brown by day, cream in Lantern), the "&" in the brand sage. So the same masks serve both themes.
- `lettering-cream.png` isn't needed. Its grey speckling on "Nadia" never shows, because the mask decides the shape and the theme the colour. A clean cream file is still welcome, if a cream version is ever wanted as a picture.
- The names are always there as text for screen readers and the page title.

## The rest

- **Closed envelope, wax seal, gum leaves:** `private/nadia-art-17oct`, through `node scripts/art-export.mjs`.
- **Favicon:** from the wax seal, through `node scripts/favicon.mjs`. The icons have a lighter monogram (18g); the seal elsewhere is as drawn.
- **Painted map land for the journey map:** still to come (`ART.mapLand` in `src/lib/art.ts`).
- **Painted land for the globe (final run):** still to come. One 2:1 world painting, sea included, laid out
  equirectangular (longitude -180 to 180 across, latitude 90 to -90 down), about 4096 × 2048. Put it in
  `public/art/map/` (e.g. `globe.webp`) and set `ART.globeLand` in `src/lib/art.ts`; until then the globe paints its
  own land in the site's colours (`src/lib/paint-globe.ts`).
