import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

/** The four letters in order (Home, The day, Travel, FAQs). */
export const LETTERS: string[] = ["/", "/the-day", "/travel", "/faqs"]
/** Our story joins the letters once its words exist */
export const setStoryLetter = (on: boolean) => { const has = LETTERS.includes("/our-story"); if (on && !has) LETTERS.push("/our-story"); if (!on && has) LETTERS.pop() }
const indexOf = (p: string) => { const i = LETTERS.findIndex((l) => l === (p.replace(/\/+$/, "") || "/")); return i }

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const letter = () => document.getElementById("letter")

/**
 * Pages mode on phones (v3 K): swipe left or right between the four letters. The letter follows the
 * finger and dips up to 2°, then the next one settles in (320 ms, interruptible). Vertical scroll stays
 * native. Taps on the dock get the same settle. The dock marker and the paper light follow the swipe.
 * Below 768 only; nothing happens while the envelope is sealed or under reduced motion (it just cuts).
 */
export function usePageTurn(enabled: boolean) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const from = useRef(indexOf(pathname))
  const swiped = useRef<number | null>(null)

  // Settle the arriving letter in from the side it came from
  useEffect(() => {
    const to = indexOf(pathname), dir = swiped.current ?? Math.sign(to - from.current)
    from.current = to; swiped.current = null
    const el = letter(); if (!el || !dir || still()) return
    el.style.transition = "none"
    el.style.transform = `translateX(${dir * 36}%) rotate(${dir * 2}deg)`
    el.style.opacity = "0"
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = "transform 320ms var(--ease-letter), opacity 240ms var(--ease-paper)"
      el.style.transform = ""; el.style.opacity = ""
    }))
  }, [pathname])

  useEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    let start: { x: number; y: number; t: number } | null = null, dx = 0, active = false
    const wide = () => window.matchMedia("(min-width: 768px)").matches
    const set = (v: number) => { root.style.setProperty("--paper-turn", String(v)); window.dispatchEvent(new CustomEvent("ng-swipe", { detail: v })) }
    const down = (e: PointerEvent) => {
      if (wide() || e.pointerType === "mouse" || (e.target as Element).closest("input, textarea, [role=slider], .combo-field, .rsvp-letter")) return
      start = { x: e.clientX, y: e.clientY, t: performance.now() }; dx = 0; active = false
    }
    const move = (e: PointerEvent) => {
      if (!start) return
      const x = e.clientX - start.x, y = e.clientY - start.y
      if (!active) {
        if (Math.abs(y) > 12 && Math.abs(y) > Math.abs(x)) { start = null; return } // a scroll, not a turn
        if (Math.abs(x) < 12) return
        active = true
      }
      const i = indexOf(location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ""), "") || "/")
      const edge = (x > 0 && i === 0) || (x < 0 && i === LETTERS.length - 1)
      dx = edge ? x * 0.25 : x // resist at the ends
      const el = letter(); if (!el) return
      el.style.transition = "none"
      el.style.transform = `translateX(${dx}px) rotate(${(dx / innerWidth) * 2}deg)`
      set(-dx / innerWidth)
    }
    const up = () => {
      if (!start) return
      const el = letter(), v = Math.abs(dx) / Math.max(1, performance.now() - start.t)
      start = null
      if (!active || !el) return
      const i = indexOf(location.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ""), "") || "/")
      const dir = dx < 0 ? 1 : -1, to = i + dir
      const go = (Math.abs(dx) > innerWidth * 0.25 || v > 0.5) && to >= 0 && to < LETTERS.length
      set(0)
      if (!go) {
        el.style.transition = "transform 320ms var(--ease-letter)"; el.style.transform = ""
        return
      }
      el.style.transition = "transform 200ms var(--ease-out), opacity 200ms var(--ease-out)"
      el.style.transform = `translateX(${-dir * 110}%) rotate(${-dir * 2}deg)`; el.style.opacity = "0"
      swiped.current = dir
      window.setTimeout(() => { nav(LETTERS[to]); window.scrollTo(0, 0) }, still() ? 0 : 180)
    }
    window.addEventListener("pointerdown", down, { passive: true })
    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up)
    return () => {
      window.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up)
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
