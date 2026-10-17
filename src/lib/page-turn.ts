import { useEffect, useLayoutEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { nextFrame } from "@/lib/frame"

/** The five letters in order (Home, The day, Travel, FAQs, Our story). */
export const LETTERS: string[] = ["/", "/the-day", "/travel", "/our-story", "/faqs"]
const indexOf = (p: string) => { const i = LETTERS.findIndex((l) => l === (p.replace(/\/+$/, "") || "/")); return i }

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const letter = () => document.getElementById("letter")

/** True when the element (or a parent below the letter) scrolls sideways: its own drag wins over a page turn. */
const inSideScroller = (t: Element | null) => {
  for (let el = t; el && el.id !== "letter"; el = el.parentElement) {
    const ox = getComputedStyle(el).overflowX
    if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 1) return true
  }
  return false
}

const TRACK = "transform var(--duration-base) var(--ease-paper)"
/** One letter along the track: its own width plus a 12px gap, so the two sheets slide with paper between them. */
const STEP = () => (letter()?.getBoundingClientRect().width ?? innerWidth - 24) + 12
/**
 * While a letter is on the move it's a sheet of paper on its own: clipped to the part on screen (12px from the top,
 * ending where the dock's strip begins) with its own rounded corners, and the strip that normally trims it under
 * the dock steps aside (html[data-turning]). So nothing ever shows a straight cut edge or a bare photo.
 */
function asSheet(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const nav = document.querySelector(".site-nav")?.getBoundingClientRect().top ?? innerHeight
  const top = Math.max(0, 12 - r.top), bottom = Math.max(0, r.bottom - (nav - 12))
  el.style.clipPath = `inset(${top}px 0 ${bottom}px 0 round var(--letter-radius))`
  document.documentElement.toggleAttribute("data-turning", true)
}
let moving = 0
const still_ = (el: HTMLElement) => { el.style.clipPath = ""; if (--moving <= 0) { moving = 0; document.documentElement.removeAttribute("data-turning") } }
const turnMs = () => {
  const d = getComputedStyle(document.documentElement).getPropertyValue("--duration-base").trim()
  return (d.endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000) || 280
}
let dragging = false
/** Leaves the letter with no inline motion once it has settled, so nothing lingers on its own layer */
const settle = (el: HTMLElement) => {
  moving++
  let done = false
  const clear = () => { if (done) return; done = true; el.removeEventListener("transitionend", own); if (dragging) return; el.style.transition = ""; el.style.willChange = ""; still_(el) }
  const own = (e: TransitionEvent) => { if (e.target === el && e.propertyName === "transform") clear() }
  el.addEventListener("transitionend", own)
  window.setTimeout(clear, turnMs() + 120)
}
let pending: { dir: number; at: number; go: () => void } | null = null

/**
 * The leaving letter as a still copy on the same track: it slides off as the new letter slides in, both
 * by the same distance at the same speed, so the two read as one strip of paper. Nothing else moves.
 */
function leave(dir: number, fromX = 0) {
  const el = letter(); if (!el) return
  const r = el.getBoundingClientRect()
  const g = el.cloneNode(true) as HTMLElement
  g.removeAttribute("id"); g.setAttribute("aria-hidden", "true"); g.inert = true
  g.classList.add("letter-ghost")
  Object.assign(g.style, { position: "fixed", top: `${r.top}px`, left: `${r.left - fromX}px`, width: `${r.width}px`, height: `${r.height}px`, margin: "0", transition: "none", transform: `translateX(${fromX}px)` })
  document.body.appendChild(g)
  asSheet(g); moving++
  // Gone the moment it's off screen, with a fallback in case the transition never reports back (or never starts)
  let gone = false
  const done = () => { if (gone) return; gone = true; g.remove(); still_(g) }
  g.addEventListener("transitionend", (e) => { if (e.target === g) done() })
  window.setTimeout(done, turnMs() + 600)
  // It starts moving with the arriving letter, in the same frame, so the 12px between them never changes
  pending = { dir, at: fromX, go: () => { g.style.transition = TRACK; g.style.transform = `translateX(${-dir * STEP()}px)` } }
}

