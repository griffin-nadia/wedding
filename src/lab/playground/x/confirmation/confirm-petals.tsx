import { useEffect, useRef } from "react"
import { useLang } from "@/lib/lang"
import { loop } from "@/lib/frame"
import { Stage } from "../../stage"
import { getSpeed, still } from "../../motion"

/**
 * "You're all set", and a light fall of paper: small washi petals and maple leaves in the site's colours drift down,
 * each turning over as it falls (so you see its paler back) and swaying on the air. Tap anywhere for another handful
 * from your finger. One frame loop moves them all with transforms only, and it stops when the last has landed.
 * Reduced motion: a still scatter.
 */
const COLOURS = ["var(--brand-sabi)", "var(--brand-hachimitsu)", "var(--brand-sage)", "var(--brand-doro)", "var(--brand-wara)"]
const LEAF = "M12 0l2.4 5.6 5.6-2-1.6 5.8 5.6 1.6-4.8 3.6 2.4 5.4-5.8-.8L14.6 24h-5.2l-1.2-4.8-5.8.8 2.4-5.4L0 11l5.6-1.6L4 3.6l5.6 2z"
const PETAL = "M12 0c5 4 8 9 8 14a8 8 0 0 1-16 0c0-5 3-10 8-14zm0 5l-1 2 1 3 1-3z"
const css = `
.x-pt-field { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 3; }
.x-pt { position: absolute; left: 0; top: 0; width: 18px; height: 18px; will-change: transform; backface-visibility: visible; }
.x-pt svg { width: 100%; height: 100%; display: block; overflow: visible; }
.x-pt-card { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); width: min(100%, 420px); padding: var(--space-7) var(--space-6); border-radius: var(--letter-radius); background: var(--letter-bg); text-align: center; }
`
type P = { el: HTMLDivElement; x: number; y: number; vy: number; vx: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number; phase: number; sway: number }

export default function Petals() {
  const { t } = useLang()
  const field = useRef<HTMLDivElement>(null)
  const pieces = useRef<P[]>([]), running = useRef<(() => void) | null>(null)

  const add = (n: number, from?: { x: number; y: number }) => {
    const box = field.current
    if (!box) return
    const w = box.clientWidth, h = box.clientHeight
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div")
      el.className = "x-pt"
      const leaf = Math.random() < 0.35, size = 12 + Math.random() * 12, colour = COLOURS[Math.floor(Math.random() * COLOURS.length)]
      el.style.width = el.style.height = `${size}px`
      el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${leaf ? LEAF : PETAL}" fill="${colour}" fill-opacity="0.9"/><path d="${leaf ? LEAF : PETAL}" fill="#fff" fill-opacity="0.18" transform="translate(1 1) scale(0.92)"/></svg>`
      box.appendChild(el)
      const p: P = { el, x: from ? from.x + (Math.random() - 0.5) * 60 : Math.random() * w, y: from ? from.y + (Math.random() - 0.5) * 30 : -30 - Math.random() * h * 0.6,
        vy: 26 + Math.random() * 34, vx: (Math.random() - 0.5) * 16, rx: Math.random() * 360, ry: Math.random() * 360, rz: Math.random() * 360,
        sx: 90 + Math.random() * 160, sy: 60 + Math.random() * 140, sz: (Math.random() - 0.5) * 120, phase: Math.random() * Math.PI * 2, sway: 10 + Math.random() * 24 }
      if (from) p.vy = -60 - Math.random() * 80 // a handful thrown up from the finger first
      pieces.current.push(p)
      if (still()) { p.y = Math.random() * h * 0.9; place(p) }
    }
    if (!still()) run()
  }
  const place = (p: P) => { p.el.style.transform = `translate3d(${p.x + Math.sin(p.phase) * p.sway}px, ${p.y}px, 0) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)` }
  const run = () => {
    if (running.current) return
    let then = performance.now()
    running.current = loop((now) => {
      const dt = Math.min(0.05, (now - then) / 1000) * getSpeed(); then = now
      const h = field.current?.clientHeight ?? innerHeight
      for (const p of pieces.current) {
        p.vy = Math.min(p.vy + 90 * dt, 60) // gravity, then the air holds it at a gentle fall
        p.y += p.vy * dt; p.x += p.vx * dt; p.phase += dt * 1.6
        p.rx += p.sx * dt; p.ry += p.sy * dt; p.rz += p.sz * dt
        place(p)
      }
      for (const p of pieces.current.filter((q) => q.y > h + 40)) p.el.remove()
      pieces.current = pieces.current.filter((q) => q.y <= h + 40)
      if (!pieces.current.length) { running.current = null; return false }
    })
  }
  useEffect(() => {
    add(still() ? 30 : 50)
    return () => { running.current?.(); running.current = null; pieces.current.forEach((p) => p.el.remove()); pieces.current = [] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div onPointerDown={(e) => { const r = field.current!.getBoundingClientRect(); add(still() ? 0 : 22, { x: e.clientX - r.left, y: e.clientY - r.top }) }}>
      <Stage hint="Tap anywhere for another handful">
        <style>{css}</style>
        <div ref={field} className="x-pt-field" aria-hidden />
        <article className="x-pt-card paper-feel">
          <h2 className="heading">{t.rsvp.doneTitle.all}</h2>
          <p>{t.rsvp.sentLine}</p>
          <button type="button" className="btn-primary min-h-12 rounded-(--button-radius) px-(--button-pad) font-label font-medium" onClick={(e) => { e.stopPropagation(); add(still() ? 0 : 40) }}>Again</button>
        </article>
      </Stage>
    </div>
  )
}
