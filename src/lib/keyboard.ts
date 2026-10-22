import { useEffect } from "react"

// Fields that bring up a keyboard (ticks, choices and buttons don't)
const FIELD = "input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=true]"

type VK = { overlaysContent: boolean; boundingRect: DOMRect; addEventListener: (t: "geometrychange", f: () => void) => void; removeEventListener: (t: "geometrychange", f: () => void) => void }

/**
 * Phones and tablets (18g): the keyboard never shrinks anything. It overlays the page (interactive-widget=
 * overlays-content in index.html, and the VirtualKeyboard API's overlaysContent where there is one, Android Chrome);
 * iOS Safari overlays already. The card's frame, the photo, the bar, the dock and the sheets keep their keyboard-down
 * size (they're sized in svh, never by the visible area). Room is made inside instead:
 * - --kb is how much of the screen the keyboard covers; the scrolling card and the sheet's body get that much extra
 *   bottom padding while typing, so anything can scroll above it;
 * - the sheet's sticky Back / Next lift just above the keyboard (--kb-lift, a transform: nothing reflows);
 * - the focused field, with its helper or error, is scrolled to sit just above the keyboard (and above Back / Next).
 * Closing the keyboard drops the padding and the lift, back where they were. [data-typing] means the keyboard is
 * really up: a field has focus and the keyboard covers more than 120px. --vv-top still follows iOS's panning, so the
 * sheet's top stays where the guest sees it.
 */
export function useKeyboardAvoid() {
  useEffect(() => {
    const vk = (navigator as Navigator & { virtualKeyboard?: VK }).virtualKeyboard
    if (vk) vk.overlaysContent = true
    const vv = window.visualViewport
    if (!vv || !matchMedia("(pointer: coarse), (max-width: 767px)").matches) return
    const root = document.documentElement
    let kb = -1, top = -1, lift = -1
    const field = () => { const a = document.activeElement; return a instanceof HTMLElement && a.matches(FIELD) ? a : null }
    // Where the keyboard's top edge is, in the page's own coordinates
    const keyTop = () => (vk && vk.boundingRect.height > 0 ? innerHeight - vk.boundingRect.height : vv.offsetTop + vv.height)
    const set = (name: string, v: number) => root.style.setProperty(name, `${v}px`)
    /** The field, its helper or error, to just above the keyboard (and Back / Next), inside whatever scrolls it */
    const show = () => {
      const f = field()
      if (!f || kb < 120) return
      const box = f.closest<HTMLElement>(".form-field, .combo-field, .inline-submit") ?? f
      const scroller = f.closest<HTMLElement>(".sheet-body, .letter-scroll")
      if (!scroller) return
      const footer = f.closest(".sheet")?.querySelector<HTMLElement>(".rsvp-actions")
      const limit = keyTop() - (footer ? footer.offsetHeight : 0) - 12
      const r = box.getBoundingClientRect(), s = scroller.getBoundingClientRect()
      if (r.bottom > limit) scroller.scrollBy({ top: r.bottom - limit, behavior: "instant" })
      else if (r.top < s.top + 8) scroller.scrollBy({ top: r.top - s.top - 8, behavior: "instant" })
    }
    const reveal = () => { requestAnimationFrame(show); setTimeout(show, 320) } // now, and once a keyboard has finished rising
    const apply = () => {
      const covered = Math.max(0, Math.round(innerHeight - keyTop()))
      if (covered !== kb) { kb = covered; set("--kb", covered) }
      const nt = Math.round(vv.offsetTop)
      if (nt !== top) { top = nt; set("--vv-top", nt) }
      // The sheet's Back / Next: lifted by however much of them the keyboard covers (run 25: measured from the footer
      // itself, less the lift it already has, since the reply sheet's own box changes size as typing starts)
      const foot = document.querySelector<HTMLElement>(".sheet .rsvp-actions")
      const l = foot ? Math.max(0, Math.round(foot.getBoundingClientRect().bottom + (root.hasAttribute("data-typing") ? Math.max(0, lift) : 0) - keyTop())) : 0
      if (l !== lift) { lift = l; set("--kb-lift", l) }
      const typing = Boolean(field()) && kb >= 120
      if (typing !== root.hasAttribute("data-typing")) {
        // A card that's only as tall as what's on it (Home, the no-invite letter) keeps the height it had, so the
        // extra room scrolls inside it instead of making it taller
        const card = document.querySelector<HTMLElement>(".letter:not(.sheet)")
        if (card) card.style.height = typing ? `${card.offsetHeight}px` : ""
        root.toggleAttribute("data-typing", typing)
        // Run 25: the reply sheet changes size as typing starts or stops (it fits its content otherwise), so the lift
        // is measured again once that has laid out
        requestAnimationFrame(apply); window.setTimeout(apply, 200)
      }
      reveal()
    }
    const focusIn = () => { if (field()) apply() }
    // Moving from one field to the next keeps the keyboard up, so wait a tick before saying typing has stopped
    const focusOut = () => setTimeout(apply, 50)
    apply()
    vv.addEventListener("resize", apply)
    vv.addEventListener("scroll", apply, { passive: true })
    vk?.addEventListener("geometrychange", apply)
    document.addEventListener("focusin", focusIn)
    document.addEventListener("focusout", focusOut)
    return () => {
      vv.removeEventListener("resize", apply); vv.removeEventListener("scroll", apply); vk?.removeEventListener("geometrychange", apply)
      document.removeEventListener("focusin", focusIn); document.removeEventListener("focusout", focusOut)
      for (const p of ["--kb", "--vv-top", "--kb-lift"]) root.style.removeProperty(p)
      root.removeAttribute("data-typing")
    }
  }, [])
}
