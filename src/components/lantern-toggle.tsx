import { FortuneButton } from "@/components/fortune-button"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { lazy, Suspense } from "react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { photoFor } from "@/lib/scenes"

const warmPhoto = (name: string) => {
  window.dispatchEvent(new CustomEvent("ng-scene-warm", { detail: name }))
}

/**
 * Sun or moon: the mode toggle. Switching reveals the new mode in a circle growing from the button (v3 S,
 * View Transitions where the browser has them); a plain cut under reduced motion or older browsers.
 */
export function LanternToggle({ className }: { className?: string }) {
  const { t } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  const next = lantern ? "autumn" : "lantern"
  const nextPhoto = photoFor(next)
  return (
    <button type="button" aria-pressed={lantern} title={t.theme.label}
      onPointerEnter={() => warmPhoto(nextPhoto)} onPointerDown={() => warmPhoto(nextPhoto)} onFocus={() => warmPhoto(nextPhoto)} onClick={(e) => {
      const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }
      if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTheme(next)
      // The circle grows from the centre of the button that was tapped, in exact pixels, out to the farthest corner
      const r = e.currentTarget.getBoundingClientRect(), root = document.documentElement
      const x = r.left + r.width / 2, y = r.top + r.height / 2
      const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      // Mount and decode the next mode's photo before the reveal, so it never shows a loading state
      flushSync(() => warmPhoto(nextPhoto))
      const img = document.querySelector<HTMLImageElement>(`[data-photo="${nextPhoto}"] img`)
      const ready = img ? Promise.race([img.decode().catch(() => {}), new Promise((ok) => setTimeout(ok, 220))]) : Promise.resolve()
      // The circle in literal pixels, written before the transition starts: its resting clip and its keyframes are
      // both centred on the button, so no frame (the very first included) can show it anywhere else. Nothing is read
      // from CSS variables on the snapshot or animated from script after the snapshot exists, which some browsers
      // don't apply on the first transition (it used to start from the middle the first time).
      const css = getComputedStyle(root), d = css.getPropertyValue("--duration-slow").trim()
      const duration = (d.endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000) || 450 // the token can compute to "0.45s"
      const easing = css.getPropertyValue("--ease-paper").trim() || "ease-out"
      const from = `circle(0px at ${Math.round(x)}px ${Math.round(y)}px)`, to = `circle(${Math.ceil(reach)}px at ${Math.round(x)}px ${Math.round(y)}px)`
      const style = document.createElement("style")
      style.textContent = `@keyframes vt-circle { from { clip-path: ${from}; } to { clip-path: ${to}; } }
        :root[data-vt="circle"]::view-transition-new(root) { clip-path: ${from}; animation: vt-circle ${duration}ms ${easing} both; }`
      document.head.appendChild(style)
      root.dataset.vt = "circle"
      const clear = () => { delete root.dataset.vt; style.remove() }
      void ready.then(() => {
        try {
          const vt = doc.startViewTransition!(() => flushSync(() => setTheme(next)))
          // The same circle again, on the snapshot itself once it exists (run 19): the usual way to drive this reveal,
          // for browsers that don't pick up the stylesheet's (desktop was seen growing it from the middle). Identical
          // keyframes, so where both run (Chrome) nothing changes.
          vt.ready.then(() => root.animate({ clipPath: [from, to] }, { duration, easing, fill: "both", pseudoElement: "::view-transition-new(root)" }), () => {})
          vt.finished.finally(clear)
          window.setTimeout(clear, 1200)
        } catch {
          clear()
          setTheme(next)
        }
      })
    }} className={cn("utility-btn press", className)}>
      {lantern ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      <span className="sr-only">{t.theme.label}</span>
    </button>
  )
}

/** あ / A: read in Japanese or English, beside the sun and moon. On for everyone (Jehan, 6 Oct). */
export function LangToggle() {
  const { lang, setLang } = useLang()
  const ja = lang === "ja"
  return (
    <button type="button" onClick={() => setLang(ja ? "en" : "ja")} className="utility-btn utility-glyph press"
      title={ja ? "Switch to English" : "日本語に切り替える"}
      aria-label={ja ? "Switch to English" : "日本語に切り替える"} lang={ja ? "en" : "ja"}>
      <span aria-hidden>{ja ? "A" : "あ"}</span>
    </button>
  )
}

const MusicToggle = lazy(() => import("@/components/music-toggle"))

/** The sun or moon, with あ / A beside it where shown, as one group (the letter's corner, or the top bar). */
export function ModeSwitches({ className }: { className?: string }) {
  return <span className={cn("mode-switches", className)}><FortuneButton /><LangToggle /><Suspense fallback={<span aria-hidden className="utility-btn invisible" />}><MusicToggle /></Suspense><LanternToggle /></span>
}
