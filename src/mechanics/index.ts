/**
 * Mechanics from the kits (v3 U, .brief/mechanics-review.md and mechanics-more.md), each an Options switch, off by
 * default. This file loads only when at least one is on, so none of it touches the first screen. Every handler
 * checks its switch when it fires, so turning one off in Options stops it at once; the looks live in index.css
 * under :root[data-opt-<key>]. All of them stand still under reduced motion.
 */
const root = document.documentElement
const on = (key: string) => root.hasAttribute(`data-opt-${key}`)
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches
const mouse = () => matchMedia("(hover: hover) and (pointer: fine)").matches

let installed = false
export function install() {
  if (installed) return
  installed = true

  // Arrival · a pool of lantern light follows the cursor over the photo (desktop)
  addEventListener("pointermove", (e) => {
    if (!on("glow") || e.pointerType !== "mouse" || !root.hasAttribute("data-sealed")) return
    root.style.setProperty("--glow-x", `${e.clientX}px`); root.style.setProperty("--glow-y", `${e.clientY}px`)
    // The N&G seal catches the light too: a sheen that moves with the cursor across the envelope
    const env = document.querySelector<HTMLElement>(".arrival .envelope")
    if (env) { const r = env.getBoundingClientRect(); env.style.setProperty("--sheen", `${Math.round(((e.clientX - r.left) / r.width) * 100)}%`) }
  }, { passive: true })

  // Home · the letter's lines settle from a 2px blur, 40 ms apart, like ink drying; once per session
  const settle = () => {
    if (!on("inkset") || still()) return
    try { if (sessionStorage.getItem("ng-inkset")) return } catch { /* fine */ }
    const body = document.querySelector<HTMLElement>("#letter .letter-body")
    if (!body || !body.children.length) return
    ;[...body.querySelectorAll<HTMLElement>(":scope > *, :scope > * > *")].forEach((el, i) => el.style.setProperty("--ink-i", String(Math.min(i, 14))))
    root.setAttribute("data-inking", "")
    setTimeout(() => root.removeAttribute("data-inking"), 1400)
    try { sessionStorage.setItem("ng-inkset", "1") } catch { /* fine */ }
  }

  // Home · the days box counts down from three more to the real number, once on open
  const countIn = () => {
    if (!on("countin") || still()) return
    try { if (sessionStorage.getItem("ng-countin")) return } catch { /* fine */ }
    const num = document.querySelector<HTMLElement>(".count-box:first-child .count-box-num")
    if (!num) return
    const real = num.textContent ?? "", n = Number(real)
    if (!Number.isFinite(n)) return
    try { sessionStorage.setItem("ng-countin", "1") } catch { /* fine */ }
    ;[3, 2, 1, 0].forEach((k, i) => setTimeout(() => { if (num.isConnected) num.textContent = k ? String(n + k) : real }, 200 + i * 220))
  }

  // The day · the line trails the reader a little, like a thread being pulled (replaces the scroll-linked fill)
  let thread = 0, target = 0, raf = 0
  const pull = () => {
    raf = 0
    const ol = document.querySelector<HTMLElement>(".timeline")
    if (!on("thread") || !ol) return
    const r = ol.getBoundingClientRect()
    target = Math.max(0, Math.min(1, (innerHeight * 0.7 - r.top) / Math.max(1, r.height)))
    if (r.bottom <= innerHeight) target = 1 // the line always finishes at the bottom of the page
    thread += (target - thread) * (still() ? 1 : 0.12)
    ol.style.setProperty("--thread", thread.toFixed(4))
    if (Math.abs(target - thread) > 0.001) raf = requestAnimationFrame(pull)
  }
  addEventListener("scroll", () => { if (!raf && on("thread")) raf = requestAnimationFrame(pull) }, { passive: true })

  // Our story · hover a stop and its print rises beside it, tilted 2°, from the side the cursor came from (desktop)
  document.addEventListener("pointerover", (e) => {
    const stop = (e.target as Element).closest?.(".journey-stop")
    if (!on("hoverprint") || !mouse() || !stop) return
    const map = stop.closest(".journey") as HTMLElement | null
    if (!map) return
    let print = map.querySelector<HTMLElement>(".journey-print")
    if (!print) { print = document.createElement("div"); print.className = "journey-print"; print.setAttribute("aria-hidden", "true"); map.style.position = "relative"; map.append(print) }
    const s = stop.getBoundingClientRect(), m = map.getBoundingClientRect()
    print.textContent = stop.getAttribute("aria-label")
    print.dataset.from = (e as PointerEvent).clientX < s.left + s.width / 2 ? "left" : "right"
    print.style.left = `${Math.min(m.width - 168, Math.max(0, s.left - m.left + s.width / 2 - 80))}px`
    print.style.top = `${Math.max(0, s.top - m.top - 116)}px`
    print.classList.remove("is-up"); void print.offsetWidth; print.classList.add("is-up")
  })
  document.addEventListener("pointerout", (e) => {
    if (!(e.target as Element).closest?.(".journey-stop")) return
    document.querySelector(".journey-print")?.classList.remove("is-up")
  })

  // Phones · a tiny tick (Android; iOS has no vibration and nothing happens) when the envelope opens and the hanko lands
  const buzz = (ms = 8) => { if (on("haptics") && !still()) navigator.vibrate?.(ms) }
  document.addEventListener("click", (e) => { if ((e.target as Element).closest?.(".arrival .envelope")) buzz(10) })
  new MutationObserver((list) => {
    for (const m of list) for (const n of m.addedNodes) if (n instanceof Element && (n.matches(".hanko") || n.querySelector(".hanko"))) { setTimeout(() => buzz(14), 380); return }
  }).observe(document.body, { childList: true, subtree: true })

  // Run the once-per-open ones whenever the letter appears (after the envelope, or on a page change)
  const kick = () => requestAnimationFrame(() => { settle(); countIn(); pull() })
  new MutationObserver((list) => {
    if (list.some((m) => [...m.addedNodes].some((n) => n instanceof Element && (n.matches(".letter-body, .letter") || n.querySelector(".letter-body"))))) kick()
  }).observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true })
  addEventListener("ng-tune", kick)
  kick()
}
