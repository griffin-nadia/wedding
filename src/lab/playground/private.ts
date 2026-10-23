/**
 * Run 24: pictures that aren't on the site yet (Griffin's other childhood prints, Nadia's kid photos, her map pieces),
 * from the lab's dev server only (vite.config.ts, privatePictures). In a lab test build they 404, so anything using
 * them must show a plain paper print instead.
 * privatePhoto("griffin-kid-zoo-800.webp") → photos-private/griffin-kid-zoo-800.webp
 * privateArt("nadia-art-22oct/venue-map-v2.png") → private/nadia-art-22oct/venue-map-v2.png
 */
// Only in the dev server: in any build these are "" (the address itself is dropped as dead code, so the build's
// "nothing private" guard never sees it), and an <img> with no src falls back to its paper print
const enc = (file: string) => file.split("/").map(encodeURIComponent).join("/")
export const privatePhoto = (file: string) => (import.meta.env.DEV ? `${import.meta.env.BASE_URL}__private/photos/${enc(file)}` : "")
export const privateArt = (file: string) => (import.meta.env.DEV ? `${import.meta.env.BASE_URL}__private/art/${enc(file)}` : "")
