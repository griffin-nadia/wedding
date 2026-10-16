import { useEffect } from "react"

// Fields that bring up a keyboard (ticks, choices and buttons don't)
const FIELD = "input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=true]"

/**
 * Phones and tablets: the keyboard never hides what you're typing. Android Chrome shrinks the page above the
 * keyboard (interactive-widget=resizes-content in index.html). iOS Safari keeps the page and moves the visual
 * viewport instead, so its height (--vvh) and offset (--vv-top) are written here and the reply sheet sits exactly
 * in what's visible. Either way the sheet's Back / Next end up on top of the keyboard, the focused field is scrolled
 * to just above them, and the dock steps aside while typing ([data-typing]). The same --vvh keeps the strip above
 * the dock steady while the browser bar collapses. Written in the event itself (a frame later read as a jitter),
 * and only when a value changes.
 */
export function useKeyboardAvoid() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !matchMedia("(pointer: coarse), (max-width: 767px)").matches) return
    const root = document.documentElement
    let h = 0, top = -1
    const field = () => { const a = document.activeElement; return a instanceof HTMLElement && a.matches(FIELD) ? a : null }
    const reveal = () => field()?.scrollIntoView({ block: "nearest" })
    const apply = () => {
      const nh = Math.round(vv.height), nt = Math.round(vv.offsetTop)
      const resized = nh !== h
      if (resized) { h = nh; root.style.setProperty("--vvh", `${nh}px`) }
      if (nt !== top) { top = nt; root.style.setProperty("--vv-top", `${nt}px`) }
      // The keyboard just opened or closed with a field in focus: bring the field back above it
      if (resized) reveal()
    }
    const focusIn = () => { if (field()) { root.setAttribute("data-typing", ""); reveal() } }
    // Moving from one field to the next keeps the keyboard up, so wait a tick before saying typing has stopped
    const focusOut = () => setTimeout(() => { if (!field()) root.removeAttribute("data-typing") }, 50)
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
