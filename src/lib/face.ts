import { SCENES } from "@/lib/scenes"

/** Where the shown photo's face-safe rect (fractions of the image, in scenes.json) lands on screen, given object-fit: cover. */
export function faceRect(): DOMRect | null {
  const box = document.querySelector<HTMLElement>("[data-photo].opacity-100")
  const img = box?.querySelector("img"), name = box?.dataset.photo as keyof typeof SCENES | undefined
  // From 1280 the picture shows the wide photo, which has its own size and face rect
  const meta = name && (matchMedia("(min-width: 1280px)").matches && SCENES[name].wide ? SCENES[name].wide : SCENES[name])
  if (!img || !meta?.face) return null
  const r = img.getBoundingClientRect(), s = Math.max(r.width / meta.w, r.height / meta.h)
  const [px, py] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100)
  const ox = r.left + (r.width - meta.w * s) * (Number.isNaN(px) ? 0.5 : px), oy = r.top + (r.height - meta.h * s) * (Number.isNaN(py) ? 0.5 : py)
  const [x0, y0, x1, y1] = meta.face
  return new DOMRect(ox + x0 * meta.w * s, oy + y0 * meta.h * s, (x1 - x0) * meta.w * s, (y1 - y0) * meta.h * s)
}
