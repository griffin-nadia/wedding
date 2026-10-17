import { useEffect } from "react"

// Fields that bring up a keyboard (ticks, choices and buttons don't)
const FIELD = "input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=true]"

/**
 * Phones and tablets: the keyboard never hides what you're typing, and nothing sits on top of it. Android Chrome
 * shrinks the page above the keyboard (interactive-widget=resizes-content in index.html). iOS Safari keeps the page
 * and moves the visual viewport instead, so its height (--vvh) and offset (--vv-top) are written here and the reply
 * sheet sits exactly in what's visible. [data-typing] means the keyboard is really up: a field has focus and the
 * visible height is well short of its full height. Not focus alone: on an iPhone, tapping a chip or a button
 * doesn't take focus from the field, so the keyboard can go while the field keeps focus, and Back / Next must come
 * back then. While typing the dock and the sheet's sticky Back / Next step aside (the pair shows inline at the end
 * of the form instead), and the focused field is scrolled into view. Written in the event itself (a frame later
 * read as a jitter), and only when a value changes.
 */
export function useKeyboardAvoid() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !matchMedia("(pointer: coarse), (max-width: 767px)").matches) return
    const root = document.documentElement
    let h = 0, top = -1, full = 0, wide = innerWidth > innerHeight
    const field = () => { const a = document.activeElement; return a instanceof HTMLElement && a.matches(FIELD) ? a : null }
    const reveal = () => field()?.scrollIntoView({ block: "nearest" })
    // A keyboard takes at least 120px; the browser bar coming and going is about 56
    const typing = () => root.toggleAttribute("data-typing", Boolean(field()) && h < full - 120)
    const apply = () => {
      const nh = Math.round(vv.height), nt = Math.round(vv.offsetTop)
      const turned = (innerWidth > innerHeight) !== wide
      if (turned) { wide = !wide; full = 0 } // a new orientation has its own full height
      full = Math.max(full, nh)
      const resized = nh !== h
      if (resized) { h = nh; root.style.setProperty("--vvh", `${nh}px`) }
      if (nt !== top) { top = nt; root.style.setProperty("--vv-top", `${nt}px`) }
      if (resized) { typing(); reveal() } // the keyboard just opened or closed: say so, and keep the field in view
    }
    const focusIn = () => { if (field()) { typing(); reveal() } }
    // Moving from one field to the next keeps the keyboard up, so wait a tick before saying typing has stopped
    const focusOut = () => setTimeout(typing, 50)
    apply()
    vv.addEventListener("resize", apply)
    vv.addEventListener("scroll", apply, { passive: true })
    document.addEventListener("focusin", focusIn)
    document.addEventListener("focusout", focusOut)
    return () => {
      vv.removeEventListener("resize", apply); vv.removeEventListener("scroll", apply)
      document.removeEventListener("focusin", focusIn); document.removeEventListener("focusout", focusOut)
      root.style.removeProperty("--vvh"); root.style.removeProperty("--vv-top"); root.removeAttribute("data-typing")
    }
  }, [])
}
