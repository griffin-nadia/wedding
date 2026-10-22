import { useEffect, useRef, useState } from "react"
import { Stage } from "../../stage"
import { useTake } from "../../params"
import { still } from "../../motion"
import { P, commonCss, useChapters, capOf, LEAN, Polaroid, Opened, Develop, rustle } from "./common"

/**
 * Opening a photo (run 24), seven ways a print comes to you. The same seven story prints each time (their photos, the
 * chapter's year and place on the border); the opened print shows the chapter's own words. One idea per take:
 * - flip: it lifts towards you (grows, shadow spreads, tips a little in 3D); Turn over shows the words on the back
 * - tilt: on a desktop the print under the pointer tips a few degrees towards it, a soft gloss moving on the photo only
 * - loupe: a small round magnifier follows the pointer over a print; scroll (or + and -) zooms the opened one
 * - develop: the opened photo comes up from milky grey to full colour in about a second
 * - table: the others slide aside and go soft, a pool of lantern light under the one you hold
 * - hold: on a phone, press and hold to pick a print up and move it about; let go and it drops back (a tick on Android)
 * - sound: a soft paper rustle as it opens, only when the site's music is already playing
 * Every take: a real button per print, Enter opens, Escape closes, focus goes back to the print; reduced motion fades.
 */
const css = `
/* Tilt: the print tips to the pointer (transform only), a gloss on the photo follows it */
.${P}-tilt { display: block; transition: transform .14s ease-out; transform: perspective(700px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); }
.${P}-btn:not(:hover) .${P}-tilt { transition-duration: .45s; }
.${P}-gloss { position: absolute; left: -50%; top: -50%; width: 200%; height: 200%; pointer-events: none; opacity: 0; transition: opacity .3s;
  background: radial-gradient(circle at 50% 50%, rgb(255 255 255 / .38), rgb(255 255 255 / .08) 22%, transparent 40%);
  transform: translate(var(--gx, 0%), var(--gy, 0%)); mix-blend-mode: soft-light; }
.${P}-btn:hover .${P}-gloss { opacity: 1; }
/* Loupe: a round glass with the photo at 2.6x inside */
.${P}-loupe { position: absolute; left: 0; top: 0; z-index: 4; width: 112px; height: 112px; border-radius: 50%; overflow: hidden; pointer-events: none;
  box-shadow: 0 0 0 3px var(--brand-paper-bright), 0 0 0 4px rgb(var(--tint-shadow) / .3), 0 10px 22px -6px rgb(var(--tint-shadow) / .5); background: var(--brand-kinari); }
.${P}-loupe img { position: absolute; left: 0; top: 0; max-width: none; object-fit: cover; object-position: 50% 30%; }
/* Table: the others slide away from the one you picked and go soft */
.${P}-row[data-take="table"] > li { transition: transform .6s var(--ease-paper), opacity .6s var(--ease-paper); }
.${P}-row[data-open] > li:not([data-held]) { transform: translate(var(--px, 0), var(--py, 0)) scale(.92); opacity: .55; }
/* Hold: picked up, it lifts and follows the finger */
.${P}-row[data-take="hold"] img { -webkit-user-drag: none; }
.${P}-row[data-take="hold"] .${P}-btn { touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.${P}-btn[data-held] { z-index: 5; }
.${P}-btn[data-held] .${P}-pol { scale: 1.1; rotate: 0deg; box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .16), 0 30px 40px -18px rgb(var(--tint-shadow) / .6); transition: scale .2s, rotate .2s; }
@media (prefers-reduced-motion: reduce) {
  .${P}-tilt { transform: none !important; }
  .${P}-row[data-open] > li:not([data-held]) { transform: none; }
  .${P}-btn[data-held] .${P}-pol { scale: 1; }
}
`
const HINT: Record<string, string> = {
  flip: "Open a print, then turn it over",
  tilt: "Move the pointer over a print (desktop)",
  loupe: "Hover for the loupe; scroll on an opened print to zoom",
  develop: "Open a print and watch it develop",
  table: "Open a print: the others move aside",
  hold: "Press and hold a print to pick it up (phones)",
  sound: "With the music on, opening a print rustles",
}

