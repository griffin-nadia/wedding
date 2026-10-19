import { ART } from "@/lib/art"
import { nextFrame } from "@/lib/frame"
import { BrandSeal } from "@/components/brand-seal"
import { NamesArt } from "@/components/names-art"
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

const KEY = "ng-opened"
// The hand-lettered "Open your invite" (only while sealed, so it loads beside the envelope, not with the site)
const ArrivalNote = lazy(() => import("@/components/arrival-note"))
type Phase = "sealed" | "opening" | "open" | "sealing"

export function firstPhase(enabled: boolean): Phase {
  if (!enabled) return "open"
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "open"
    if (new URLSearchParams(location.search).get("rsvp") === "1") return "open"
    return localStorage.getItem(KEY) ? "open" : "sealed"
  } catch {
    return "open"
  }
}

/** Put the letter back in the envelope (v3 S): the next render shows it sealed again, even under reduced motion. */
export function resetArrival() { try { localStorage.removeItem(KEY) } catch { /* fine */ } }

/**
 * The two journeys (run 19), one clear step at a time on one clock, so nothing cross-fades over anything else.
 * Sealing: the card's words fade out, the card shrinks into the letter, the letter slides into the envelope, the
 * flap closes, the seal presses on; then the envelope floats again. Opening is the same played back: the flap opens,
 * the letter slides out, it grows into the card, the card's words fade in.
 */
const STEP = { words: 150, sheet: 450, slide: 400, flap: 250, press: 250 }
// The open drawing is the closed one plus its open flap above it: the flap is this much of the open drawing's height
const FLAP = 1 - 588 / 952
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)", EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)"

/** Nadia's drawn envelope, closed or one of the open one's two layers, at the size it renders (410 on laptops, 260 on
 *  phones). Stacked: the open back, the letter, the open front (the pocket and seal), then the closed one on top. */
function DrawnEnvelope({ which }: { which: "closed" | "open" | "openFront" }) {
  const b = `${import.meta.env.BASE_URL}${ART.drawnEnvelope[which]}`
  const set = (fmt: string) => ART.drawnEnvelope.widths.map((w) => `${b}-${w}.${fmt} ${w}w`).join(", ")
  const sizes = "(min-width: 768px) 410px, 260px"
  return (
    <picture className="contents">
      <source type="image/avif" sizes={sizes} srcSet={set("avif")} />
      <img aria-hidden alt="" sizes={sizes} srcSet={set("webp")} src={`${b}-820.webp`} className={`envelope-drawn is-${which === "openFront" ? "front" : which}`}
        decoding="async" fetchPriority={which === "closed" ? "high" : "low"} draggable={false} />
    </picture>
  )
}

/** Her wax seal on its own, laid exactly over the painted one on the closed envelope: it presses on at the end of a seal. */
function PressSeal() {
  const b = `${import.meta.env.BASE_URL}${ART.seal.src}`
  return <img aria-hidden alt="" className="envelope-press" src={`${b}-128.webp`} srcSet={ART.seal.widths.map((w) => `${b}-${w}.webp ${w}w`).join(", ")} sizes="64px" draggable={false} />
}

