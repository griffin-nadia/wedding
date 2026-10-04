import { useEffect, useRef, useState } from "react"

const base = import.meta.env.BASE_URL
const ZOOM = 3, R = 72

/**
 * A glass loupe over Nadia's painted envelope (Options → Arrival; a placeholder painting until her scan). Laptop: it
 * follows the mouse while over the envelope. Phones: press and hold still for a moment and it appears above the
 * finger, following it, so the brushwork isn't under your thumb; moving first is still a pull to open. Inside the
 * lens is the large scan (loaded only now), three times over, with a faint glass wobble at the rim.
 */
export default function EnvelopeLoupe({ envelope, stage }: { envelope: React.RefObject<HTMLElement | null>; stage: React.RefObject<HTMLElement | null> }) {
  const [at, setAt] = useState<{ x: number; y: number; bx: number; by: number; w: number; h: number; touch: boolean } | null>(null)
  const hold = useRef<{ id: number; x: number; y: number; on: boolean } | null>(null)
  useEffect(() => {
    const env = envelope.current
    if (!env) return
    const place = (x: number, y: number, touch: boolean) => {
      const r = env.getBoundingClientRect()
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return setAt(null)
      setAt({ x, y: touch ? y - 96 : y, bx: (x - r.left) * ZOOM - R, by: (y - r.top) * ZOOM - R, w: r.width * ZOOM, h: r.height * ZOOM, touch })
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return place(e.clientX, e.clientY, false)
      const h = hold.current
      if (!h) return
      if (h.on) { e.preventDefault(); return place(e.clientX, e.clientY, true) }
      if (Math.hypot(e.clientX - h.x, e.clientY - h.y) > 6) { clearTimeout(h.id); hold.current = null } // a pull, not a hold
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !env.contains(e.target as Node)) return
      const x = e.clientX, y = e.clientY
      hold.current = { x, y, on: false, id: window.setTimeout(() => { if (!hold.current) return; hold.current.on = true; stage.current?.setAttribute("data-loupe", ""); place(x, y, true) }, 350) }
    }
    const up = () => {
      const h = hold.current; hold.current = null
      if (h) clearTimeout(h.id)
      if (h?.on) { setAt(null); setTimeout(() => stage.current?.removeAttribute("data-loupe"), 0) }
    }
    const leave = (e: PointerEvent) => { if (e.pointerType === "mouse") setAt(null) }
    addEventListener("pointermove", move, { passive: false }); addEventListener("pointerdown", down); addEventListener("pointerup", up); addEventListener("pointercancel", up)
    env.addEventListener("pointerleave", leave)
    return () => { removeEventListener("pointermove", move); removeEventListener("pointerdown", down); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); env.removeEventListener("pointerleave", leave) }
  }, [envelope, stage])
  return (
    <>
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id="loupe-glass"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="3" /></filter>
      </svg>
      {at && (
        <span aria-hidden className="loupe" data-touch={at.touch || undefined}
          style={{ left: at.x - R, top: at.y - R, backgroundImage: `url(${base}art/envelope/placeholder-2400.webp)`, backgroundSize: `${at.w}px ${at.h}px`, backgroundPosition: `${-at.bx}px ${-at.by}px` }} />
      )}
    </>
  )
}