export default function OpenCome() {
  const take = useTake("flip")
  const chapters = useChapters()
  const [open, setOpen] = useState<{ i: number; from: HTMLElement } | null>(null)
  const row = useRef<HTMLUListElement>(null)
  const [loupe, setLoupe] = useState<{ i: number; x: number; y: number; px: number; py: number; w: number; h: number; src: string } | null>(null)
  const fine = typeof window !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches && !still()

  const openAt = (i: number, from: HTMLElement) => {
    if (take === "sound") rustle()
    if (take === "table" && row.current) {
      // Each other print slides away from the one picked, further the closer it was
      const a = from.getBoundingClientRect(), cx = a.left + a.width / 2, cy = a.top + a.height / 2
      row.current.querySelectorAll<HTMLLIElement>(":scope > li").forEach((li, k) => {
        if (k === i) { li.setAttribute("data-held", ""); return }
        const b = li.getBoundingClientRect(), dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy, d = Math.hypot(dx, dy) || 1
        const push = Math.max(24, 120 - d / 6)
        li.style.setProperty("--px", `${((dx / d) * push).toFixed(0)}px`); li.style.setProperty("--py", `${((dy / d) * push).toFixed(0)}px`)
      })
    }
    setLoupe(null)
    setOpen({ i, from })
  }
  const closed = () => { row.current?.querySelectorAll("[data-held]").forEach((n) => n.removeAttribute("data-held")); setOpen(null) }

  // Tilt: pointer position on the print → a few degrees each way, and the gloss offset
  const tilt = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (take !== "tilt" || !fine) return
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    const s = e.currentTarget.style
    s.setProperty("--ry", `${(x * 12).toFixed(2)}deg`); s.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`)
    s.setProperty("--gx", `${(x * 60).toFixed(1)}%`); s.setProperty("--gy", `${(y * 60).toFixed(1)}%`)
  }
  const untilt = (e: React.PointerEvent<HTMLButtonElement>) => { ["--rx", "--ry"].forEach((k) => e.currentTarget.style.setProperty(k, "0deg")) }
  // Loupe: where the pointer is on the photo, and that photo's own image
  const look = (i: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (take !== "loupe" || !fine) return
    const ph = e.currentTarget.querySelector<HTMLElement>(`.${P}-photo`), img = ph?.querySelector("img")
    if (!ph || !img?.currentSrc) return
    const r = ph.getBoundingClientRect(), b = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) return setLoupe(null)
    setLoupe({ i, x: x + (r.left - b.left), y: y + (r.top - b.top), w: r.width, h: r.height, src: img.currentSrc, px: x, py: y })
  }

  // Hold (phones): a long press picks the print up; it follows the finger and drops back when let go
  const hold = useRef<{ timer: number; el: HTMLButtonElement; x: number; y: number; held: boolean; id: number } | null>(null)
  const swallow = useRef(0) // a click right after letting go of a held print is the drop, not an open
  useEffect(() => {
    const el = row.current
    if (take !== "hold" || !el) return
    const block = (e: TouchEvent) => { if (hold.current?.held) e.preventDefault() }
    el.addEventListener("touchmove", block, { passive: false })
    return () => el.removeEventListener("touchmove", block)
  }, [take])
  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (take !== "hold" || e.button !== 0) return
    const el = e.currentTarget, id = e.pointerId
    const timer = window.setTimeout(() => {
      if (!hold.current) return
      hold.current.held = true
      el.setAttribute("data-held", "")
      try { el.setPointerCapture(id) } catch { /* already gone */ }
      navigator.vibrate?.(8)
    }, 450)
    hold.current = { timer, el, x: e.clientX, y: e.clientY, held: false, id }
  }
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const h = hold.current
    if (!h) return
    const dx = e.clientX - h.x, dy = e.clientY - h.y
    if (!h.held) { if (Math.hypot(dx, dy) > 8) { clearTimeout(h.timer); hold.current = null } return }
    if (!still()) h.el.style.transform = `translate(${dx}px, ${dy}px)`
  }
  const up = () => {
    const h = hold.current
    if (!h) return
    clearTimeout(h.timer); hold.current = null
    if (!h.held) return
    swallow.current = performance.now() + 400
    const from = h.el.style.transform
    h.el.style.transform = ""
    h.el.removeAttribute("data-held")
    if (from && !still()) h.el.animate([{ transform: from }, { transform: "none" }], { duration: 480, easing: "cubic-bezier(.3, 1.35, .5, 1)" })
  }

  const c = open ? chapters[open.i] : null
  return (
    <Stage hint={HINT[take] ?? HINT.flip}>
      <style>{commonCss + css}</style>
      <ul ref={row} className={`${P}-row`} data-take={take} data-open={(take === "table" && open) || undefined}>
        {chapters.map((ch, i) => (
          <li key={ch.key}>
            <button type="button" className={`${P}-btn`} aria-label={`${ch.title}, ${ch.year}. Open`} aria-haspopup="dialog"
              onClick={(e) => { if (performance.now() < swallow.current) return; openAt(i, e.currentTarget) }}
              onPointerMove={(e) => { tilt(e); look(i, e); move(e) }} onPointerLeave={(e) => { untilt(e); setLoupe(null) }}
              onPointerDown={down} onPointerUp={up} onPointerCancel={up} onContextMenu={(e) => take === "hold" && e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
              <span className={`${P}-tilt`}>
                <Polaroid name={ch.photo} alt={ch.title} cap={capOf(ch)} lean={LEAN[i]}>
                  {take === "tilt" && <span className={`${P}-gloss`} aria-hidden />}
                </Polaroid>
              </span>
              {loupe?.i === i && (() => {
                const Z = 2.6, R = 56, l = loupe
                return (
                  <span className={`${P}-loupe`} aria-hidden style={{ transform: `translate(${l.x - R}px, ${l.y - R}px)` }}>
                    <img src={l.src} alt="" style={{ width: l.w * Z, height: l.h * Z, transform: `translate(${R - l.px * Z}px, ${R - l.py * Z}px)` }} />
                  </span>
                )
              })()}
            </button>
          </li>
        ))}
      </ul>
      {open && c && (
        <Opened from={open.from} label={c.title} onClose={closed} words={c}
          mode={take === "flip" ? "flip" : "beside"} pickup={take === "flip"} develop={take === "develop"} zoom={take === "loupe"} table={take === "table"}
          print={<Polaroid name={c.photo} alt={c.title} cap={capOf(c)} sizes="(min-width: 900px) 440px, 84vw">{take === "develop" && <Develop />}</Polaroid>} />
      )}
    </Stage>
  )
}