export function Arrival({ enabled, onOpened, children, reseal = 0 }: { enabled: boolean; onOpened?: () => void; children: ReactNode; reseal?: number }) {
  const { t } = useLang()
  const { household } = useHousehold()
  const [phase, setPhase] = useState<Phase>(() => firstPhase(enabled))
  const button = useRef<HTMLButtonElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLSpanElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const anims = useRef<Animation[]>([])
  // Pull to open (v3 K): drag the flap up and it follows the finger; let go past 40% and it opens,
  // otherwise it springs back. A tap still opens it.
  const drag = useRef<{ y: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const setPull = (v: number) => stage.current?.style.setProperty("--pull", String(v))
  const onDown = (e: React.PointerEvent) => { if (phase !== "sealed") return; drag.current = { y: e.clientY, moved: false }; stage.current?.classList.add("is-pulling") }
  const onMove = (e: React.PointerEvent) => {
    // Tilt toward a mouse (v3 T): a few degrees, like a card on a table
    if (e.pointerType === "mouse" && !drag.current && stage.current) { stage.current.style.setProperty("--tx", (e.clientX / innerWidth - 0.5).toFixed(3)); stage.current.style.setProperty("--ty", (e.clientY / innerHeight - 0.5).toFixed(3)) }
    const d = drag.current; if (!d) return
    const dy = d.y - e.clientY
    if (Math.abs(dy) > 6) { d.moved = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId) }
    setPull(Math.max(0, Math.min(1, dy / 140)))
  }
  const onUp = () => {
    const d = drag.current; drag.current = null
    stage.current?.classList.remove("is-pulling")
    if (!d?.moved) return
    suppressClick.current = true // the click that follows a drag isn't a tap
    const p = Number(stage.current?.style.getPropertyValue("--pull") || 0)
    if (p > 0.4) open(); else setPull(0)
  }

  const stop = () => { for (const a of anims.current) a.cancel(); anims.current = [] }
  // A journey's last frame is held until React has drawn what comes next, then let go (no frame in between)
  const finish = () => {
    try { localStorage.setItem(KEY, "1") } catch { /* private mode */ }
    setPhase("open")
    onOpened?.()
    nextFrame(() => document.getElementById("letter")?.focus({ preventScroll: true }))
  }
  const sealed = () => setPhase("sealed")
  const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

  /** Every part of a journey, made at once on one clock (so a test can hold it at any point), then `done` once all end. */
  const play = (parts: [Element | null | undefined, Keyframe[], number, number, string?, FillMode?][], done: () => void) => {
    stop()
    anims.current = parts.filter(([el]) => el).map(([el, frames, delay, duration, easing = EASE, fill = "both"]) => el!.animate(frames, { delay, duration, easing, fill }))
    const mine = anims.current
    Promise.all(mine.map((a) => a.finished)).then(() => { if (anims.current === mine) done() }, () => { /* cancelled: skipped */ })
  }
  /** Where things are: the envelope's letter at rest and pulled clear out of the pocket (just above its mouth), and the card */
  const geometry = () => {
    const env = button.current!.getBoundingClientRect(), paper = button.current!.querySelector<HTMLElement>(".envelope-paper")!
    const rest = new DOMRect(env.left + paper.offsetLeft, env.top + paper.offsetTop, paper.offsetWidth, paper.offsetHeight)
    const lift = rest.bottom - env.top + 2
    const box = card.current?.querySelector<HTMLElement>(".letter")?.getBoundingClientRect() ?? rest
    const radius = card.current?.querySelector<HTMLElement>(".letter") ? getComputedStyle(card.current.querySelector(".letter")!).borderRadius : "16px"
    return { out: new DOMRect(rest.left, rest.top - lift, rest.width, rest.height), lift, box, radius, small: getComputedStyle(paper).borderRadius }
  }
  const rect = (r: DOMRect, radius: string): Keyframe => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: radius, opacity: 1 })
  const pick = (s: string) => button.current?.querySelector(s)

  const open = () => {
    if (phase !== "sealed") return finish()
    if (still()) return finish()
    // A tiny tick as the flap opens, Android only (iPhones have no vibrate)
    navigator.vibrate?.(8)
    setPull(0)
    setPhase("opening")
    const g = geometry(), s = STEP
    const t1 = s.flap, t2 = t1 + s.slide, t3 = t2 + s.sheet
    play([
      // 1. The flap opens: the closed flap folds up from its tip while the open one rises behind it
      [pick(".is-closed"), [{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(0 0 100% 0)" }], 0, s.flap, EASE_IN_OUT],
      [pick(".is-open"), [{ opacity: 1, clipPath: `inset(${FLAP * 100}% 0 0 0)` }, { opacity: 1, clipPath: "inset(0 0 0 0)" }], 0, s.flap, EASE_IN_OUT],
      [pick(".is-front"), [{ opacity: 1 }, { opacity: 1 }], 0, t2],
      // 2. The letter slides up out of the pocket, between the back and the front (it's there from the start, inside)
      [pick(".envelope-paper"), [{ opacity: 1 }, { opacity: 1 }], 0, t2, "linear", "none"],
      [pick(".envelope-paper"), [{ transform: "translateY(0)" }, { transform: `translateY(${-g.lift}px)` }], t1, s.slide],
      // 3. It grows into the card (the same paper all the way) as the envelope goes, under it, before any words show
      [sheet.current, [rect(g.out, g.small), rect(g.box, g.radius)], t2, s.sheet, EASE, "none"],
      [stage.current?.querySelector(".envelope-float"), [{ opacity: 1 }, { opacity: 0 }], t2, s.sheet * 0.6, "linear"],
      // 4. The card is there; its words fade in
      [card.current, [{ opacity: 1 }, { opacity: 1 }], t3, s.words, "linear", "forwards"],
      [card.current?.querySelector(".letter-scroll"), [{ opacity: 0 }, { opacity: 1 }], t3, s.words, "linear"],
    ], finish)
  }

  // "Seal it again" (Home): the whole journey back, then it floats, sealed, as on a first visit
  useEffect(() => {
    if (!reseal || !enabled) return
    if (still()) { setPhase("sealed"); return }
    setPhase("sealing")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reseal])
  // Before paint, so the first frame of the seal is still the open card
  useLayoutEffect(() => {
    if (phase === "open" || phase === "sealed") stop()
    if (phase !== "sealing" || !button.current) return
    const g = geometry(), s = STEP
    const t1 = s.words, t2 = t1 + s.sheet, t3 = t2 + s.slide, t4 = t3 + s.flap
    play([
      // 1. The card's words fade out, quickly
      [card.current?.querySelector(".letter-scroll"), [{ opacity: 1 }, { opacity: 0 }], 0, s.words, "linear"],
      [card.current, [{ opacity: 1 }, { opacity: 1 }], 0, t1, "linear", "none"],
      // 2. The card shrinks into the letter, out above the open envelope, which comes back under it
      [sheet.current, [rect(g.box, g.radius), rect(g.out, g.small)], t1, s.sheet, EASE, "none"],
      [stage.current?.querySelector(".envelope-float"), [{ opacity: 0 }, { opacity: 1 }], t1, s.sheet * 0.4, "linear"],
      [pick(".is-open"), [{ opacity: 1 }, { opacity: 1 }], 0, t4, "linear", "none"],
      [pick(".is-front"), [{ opacity: 1 }, { opacity: 1 }], 0, t4, "linear", "none"],
      // 3. The letter slides down into the pocket, between the back and the front
      [pick(".envelope-paper"), [{ opacity: 1 }, { opacity: 1 }], t2, t4 - t2, "linear", "none"],
      [pick(".envelope-paper"), [{ transform: `translateY(${-g.lift}px)` }, { transform: "translateY(0)" }], t2, s.slide, EASE_IN_OUT],
      // 4. The flap closes: the open flap folds down and the closed one comes down over the pocket from the fold
      [pick(".is-open"), [{ clipPath: "inset(0 0 0 0)" }, { clipPath: `inset(${FLAP * 100}% 0 0 0)` }], t3, s.flap, EASE_IN_OUT],
      [pick(".is-closed"), [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], t3, s.flap, EASE_IN_OUT],
      // 5. The seal presses on: her wax seal comes down onto the painted one, squashes a touch and settles
      [pick(".envelope-press"), [{ opacity: 0, transform: "scale(1.4)" }, { opacity: 1, transform: "scale(0.94)", offset: 0.7 }, { opacity: 1, transform: "scale(1)" }], t4, s.press, EASE, "none"],
      [button.current, [{ translate: "0 0" }, { translate: "0 3px", offset: 0.7 }, { translate: "0 0" }], t4, s.press, EASE, "none"],
    ], sealed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase === "open") return
    if (phase === "sealed") button.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
    // Any key skips (Enter and Space open through the button itself)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Tab" || e.key === "Shift") return
      if (phase === "sealing") sealed(); else finish()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])
  useEffect(() => () => stop(), [])

  const arrival = enabled && phase !== "open"
  const first = household?.guests.filter((g) => !g.plusOne).map((g) => g.firstName).join(" & ") ?? ""
  return (
    <>
      {/* No long-press menu (save image, share) anywhere on it: a hold is the start of a pull, not a request for the picture */}
      {arrival && <div ref={stage} className={cn("arrival", phase === "opening" && "is-opening", phase === "sealing" && "is-sealing")} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={(e) => e.preventDefault()}>
        <div className="arrival-stack">
        {/* Floats: a slow bob and tilt with a breathing shadow, paused where it is the moment it opens */}
        <div className="envelope-float">
        {/* Nadia's painted envelope: closed (17 Oct), then her open envelope (18 Oct) as the letter comes out of it, from
            between its back and its pocket, her lettering on it */}
        <button ref={button} type="button" onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } open() }} aria-label={t.letter.openLabel(first)} className="envelope paper is-drawn"
          style={{ ["--drawn-mask" as string]: `url(${import.meta.env.BASE_URL}${ART.drawnEnvelope.closed}-410.webp)`, ["--drawn-ratio" as string]: String(ART.drawnEnvelope.ratio) }}>
          <span aria-hidden className="envelope-back" />
          <span aria-hidden className="envelope-paper"><NamesArt className="envelope-names" /></span>
          <span aria-hidden className="envelope-front" />
          <span aria-hidden className="envelope-flap" />
          <span aria-hidden className="envelope-seal"><BrandSeal className="size-full" /></span>
          <DrawnEnvelope which="open" /><DrawnEnvelope which="openFront" /><DrawnEnvelope which="closed" /><PressSeal />
        </button>
        </div>
        </div>
        {phase === "sealed" && <Suspense><ArrivalNote envelope={button} /></Suspense>}
        {/* The card on its way into or out of the envelope's letter: the same paper, one sheet */}
        <span ref={sheet} aria-hidden className="arrival-sheet" />
      </div>}
      {/* The letter is underneath, ready to come out; out of reach until opened. Open, the wrapper has no box of its
          own (display: contents), so the card lays out exactly as before, and sealing it again never remounts it. */}
      <div ref={card} className={arrival ? "letter-sealed" : "letter-stage"} inert={arrival || undefined}>{children}</div>
    </>
  )
}
