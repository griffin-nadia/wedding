import { ART } from "@/lib/art"
import { BrandSeal } from "@/components/brand-seal"
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react"
import { COUPLE } from "@/content/en"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"
import { useOption } from "@/lib/options"

const KEY = "ng-opened"
// The handwritten "open your invite" (only on a first visit, so it loads beside the envelope, not with the site)
const ArrivalNote = lazy(() => import("@/components/arrival-note"))
// The loupe over the painted envelope (Options → Arrival), only when switched on
const EnvelopeLoupe = lazy(() => import("@/components/envelope-loupe"))
type Phase = "sealed" | "opening" | "open"

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

/**
 * Arrival, first visit only (per device): a sealed envelope on the scene, "Tap to open".
 * Tap, Enter or Space: the flap opens (300 ms), the letter rises (600 ms), the envelope sinks and fades.
 * Any key skips. Reduced motion: the letter is just there.
 */
/** Put the letter back in the envelope (v3 S): the next render shows it sealed again, even under reduced motion. */
export function resetArrival() { try { localStorage.removeItem(KEY) } catch { /* fine */ } }

/** One of Nadia's two drawn envelopes, at the size the envelope renders (410 on laptops, 260 on phones). */
function DrawnEnvelope({ which }: { which: "closed" | "open" }) {
  const b = `${import.meta.env.BASE_URL}${ART.drawnEnvelope[which]}`
  const set = (fmt: string) => ART.drawnEnvelope.widths.map((w) => `${b}-${w}.${fmt} ${w}w`).join(", ")
  const sizes = "(min-width: 768px) 410px, 260px"
  return (
    <picture className="contents">
      <source type="image/avif" sizes={sizes} srcSet={set("avif")} />
      <img aria-hidden alt="" sizes={sizes} srcSet={set("webp")} src={`${b}-760.webp`} className={`envelope-drawn is-${which}`}
        decoding="async" fetchPriority={which === "closed" ? "high" : "low"} draggable={false} />
    </picture>
  )
}

export function Arrival({ enabled, onOpened, children, sealedAgain = false }: { enabled: boolean; onOpened?: () => void; children: ReactNode; sealedAgain?: boolean }) {
  const { t } = useLang()
  const { household } = useHousehold()
  const [phase, setPhase] = useState<Phase>(() => (sealedAgain && enabled ? "sealed" : firstPhase(enabled)))
  const button = useRef<HTMLButtonElement>(null)
  const hint = useOption("arrivalhint")
  // Nadia's painted envelope (a placeholder until her scan), its colour bleeding in, and a loupe to lean in on it
  // Real painting (ART.envelope): on for everyone unless crew switch it off. Placeholder: crew-only preview.
  const drawn = useOption("envart") !== "off" // Nadia's drawn envelope (6 Oct scan), closed then open
  const envOpt = useOption("envpaint")
  const painted = ART.envelope ? envOpt !== "off" : envOpt === "on"
  const loupeOn = useOption("loupe") === "on"
  const loupe = painted && loupeOn
  const stage = useRef<HTMLDivElement>(null)
  // Pull to open (v3 K): drag the flap up and it follows the finger; let go past 40% and it opens,
  // otherwise it springs back. A tap still opens it.
  const drag = useRef<{ y: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)
  const setPull = (v: number) => stage.current?.style.setProperty("--pull", String(v))
  const onDown = (e: React.PointerEvent) => { if (phase !== "sealed") return; drag.current = { y: e.clientY, moved: false }; stage.current?.classList.add("is-pulling") }
  const onMove = (e: React.PointerEvent) => {
    // Tilt toward a mouse (v3 T, Options → Arrival): a few degrees, like a card on a table
    if (e.pointerType === "mouse" && !drag.current && stage.current) { stage.current.style.setProperty("--tx", (e.clientX / innerWidth - 0.5).toFixed(3)); stage.current.style.setProperty("--ty", (e.clientY / innerHeight - 0.5).toFixed(3)) }
    const d = drag.current; if (!d) return
    if (stage.current?.hasAttribute("data-loupe")) return // holding the loupe, not pulling
    const dy = d.y - e.clientY
    if (Math.abs(dy) > 6) { d.moved = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId) }
    setPull(Math.max(0, Math.min(1, dy / 140)))
  }
  const onUp = () => {
    const d = drag.current; drag.current = null
    stage.current?.classList.remove("is-pulling")
    if (stage.current?.hasAttribute("data-loupe")) { suppressClick.current = true; setPull(0); return } // letting go of the loupe doesn't open it
    if (!d?.moved) return
    suppressClick.current = true // the click that follows a drag isn't a tap
    const p = Number(stage.current?.style.getPropertyValue("--pull") || 0)
    if (p > 0.4) open(); else setPull(0)
  }
  const noren = useOption("arrival") === "noren"
  const timer = useRef(0)

  const finish = () => {
    window.clearTimeout(timer.current)
    try { localStorage.setItem(KEY, "1") } catch { /* private mode */ }
    setPhase("open")
    onOpened?.()
    requestAnimationFrame(() => document.getElementById("letter")?.focus({ preventScroll: true }))
  }
  const open = () => {
    if (phase !== "sealed") return finish()
    setPhase("opening")
    timer.current = window.setTimeout(finish, 900)
  }

  useEffect(() => {
    if (phase === "open") return
    button.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions)
    // Any key skips (Enter and Space open through the button itself)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Tab" || e.key === "Shift") return
      finish()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (phase === "open" || !enabled) return <>{children}</>
  const first = household?.guests.filter((g) => !g.plusOne).map((g) => g.firstName).join(" & ") ?? ""
  return (
    <>
      <div ref={stage} className={cn("arrival", phase === "opening" && "is-opening")} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {noren ? (
          // Options lab: a noren curtain that parts instead of an envelope
          <button ref={button} type="button" onClick={open} aria-label={t.letter.openLabel(first)} className="noren">
            <span aria-hidden className="noren-rod" />
            <span aria-hidden className="noren-panel noren-left"><span>{COUPLE.first[0]}</span></span>
            <span aria-hidden className="noren-panel noren-right"><span>{COUPLE.second[0]}</span></span>
          </button>
        ) : (
          <button ref={button} type="button" onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } open() }} aria-label={t.letter.openLabel(first)} className={cn("envelope paper", drawn && "is-drawn")}>
            <span aria-hidden className="envelope-back" />
            <span aria-hidden className="envelope-paper" />
            <span aria-hidden className="envelope-front" />
            {painted && <><span aria-hidden className="envelope-pencil" /><span aria-hidden className="envelope-paint" /></>}
            <span aria-hidden className="envelope-flap" />
            <span aria-hidden className="envelope-seal"><BrandSeal className="size-full" /></span>
            {drawn && <><DrawnEnvelope which="open" /><DrawnEnvelope which="closed" /></>}
          </button>
        )}
        {loupe && !noren && phase === "sealed" && <Suspense><EnvelopeLoupe envelope={button} stage={stage} /></Suspense>}
        {hint === "pill" || noren
          ? <span aria-hidden className="arrival-hint label-caps">{t.letter.open}</span>
          : phase === "sealed" && <Suspense><ArrivalNote envelope={button} /></Suspense>}
      </div>
      {/* The letter is underneath, ready to rise; out of reach until opened */}
      <div className={cn("letter-sealed", phase === "opening" && "letter-rise")} inert>{children}</div>
    </>
  )
}
