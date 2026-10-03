import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

// One maple leaf, drawn once (24 × 24)
const LEAF = "M12 2l1.6 3.6 3.4-1.4-.8 3.8 3.8.4-2.6 2.6 3.2 1.6-3.6 1.2.8 3.4-3.4-1.2L12 20l-2.4-4 -3.4 1.2.8-3.4L3.4 12.6l3.2-1.6L4 8.4l3.8-.4L7 4.2l3.4 1.4z M12 20v3"
const KEY = "ng-leaf"

/**
 * Catch a leaf (v3 T, Options → Home, the Planner's idea): every so often a maple leaf drifts past, coloured by
 * the season (green at the invite, red by the wedding). Tap or click it and it lands pressed in the letter's top
 * corner and stays there next visit. Decorative only: nothing depends on it, and nothing moves under reduced motion.
 */
export default function Leaves() {
  const [falling, setFalling] = useState<{ id: number; x: number; d: number }[]>([])
  const [pressed, setPressed] = useState(() => { try { return localStorage.getItem(KEY) === "1" } catch { return false } })
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let n = 0
    const drop = () => { if (document.hidden) return; const id = ++n; setFalling((f) => [...f.slice(-1), { id, x: 10 + Math.random() * 70, d: 9 + Math.random() * 4 }]) }
    const first = window.setTimeout(drop, 2500), every = window.setInterval(drop, 9000)
    return () => { clearTimeout(first); clearInterval(every) }
  }, [])
  const catchIt = (id: number) => { setFalling((f) => f.filter((l) => l.id !== id)); setPressed(true); try { localStorage.setItem(KEY, "1") } catch { /* fine */ } }
  const letter = document.getElementById("letter")
  return (
    <>
      {falling.map((l) => (
        <button key={l.id} type="button" tabIndex={-1} aria-hidden className="leaf-fall" style={{ left: `${l.x}vw`, animationDuration: `${l.d}s` }}
          onAnimationEnd={() => setFalling((f) => f.filter((x) => x.id !== l.id))} onClick={() => catchIt(l.id)}>
          <svg viewBox="0 0 24 24" className="leaf-svg"><path d={LEAF} /></svg>
        </button>
      ))}
      {pressed && letter && createPortal(<svg aria-hidden viewBox="0 0 24 24" className="leaf-svg leaf-pressed"><path d={LEAF} /></svg>, letter)}
    </>
  )
}
