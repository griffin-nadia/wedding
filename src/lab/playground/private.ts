/**
 * Run 24: pictures that aren't on the site yet (Griffin's other childhood prints, Nadia's kid photos, her map pieces),
 * from the lab's dev server only (vite.config.ts, privatePictures). In a lab test build they 404, so anything using
 * them must show a plain paper print instead.
 * privatePhoto("griffin-kid-zoo-800.webp") → photos-private/griffin-kid-zoo-800.webp
 * privateArt("nadia-art-22oct/venue-map-v2.png") → private/nadia-art-22oct/venue-map-v2.png
 */
const base = `${import.meta.env.BASE_URL}__private/`
const enc = (file: string) => file.split("/").map(encodeURIComponent).join("/")
export const privatePhoto = (file: string) => `${base}photos/${enc(file)}`
export const privateArt = (file: string) => `${base}art/${enc(file)}`
