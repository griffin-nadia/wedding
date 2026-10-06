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

  // Home · the days box counts down from three more to the real number. It plays when the site is opened or
  // refreshed (this flag lives as long as the page does), or when you come back to the tab after 5+ minutes away,
  // never on a page change inside the site.
  let countDue = true, hiddenAt = 0
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hiddenAt = Date.now()
    else if (hiddenAt && Date.now() - hiddenAt >= 5 * 60_000) { countDue = true; countIn() }
  })
  const countIn = () => {
    if (!on("countin") || still() || !countDue) return
    const num = document.querySelector<HTMLElement>(".count-box:first-child .count-box-num")
    if (!num) return
    const real = num.textContent ?? "", n = Number(real)
    if (!Number.isFinite(n)) return
    countDue = false
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
    // the line always finishes: once its end is on screen, or when the page can't scroll any further
    if (r.bottom <= innerHeight || scrollY + innerHeight >= document.documentElement.scrollHeight - 2) target = 1
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

  // Theme · sections rise in as they scroll into view (below the fold only; what's already on screen never moves)
  let riseIO: IntersectionObserver | null = null
  const rise = () => {
    riseIO?.disconnect(); riseIO = null
    const body = document.querySelector<HTMLElement>("#letter .letter-body")
    if (!on("rise") || !body) { document.querySelectorAll("[data-rise]").forEach((el) => el.removeAttribute("data-rise")); return }
    const blocks = [...body.children] as HTMLElement[]
    if (still()) { blocks.forEach((el) => el.setAttribute("data-rise", "in")); return }
    let queued = 0
    blocks.forEach((el) => { el.setAttribute("data-rise", el.getBoundingClientRect().top < innerHeight ? "in" : "") })
    riseIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return
        const el = en.target as HTMLElement
        el.style.setProperty("--rise-delay", `${Math.min(queued++ * 60, 240)}ms`)
        el.setAttribute("data-rise", "in"); riseIO?.unobserve(el)
      })
      setTimeout(() => { queued = 0 }, 300)
    }, { rootMargin: "0px 0px -8% 0px" })
    blocks.filter((el) => el.getAttribute("data-rise") === "").forEach((el) => riseIO!.observe(el))
  }

  // Theme · the dock steps aside while scrolling down (phones), back on scroll up or when the scrolling stops
  let lastY = scrollY, awayTimer = 0
  addEventListener("scroll", () => {
    if (!on("dockhide") || still() || innerWidth > 767) { root.removeAttribute("data-dock-away"); return }
    const y = scrollY, dy = y - lastY; lastY = y
    const max = document.documentElement.scrollHeight - innerHeight
    if (dy > 4 && y > 80 && y < max - 40) root.setAttribute("data-dock-away", "")
    else if (dy < -2 || y <= 80 || y >= max - 40) root.removeAttribute("data-dock-away")
    clearTimeout(awayTimer); awayTimer = window.setTimeout(() => root.removeAttribute("data-dock-away"), 900)
  }, { passive: true })

  // Run the once-per-open ones whenever the letter appears (after the envelope, or on a page change)
  const kick = () => requestAnimationFrame(() => { settle(); countIn(); pull(); rise() })
  new MutationObserver((list) => {
    if (list.some((m) => [...m.addedNodes].some((n) => n instanceof Element && (n.matches(".letter-body, .letter") || n.querySelector(".letter-body"))))) kick()
  }).observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true })
  addEventListener("ng-tune", kick)
  kick()
}
