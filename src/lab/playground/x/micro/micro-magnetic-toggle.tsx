import { useEffect, useRef, useState } from "react"
import { LangToggle, LanternToggle } from "@/components/lantern-toggle"
import { Stage } from "../../stage"
import { spring, still } from "../../motion"

/**
 * The top bar's switches, magnetic on a laptop: within 80px each leans toward the pointer (up to 6px, a little
 * scale), and lets go with a spring when the pointer moves away. Touch and reduced motion: the plain switches.
 */
const css = `
.x-mag-bar { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-pill); background: color-mix(in oklab, var(--letter-bg) 90%, transparent); box-shadow: var(--elevation-paper); }
.x-mag-item { display: inline-grid; will-change: transform; }
.x-mag-note { font-size: var(--type-small-size); color: var(--ink-muted); text-align: center; max-width: 34ch; }
`

function Magnet({ children, on }: { children: React.ReactNode; on: boolean }) {
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const n = el.current
    if (!n || !on) return
    let x = 0, y = 0, sx = () => {}, sy = () => {}
    const set = () => { n.style.transform = `translate(${x}px, ${y}px) scale(${1 + Math.min(1, Math.hypot(x, y) / 6) * 0.06})` }
    const move = (e: PointerEvent) => {
      const r = n.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy)
      const pull = d < 80 ? (1 - d / 80) : 0
      const tx = (dx / Math.max(1, d)) * 6 * pull * Math.min(1, d / 20), ty = (dy / Math.max(1, d)) * 6 * pull * Math.min(1, d / 20)
      sx(); sy()
      sx = spring(x, tx, (v) => { x = v; set() }, { k: 300, c: 26 })
      sy = spring(y, ty, (v) => { y = v; set() }, { k: 300, c: 26 })
    }
    addEventListener("pointermove", move)
    return () => { removeEventListener("pointermove", move); sx(); sy(); n.style.transform = "" }
  }, [on])
  return <span ref={el} className="x-mag-item">{children}</span>
}

export default function MagneticToggle() {
  const [fine] = useState(() => matchMedia("(hover: hover) and (pointer: fine)").matches)
  const on = fine && !still()
  return (
    <Stage hint={on ? "Bring the pointer near the switches" : "On touch the switches stay put: this one is for laptops"}>
      <style>{css}</style>
      <div className="x-mag-bar">
        <Magnet on={on}><LangToggle /></Magnet>
        <Magnet on={on}><LanternToggle /></Magnet>
      </div>
      <p className="x-mag-note">The sun or moon still switches the mode, with its circle from the button.</p>
    </Stage>
  )
}