/**
 * Pages mode on phones (v3 K, Q1, Q2): swipe left or right between the letters. A turn starts only from
 * a 24px sideways drag with under 12px of vertical drift, and never inside something that scrolls
 * sideways. The letter follows the finger flat (no tilt); let go past 25% (or flick) and the leaving and
 * arriving letters move together on one track; let go short and it springs back in 200 ms. The scene,
 * the dock and everything else stay still. Dock taps use the same track. Below 768 only; nothing while
 * the envelope is sealed; reduced motion just cuts.
 */
export function usePageTurn(enabled: boolean) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const from = useRef(indexOf(pathname))

  // The arriving letter starts one sheet along the track and slides in with the leaving copy. Before paint, so the new
  // page never shows for a frame in the middle of the screen.
  useLayoutEffect(() => {
    const to = indexOf(pathname), p = pending
    from.current = to; pending = null
    const el = letter(); if (!el || !p || still()) return
    el.style.transition = "none"; el.style.willChange = "transform"
    el.style.transform = `translateX(${p.at + p.dir * STEP()}px)`
    asSheet(el)
    nextFrame(() => nextFrame(() => { el.style.transition = TRACK; el.style.transform = ""; settle(el); p.go() }))
  }, [pathname])

  useEffect(() => {
    if (!enabled) return
    let start: { x: number; y: number; t: number } | null = null, dx = 0, active = false, frame: (() => void) | null = null
    // One write per frame while dragging, however often the finger reports
    const paint = () => { frame = null; const el = letter(); if (el && start) el.style.transform = `translateX(${dx}px)` }
    const wide = () => window.matchMedia("(min-width: 768px)").matches
    const here = () => indexOf(location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ""), "") || "/")
    const down = (e: PointerEvent) => {
      const t = e.target as Element
      if (wide() || e.pointerType === "mouse" || t.closest("input, textarea, [role=slider], .combo-field, .sheet, [data-own-swipe]") || inSideScroller(t)) return
      start = { x: e.clientX, y: e.clientY, t: performance.now() }; dx = 0; active = false
    }
    const move = (e: PointerEvent) => {
      if (!start) return
      const x = e.clientX - start.x, y = e.clientY - start.y
      if (!active) {
        if (Math.abs(y) >= 12) { start = null; return } // a scroll, not a turn
        if (Math.abs(x) < 24) return
        active = true; dragging = true
        const el = letter(); if (el) { el.style.transition = "none"; el.style.willChange = "transform"; asSheet(el); moving++ }
      }
      const i = here()
      const edge = (x > 0 && i === 0) || (x < 0 && i === LETTERS.length - 1)
      dx = edge ? x * 0.25 : x // resist at the ends
      if (!frame) frame = nextFrame(paint)
    }
    const up = () => {
      if (!start) return
      const el = letter(), v = Math.abs(dx) / Math.max(1, performance.now() - start.t)
      start = null; dragging = false
      if (frame) { frame(); frame = null }
      if (!active || !el) return
      const i = here(), dir = dx < 0 ? 1 : -1, to = i + dir
      const go = (Math.abs(dx) > innerWidth * 0.25 || v > 0.5) && to >= 0 && to < LETTERS.length
      // The drag lets go of its hold; settle() or the arrival takes over (keeping the clip if the page is turning)
      if (go && !still()) moving--; else still_(el)
      if (!go) {
        el.style.transition = "transform var(--duration-fast) var(--ease-spring)"; el.style.transform = ""; asSheet(el); settle(el)
        return
      }
      if (!still()) leave(dir, dx)
      // Keep the old page off screen until the new one is placed (no flash of it back in the middle)
      el.style.transition = "none"; el.style.transform = `translateX(${dx + dir * STEP()}px)`
      nav(LETTERS[to]); window.scrollTo(0, 0)
    }
    // Dock and top bar taps: the same track, in the direction of the letter being opened
    const tap = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>(".site-nav a"); if (!a || wide() || still()) return
      const to = indexOf(new URL(a.href).pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ""), "") || "/"), i = here()
      if (to < 0 || i < 0 || to === i) return
      leave(Math.sign(to - i))
    }
    window.addEventListener("pointerdown", down, { passive: true })
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up)
    document.addEventListener("click", tap, true)
    return () => {
      window.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up)
      document.removeEventListener("click", tap, true)
      frame?.()
    }
  }, [enabled, nav])
}

