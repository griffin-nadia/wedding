import { useEffect, useRef, useState } from "react"
import { motion, useAnimate } from "motion/react"
import { Box, SlipWords, useFortune } from "@/components/fortune-card"
import { canShake, drawnKey, saveFortune } from "@/lib/fortune"
import { useLang } from "@/lib/lang"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Springs, not keyframes (Options → Fortune → Springs): the tin is flicked and rings down on its own spring,
// the stick rises with a little overshoot, then the slip drops open from the top and settles.
const SHAKE = { type: "spring", velocity: 520, stiffness: 700, damping: 10, restDelta: 1, restSpeed: 12 } as const
const RISE = { type: "spring", stiffness: 380, damping: 16, restDelta: 0.5, restSpeed: 8 } as const
const UNFOLD = { type: "spring", stiffness: 210, damping: 22, mass: 0.9 } as const

/**
 * The omikuji with Motion springs. Tap the tin (or "Draw one") first; a shake draws it too on Android, where a
 * page can read one without asking. Reduced motion: the slip is already open, no tin. Return visits open on the
 * slip. "See your line on the map" shows only where there's a map to show (onMap).
 */
export default function FortuneSpring({ token, className, onMap }: { token: string; className?: string; onMap?: () => void }) {
  const { t } = useLang()
  const { i, of, text, drawn } = useFortune(token)
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const [state, setState] = useState<"closed" | "drawing" | "open">(() => {
    if (still) return "open"
    try { return localStorage.getItem(drawnKey(token)) ? "open" : "closed" } catch { return "closed" }
  })
  const [scope, animate] = useAnimate<HTMLButtonElement>()
  const slip = useRef<HTMLDivElement>(null)
  const shaky = useRef(canShake())
  const [arrived, setArrived] = useState(state === "open")
  useEffect(() => { if (state === "open") drawn() }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  async function draw() {
    if (state !== "closed") return
    setState("drawing")
    navigator.vibrate?.(12)
    const tin = scope.current?.querySelector(".omikuji-tin-spring"), stick = scope.current?.querySelector(".omikuji-stick")
    if (tin) await animate(tin, { rotate: 0 }, SHAKE)
    if (stick) await animate(stick, { y: -14 }, RISE)
    setState("open")
    requestAnimationFrame(() => slip.current?.focus())
  }
  // Shake to draw (Android): a firm shake, not a wobble while reading
  useEffect(() => {
    if (state !== "closed" || !shaky.current) return
    const on = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (a && Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) > 24) void draw()
    }
    window.addEventListener("devicemotion", on)
    return () => window.removeEventListener("devicemotion", on)
  })

  if (state !== "open") {
    return (
      <section aria-labelledby="fortune" className={cn("omikuji flex items-center gap-5 rounded-md border bg-card p-4", className)}>
        <button ref={scope} type="button" onClick={() => void draw()} disabled={state === "drawing"} aria-label={t.fortune.boxLabel} className="omikuji-hit is-spring">
          <span className="omikuji-tin-spring"><Box drawing={false} /></span>
        </button>
        <div className="flex flex-1 flex-col items-start gap-2">
          <h3 id="fortune" className="text-base font-medium text-foreground">{t.fortune.title}</h3>
          <p className="text-sm text-muted-foreground" aria-live="polite">{state === "drawing" ? t.fortune.drawing : shaky.current ? t.fortune.hintShake : t.fortune.hint}</p>
          <Button variant="outline" onClick={() => void draw()} disabled={state === "drawing"} aria-busy={state === "drawing"}>{t.fortune.draw}</Button>
        </div>
      </section>
    )
  }
  return (
    <motion.div ref={slip} tabIndex={-1} role="group" aria-labelledby="fortune-head" className={cn("omikuji-slip is-spring", className)}
      initial={arrived || still ? false : { scaleY: 0.08, y: -28, opacity: 0 }} animate={{ scaleY: 1, y: 0, opacity: 1 }} transition={UNFOLD}
      onAnimationComplete={() => setArrived(true)}>
      <SlipWords i={i} of={of} text={text} />
      <div className="flex flex-col items-center gap-1">
        <button type="button" onClick={() => void saveFortune(t, text)} className="omikuji-save">{t.fortune.save}</button>
        {onMap && <Button variant="outline" onClick={onMap}>{t.fortune.onMap}</Button>}
      </div>
    </motion.div>
  )
}
