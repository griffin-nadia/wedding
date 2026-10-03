import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

/** The four letters in order (Home, The day, Travel, FAQs). */
export const LETTERS: string[] = ["/", "/the-day", "/travel", "/faqs"]
/** Our story joins the letters once its words exist */
export const setStoryLetter = (on: boolean) => { const has = LETTERS.includes("/our-story"); if (on && !has) LETTERS.push("/our-story"); if (!on && has) LETTERS.pop() }
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

const TRACK = "transform var(--duration-turn) var(--ease-letter)"
let pending: { dir: number; at: number } | null = null

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
  requestAnimationFrame(() => { g.style.transition = TRACK; g.style.transform = `translateX(${-dir * innerWidth}px)` })
  window.setTimeout(() => g.remove(), 340)
  pending = { dir, at: fromX }
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

  // The arriving letter starts one screen along the track and slides in with the leaving copy
  useEffect(() => {
    const to = indexOf(pathname), p = pending
    from.current = to; pending = null
    const el = letter(); if (!el || !p || still()) return
    el.style.transition = "none"
    el.style.transform = `translateX(${p.at + p.dir * innerWidth}px)`
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = TRACK; el.style.transform = "" }))
  }, [pathname])

  useEffect(() => {
    if (!enabled) return
    let start: { x: number; y: number; t: number } | null = null, dx = 0, active = false
    const wide = () => window.matchMedia("(min-width: 768px)").matches
    const here = () => indexOf(location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ""), "") || "/")
    const down = (e: PointerEvent) => {
      const t = e.target as Element
      if (wide() || e.pointerType === "mouse" || t.closest("input, textarea, [role=slider], .combo-field, .rsvp-letter, .driver-modal") || inSideScroller(t)) return
      start = { x: e.clientX, y: e.clientY, t: performance.now() }; dx = 0; active = false
    }
    const move = (e: PointerEvent) => {
      if (!start) return
      const x = e.clientX - start.x, y = e.clientY - start.y
      if (!active) {
        if (Math.abs(y) >= 12) { start = null; return } // a scroll, not a turn
        if (Math.abs(x) < 24) return
        active = true
      }
      const i = here()
      const edge = (x > 0 && i === 0) || (x < 0 && i === LETTERS.length - 1)
      dx = edge ? x * 0.25 : x // resist at the ends
      const el = letter(); if (!el) return
      el.style.transition = "none"
      el.style.transform = `translateX(${dx}px)`
    }
    const up = () => {
      if (!start) return
      const el = letter(), v = Math.abs(dx) / Math.max(1, performance.now() - start.t)
      start = null
      if (!active || !el) return
      const i = here(), dir = dx < 0 ? 1 : -1, to = i + dir
      const go = (Math.abs(dx) > innerWidth * 0.25 || v > 0.5) && to >= 0 && to < LETTERS.length
      if (!go) {
        el.style.transition = "transform var(--duration-slide) var(--ease-spring)"; el.style.transform = ""
        return
      }
      if (!still()) leave(dir, dx)
      el.style.transition = "none"; el.style.transform = ""
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
    }
  }, [enabled, nav])
}

/** The paper light moves with the scroll (2%), on the letter and the scene. */
export function usePaperScroll() {
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
        document.documentElement.style.setProperty("--paper-scroll", (scrollY / max).toFixed(3))
      })
    }
    on(); window.addEventListener("scroll", on, { passive: true })
    return () => { window.removeEventListener("scroll", on); cancelAnimationFrame(raf) }
  }, [])
}
