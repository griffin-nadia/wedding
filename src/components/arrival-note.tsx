import { useLayoutEffect, useState } from "react"
import { ART } from "@/lib/art"
import { faceRect } from "@/lib/face"
import { useLang } from "@/lib/lang"

type Box = { x: number; y: number; w: number; h: number }
type Place = { side: "above" | "left" | "right"; words: Box; arrow: Box }

const hits = (a: Box, b: DOMRect | Box) => {
  const bw = "width" in b ? b.width : b.w, bh = "height" in b ? b.height : b.h
  return a.x < b.x + bw && a.x + a.w > b.x && a.y < b.y + bh && a.y + a.h > b.y
}
const grow = (r: DOMRect, by: number): Box => ({ x: r.x - by, y: r.y - by, w: r.width + by * 2, h: r.height + by * 2 })

/**
 * The hand-lettered "Open your invite" and its little drawn arrow (back in run 19; removed in 18e). Decorative: the
 * envelope and the Open button under it are the real controls. The words are lettering art (public/art/note, a mask
 * filled with the note's colour) and the arrow is the hand-drawn line from 6 Oct, which loops once on its way in.
 *
 * Placed by rule, measured from the envelope's resting box (its float doesn't move the box):
 *  - laptops: beside the envelope, the arrow curving in to its side (left first, the photo is on the right)
 *  - phones and anything narrower: above it, the arrow coming down onto the flap
 * It never covers the envelope, the Open button, the top bar or their faces, and stays on screen; if no place is
 * clear there's no note. Draws on once (the words, then the line, then its head); still under reduced motion.
 */
export default function ArrivalNote({ envelope }: { envelope: React.RefObject<HTMLElement | null> }) {
  const { lang } = useLang()
  const art = lang === "ja" ? ART.note.ja : ART.note.en
  const [place, setPlace] = useState<Place | null>(null)
  useLayoutEffect(() => {
    const fit = () => {
      const float = envelope.current?.parentElement
      if (!float) return
      // The float wrapper's own box: offsetLeft/Top ignore its bob and tilt (it sits in the fixed .arrival)
      const e = new DOMRect(float.offsetLeft, float.offsetTop, float.offsetWidth, float.offsetHeight)
      const label = document.querySelector(".arrival-open")?.getBoundingClientRect()
      const face = faceRect()
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar-h")) || 56
      const wide = matchMedia("(min-width: 1024px)").matches
      // A quarter larger on laptops where there's room beside the envelope
      const base = lang === "ja" ? 180 : 160, ww = wide ? Math.max(base, Math.min(base * 1.25, e.left - 20)) : base, wh = Math.round(ww / art.ratio)
      const above = (): Place => {
        const tip = { x: e.left + e.width / 2 + 18, y: e.top - 12 }
        let arrow = { x: tip.x - 38.6, y: tip.y - 43.9, w: 72, h: 48 }
        let words = { x: arrow.x + 4 - ww, y: arrow.y + 8 - wh / 2, w: ww, h: wh }
        const dx = Math.max(0, 12 - words.x) // a narrow phone: slide right, the arrow still lands on the flap
        arrow = { ...arrow, x: arrow.x + dx }; words = { ...words, x: words.x + dx }
        return { side: "above", words, arrow }
      }
      const left = (): Place => {
        const tip = { x: e.left - 20, y: e.top + e.height * 0.5 }
        const arrow = { x: tip.x - 70.9, y: tip.y - 45.5, w: 84, h: 56 }
        const words = { x: Math.min(arrow.x + 6 - ww * 0.45, e.left - 12 - ww), y: arrow.y - wh + 2, w: ww, h: wh }
        return { side: "left", words, arrow }
      }
      const right = (): Place => {
        const tip = { x: e.right + 20, y: e.top + e.height * 0.5 }
        const arrow = { x: tip.x - 13.1, y: tip.y - 45.5, w: 84, h: 56 }
        const words = { x: Math.max(arrow.x + 78 - ww * 0.55, e.right + 12), y: arrow.y - wh + 2, w: ww, h: wh }
        return { side: "right", words, arrow }
      }
      const tries = wide ? [left(), right(), above()] : [above(), left(), right()]
      const keepOut = [grow(e, 6), ...(label ? [grow(label, 4)] : []), ...(face ? [face] : [])]
      const clear = (p: Place) => [p.words, p.arrow].every((b) =>
        b.x >= 8 && b.y >= bar && b.x + b.w <= innerWidth - 8 && b.y + b.h <= innerHeight - 8 && keepOut.every((k) => !hits(b, k)))
      setPlace(tries.find(clear) ?? null)
    }
    fit()
    // The viewport (the root) or the envelope changing size moves the note; no resize listener
    const ro = new ResizeObserver(fit)
    ro.observe(document.documentElement)
    if (envelope.current) ro.observe(envelope.current)
    return () => ro.disconnect()
  }, [envelope, lang, art.ratio])
  if (!place) return null
  const at = (b: Box) => ({ left: Math.round(b.x), top: Math.round(b.y), width: b.w, height: b.h })
  return (
    <div aria-hidden className="arrival-note" data-side={place.side}>
      <span className="arrival-note-words" style={{ ...at(place.words), ["--note-art" as string]: `url(${import.meta.env.BASE_URL}${art.src})` }} />
      <svg viewBox="0 0 96 64" className="arrival-note-arrow" fill="none" style={at(place.arrow)}>
        {/* In from the words at an angle, one loose loop, then the head: two short strokes of slightly different
            length meeting at the tip, drawn after the line lands. A little wobble in the curves, like a pen. */}
        {place.side === "above"
          ? <><path pathLength={1} d="M7 5 C 24 0.5, 43 5.5, 45.5 18 C 47.5 28.5, 33 31, 33.5 21.5 C 34 11.5, 55 14, 55.5 30 C 56 41, 54 50, 51.5 58.5" /><path className="head" pathLength={1} d="M43.8 51.2 L51.5 58.5 M51.5 58.5 L60.3 48.4" /></>
          : <><path pathLength={1} d="M7 4 C 5.5 17, 13 30.5, 25.5 26.5 C 36 23, 31 11.5, 23.5 17.5 C 15.5 25, 42 50.5, 80.5 52" /><path className="head" pathLength={1} d="M71.5 45.6 L81 52 M81 52 L71.8 59.4" /></>}
      </svg>
    </div>
  )
}
