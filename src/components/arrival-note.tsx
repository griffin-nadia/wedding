import { useLayoutEffect, useRef, useState } from "react"
import { faceRect } from "@/lib/face"
import { useLang } from "@/lib/lang"
import { useOption } from "@/lib/options"

type Place = { x: number; y: number; w: number; h: number; side: "centre" | "left" | "right" | "below"; row?: boolean; words: boolean } | null

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
  // Options → Arrival → Envelope note words: phones can hint the pull instead ("tap, or pull the letter up")
  const pullCopy = useOption("notecopy") === "pull" && typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches
  const peekOff = useOption("peek") === "off"
  // Options → Arrival → Note when faces are in the way: below the envelope (default) or hidden as before
  const below = useOption("notebelow") !== "hide"
  useLayoutEffect(() => {
    const fit = () => {
      const e = envelope.current?.getBoundingClientRect()
      if (!e) return
      // On laptops the letter peeks up out of the envelope on hover (22% of its height, plus the envelope's lift):
      // the note sits clear of that, so the letter never crosses its line
      const hover = matchMedia("(hover: hover) and (pointer: fine)").matches && !peekOff
      const gap = hover ? Math.round(e.height * 0.22) + 12 : 4
      const face = faceRect(), cx = e.left + e.width / 2
      // Stacked (words over a downward arrow) first; then one low line (words, then an arrow curling into the flap)
      const stack = (side: "centre" | "left" | "right", x: number) => ({ x, y: e.top - 96 - gap, w: 168, h: 96, side, words: true })
      // The pull hint is two lines, so its row is a little wider and taller (measured as such for the face check)
      const row = (x: number) => ({ x, y: e.top - (pullCopy ? 60 : 48) - gap, w: pullCopy ? 244 : 224, h: pullCopy ? 64 : 56, side: "left" as const, row: true, words: true })
      const tries: Exclude<Place, null>[] = [
        stack("centre", cx - 84),
        row(Math.max(16, e.left - 8)),
        stack("left", Math.max(16, e.left - 92)),
        stack("right", Math.min(innerWidth - 184, e.right - 76)),
      ]
      // Nothing clear above: under the envelope instead, pointing up at it. A full note where there's room, else one
      // line (the words and a small arrow) in the strip under it, as on a 390 × 844 phone
      if (below) {
        const room = innerHeight - e.bottom - 8
        if (room >= 96) tries.push({ x: cx - 84, y: e.bottom + 6, w: 168, h: 96, side: "below", words: true })
        else if (room >= 28) tries.push({ x: cx - 112, y: e.bottom + 4, w: 224, h: Math.min(room, 36), side: "below", row: true, words: true })
      }
      const ok = tries.find((p) => !face || !hits(new DOMRect(p.x, p.y, p.w, p.h), face))
      const arrow = { x: cx - 36, y: e.top - 48 - gap, w: 72, h: 48, side: "centre" as const, words: false }
      // Nothing clear at all (a short phone with faces right above the envelope): no note, the envelope stands alone
      setPlace(ok ?? (face && hits(new DOMRect(arrow.x, arrow.y, arrow.w, arrow.h), face) ? null : arrow))
    }
    fit()
    addEventListener("resize", fit)
    const id = setTimeout(fit, 400) // once the photo has its size
    return () => { removeEventListener("resize", fit); clearTimeout(id) }
  }, [envelope, peekOff, pullCopy, below])
  if (!place) return null
  return (
    <div ref={note} aria-hidden className="arrival-note" data-side={place.side} data-row={place.row || undefined} data-words={place.words || undefined}
      style={{ transform: `translate(${Math.round(place.x)}px, ${Math.round(place.y)}px)`, width: place.w, height: place.h }}>
      {/* The pull hint is longer: two lines, so it stays inside the box the face check measured */}
      {place.words && <span className="arrival-note-words" data-long={pullCopy || undefined}>{pullCopy ? t.letter.notePull : t.letter.note}</span>}
      <svg viewBox="0 0 96 64" className="arrival-note-arrow" fill="none">
        {/* In from the upper left at an angle, one loose loop, then the head: two short strokes of slightly different
            length meeting at the tip, drawn after the line lands. A little wobble in the curves, like a pen. */}
        {place.row
          ? <><path pathLength={1} d="M3 9 C 15 3, 33 3.5, 37 13 C 40.5 21.5, 28 25, 27.5 16.5 C 27 8.5, 51 9, 64.5 43" /><path className="head" pathLength={1} d="M56.5 37.5 L64.5 44 M64.5 44 L66.8 33.2" /></>
          : place.side === "centre"
          ? <><path pathLength={1} d="M7 5 C 24 0.5, 43 5.5, 45.5 18 C 47.5 28.5, 33 31, 33.5 21.5 C 34 11.5, 55 14, 55.5 30 C 56 41, 54 50, 51.5 58.5" /><path className="head" pathLength={1} d="M43.8 51.2 L51.5 58.5 M51.5 58.5 L60.3 48.4" /></>
          : <><path pathLength={1} d="M7 4 C 5.5 17, 13 30.5, 25.5 26.5 C 36 23, 31 11.5, 23.5 17.5 C 15.5 25, 42 50.5, 80.5 52" /><path className="head" pathLength={1} d="M71.5 45.6 L81 52 M81 52 L71.8 59.4" /></>}
      </svg>
    </div>
  )
}
