import { useLayoutEffect, useRef, useState } from "react"
import { SCENES } from "@/lib/scenes"
import { useLang } from "@/lib/lang"

type Place = { x: number; y: number; w: number; h: number; side: "centre" | "left" | "right"; row?: boolean; words: boolean } | null

/** Where the photo's face-safe rect (fractions of the image, in scenes.json) lands on screen, given object-fit: cover. */
function faceRect(): DOMRect | null {
  const box = document.querySelector<HTMLElement>("[data-photo].opacity-100")
  const img = box?.querySelector("img"), name = box?.dataset.photo as keyof typeof SCENES | undefined
  const meta = name && SCENES[name]
  if (!img || !meta?.face) return null
  const r = img.getBoundingClientRect(), s = Math.max(r.width / meta.w, r.height / meta.h)
  const [px, py] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100)
  const ox = r.left + (r.width - meta.w * s) * (Number.isNaN(px) ? 0.5 : px), oy = r.top + (r.height - meta.h * s) * (Number.isNaN(py) ? 0.5 : py)
  const [x0, y0, x1, y1] = meta.face
  return new DOMRect(ox + x0 * meta.w * s, oy + y0 * meta.h * s, (x1 - x0) * meta.w * s, (y1 - y0) * meta.h * s)
}
const hits = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

/**
 * "open your invite" in Klee One, tilted like a hand-written note, with a hand-drawn arrow that loops once on its way
 * to the envelope (6 Oct): the words write in, the line draws, then its head.
 * Placed by rule: above the envelope, centred; if that would cover a face, slid to the side; if both sides would,
 * the words go and the arrow stays; if even the arrow would, there's no note. Draws in once (600 ms) after the envelope settles; still under reduced motion.
 */
export default function ArrivalNote({ envelope }: { envelope: React.RefObject<HTMLElement | null> }) {
  const { t } = useLang()
  const [place, setPlace] = useState<Place>(null)
  const note = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const gap = 4
    const fit = () => {
      const e = envelope.current?.getBoundingClientRect()
      if (!e) return
      const face = faceRect(), cx = e.left + e.width / 2
      // Stacked (words over a downward arrow) first; then one low line (words, then an arrow curling into the flap)
      const stack = (side: "centre" | "left" | "right", x: number) => ({ x, y: e.top - 96 - gap, w: 168, h: 96, side, words: true })
      const row = (x: number) => ({ x, y: e.top - 52, w: 224, h: 56, side: "left" as const, row: true, words: true })
      const tries: Exclude<Place, null>[] = [
        stack("centre", cx - 84),
        row(Math.max(16, e.left - 8)),
        stack("left", Math.max(16, e.left - 92)),
        stack("right", Math.min(innerWidth - 184, e.right - 76)),
      ]
      const ok = tries.find((p) => !face || !hits(new DOMRect(p.x, p.y, p.w, p.h), face))
      const arrow = { x: cx - 36, y: e.top - 52, w: 72, h: 48, side: "centre" as const, words: false }
      // Nothing clear at all (a short phone with faces right above the envelope): no note, the envelope stands alone
      setPlace(ok ?? (face && hits(new DOMRect(arrow.x, arrow.y, arrow.w, arrow.h), face) ? null : arrow))
    }
    fit()
    addEventListener("resize", fit)
    const id = setTimeout(fit, 400) // once the photo has its size
    return () => { removeEventListener("resize", fit); clearTimeout(id) }
  }, [envelope])
  if (!place) return null
  return (
    <div ref={note} aria-hidden className="arrival-note" data-side={place.side} data-row={place.row || undefined} data-words={place.words || undefined}
      style={{ transform: `translate(${Math.round(place.x)}px, ${Math.round(place.y)}px)`, width: place.w, height: place.h }}>
      {place.words && <span className="arrival-note-words">{t.letter.note}</span>}
      <svg viewBox="0 0 96 64" className="arrival-note-arrow" fill="none">
        {/* One loose loop on the way down, like a pen flourish, then the head is drawn after the line lands */}
        {place.row
          ? <><path pathLength={1} d="M4 12 C 22 2, 42 4, 44 14 C 46 24, 30 26, 32 16 C 34 6, 60 10, 62 42" /><path className="head" pathLength={1} d="M54 35 L62 44 L69 34" /></>
          : place.side === "centre"
          ? <><path pathLength={1} d="M10 4 C 34 -2, 60 6, 56 20 C 52 32, 36 26, 42 17 C 48 8, 70 20, 52 58" /><path className="head" pathLength={1} d="M44 50 L52 59 L59 49" /></>
          : <><path pathLength={1} d="M10 4 C 12 24, 26 30, 34 22 C 42 14, 30 8, 28 20 C 26 38, 56 52, 82 52" /><path className="head" pathLength={1} d="M72 44 L83 52 L72 60" /></>}
      </svg>
    </div>
  )
}
