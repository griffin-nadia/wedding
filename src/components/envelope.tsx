import { useEffect, useRef, useState, type ReactNode } from "react"
import { COUPLE } from "@/content/en"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { playPaper } from "@/lib/sound"
import { cn } from "@/lib/utils"

const KEY = "ng-opened"
type Phase = "sealed" | "opening" | "open"

function firstPhase(enabled: boolean): Phase {
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
export function Arrival({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { t } = useLang()
  const { household } = useHousehold()
  const [phase, setPhase] = useState<Phase>(() => firstPhase(enabled))
  const button = useRef<HTMLButtonElement>(null)
  const timer = useRef(0)

  const finish = () => {
    window.clearTimeout(timer.current)
    try { localStorage.setItem(KEY, "1") } catch { /* private mode */ }
    setPhase("open")
    requestAnimationFrame(() => document.getElementById("letter")?.focus({ preventScroll: true }))
  }
  const open = () => {
    if (phase !== "sealed") return finish()
    playPaper()
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
      <div className={cn("arrival", phase === "opening" && "is-opening")}>
        <button ref={button} type="button" onClick={open} aria-label={t.letter.openLabel(first)} className="envelope">
          <span aria-hidden className="envelope-back" />
          <span aria-hidden className="envelope-paper" />
          <span aria-hidden className="envelope-front" />
          <span aria-hidden className="envelope-flap" />
          <span aria-hidden className="envelope-seal">{COUPLE.first[0]}&amp;{COUPLE.second[0]}</span>
        </button>
        <span aria-hidden className="arrival-hint label-caps">{t.letter.open}</span>
      </div>
      {/* The letter is underneath, ready to rise; out of reach until opened */}
      <div className={cn("letter-sealed", phase === "opening" && "letter-rise")} inert>{children}</div>
    </>
  )
}
