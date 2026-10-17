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
 * back then. While typing the dock steps aside, the sheet's Back / Next sit just above the keyboard, and the
 * focused field is scrolled into view above them. Switching between the letter, number and emoji keyboards changes
 * the keyboard's height: while typing the sheet only ever gets shorter (it keeps the shortest height seen), so the
 * layout never shifts back and forth. Written in the event itself (a frame later read as a jitter), and only when a
 * value changes.
 */
export function useKeyboardAvoid() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !matchMedia("(pointer: coarse), (max-width: 767px)").matches) return
    const root = document.documentElement
    let h = 0, top = -1, full = 0, shown = 0, wide = innerWidth > innerHeight
    const field = () => { const a = document.activeElement; return a instanceof HTMLElement && a.matches(FIELD) ? a : null }
    // The field to just above Back / Next, if it's hidden: once the new size is laid out, and again once a keyboard
    // has finished rising (about 300 ms on an iPhone); the second is a no-op when it's already in view
    const show = () => field()?.scrollIntoView({ block: "nearest" })
    const reveal = () => { requestAnimationFrame(show); setTimeout(show, 320) }
    // A keyboard takes at least 120px; the browser bar coming and going is about 56
    const typing = () => root.toggleAttribute("data-typing", Boolean(field()) && h < full - 120)
    const apply = () => {
      const nh = Math.round(vv.height), nt = Math.round(vv.offsetTop)
      const turned = (innerWidth > innerHeight) !== wide
      if (turned) { wide = !wide; full = 0 } // a new orientation has its own full height
      full = Math.max(full, nh)
      const resized = nh !== h
      if (nt !== top) { top = nt; root.style.setProperty("--vv-top", `${nt}px`) }
      if (resized) {
        h = nh; typing() // the keyboard just opened, closed or changed: say so
        const next = root.hasAttribute("data-typing") && shown ? Math.min(shown, nh) : nh
        if (next !== shown) { shown = next; root.style.setProperty("--vvh", `${next}px`) }
        reveal() // and keep the field in view
      }
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
