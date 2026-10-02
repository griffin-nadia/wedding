import { useEffect, useState } from "react"
import { COUPLE } from "@/content/en"
import { playPaper } from "@/lib/sound"

const KEY = "ng-envelope"

/**
 * First visit only (per session): the envelope opens and the card rises (Lo-fi E). 1.3 s, skippable
 * with a tap or any key. Nothing at all under reduced motion.
 */
export function Envelope() {
  const [show, setShow] = useState(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || sessionStorage.getItem(KEY)) return false
      sessionStorage.setItem(KEY, "1")
      return true
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (!show) return
    playPaper()
    const done = () => setShow(false)
    const id = setTimeout(done, 1600)
    window.addEventListener("keydown", done, { once: true })
    return () => { clearTimeout(id); window.removeEventListener("keydown", done) }
  }, [show])
  if (!show) return null
  return (
    <div aria-hidden onClick={() => setShow(false)} className="envelope fixed inset-0 z-50 grid cursor-pointer place-items-center bg-background">
      <div className="relative h-40 w-64">
        <div className="envelope-card absolute inset-x-4 top-4 bottom-2 grid place-items-center rounded-md bg-card shadow-paper ring-1 ring-border">
          <span className="font-display text-3xl">{COUPLE.first[0]}&amp;{COUPLE.second[0]}</span>
        </div>
        <div className="absolute inset-0 rounded-md bg-secondary ring-1 ring-border [clip-path:polygon(0_35%,50%_70%,100%_35%,100%_100%,0_100%)]" />
        <div className="envelope-flap absolute inset-x-0 top-0 h-[70%] origin-top bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_6%)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        <span className="envelope-seal absolute top-[58%] left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary font-display text-sm text-primary-foreground">済</span>
      </div>
      <span className="label-caps absolute bottom-8 text-muted-foreground">Tap to skip</span>
    </div>
  )
}
