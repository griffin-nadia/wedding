import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { lazy, Suspense, useState } from "react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useOption } from "@/lib/options"
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
  const mode = useOption("modeswitch")
  const next = lantern ? "autumn" : "lantern"
  const nextPhoto = photoFor(next)
  return (
    <button type="button" aria-pressed={lantern} title={t.theme.label}
      onPointerEnter={() => warmPhoto(nextPhoto)} onFocus={() => warmPhoto(nextPhoto)} onClick={(e) => {
      const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready?: Promise<void>; finished?: Promise<void> } }
      if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTheme(next)
      // The circle grows from the centre of the button that was tapped, in exact pixels, out to the farthest corner
      const r = e.currentTarget.getBoundingClientRect(), root = document.documentElement
      const x = r.left + r.width / 2, y = r.top + r.height / 2
      const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      // Mount and decode the next mode's photo before the reveal, so it never shows a loading state
      flushSync(() => warmPhoto(nextPhoto))
      const img = document.querySelector<HTMLImageElement>(`[data-photo="${nextPhoto}"] img`)
      const ready = img ? Promise.race([img.decode().catch(() => {}), new Promise((ok) => setTimeout(ok, 350))]) : Promise.resolve()
      root.dataset.vt = mode === "fade" ? "fade" : "circle"
      const clear = () => { delete root.dataset.vt }
      void ready.then(() => {
        try {
          const vt = doc.startViewTransition!(() => flushSync(() => setTheme(next)))
          // Driven from here rather than a keyframe reading CSS variables, which not every browser resolves on the
          // transition's snapshot: that left the circle starting from the top of the page instead of the button
          if (mode !== "fade") void vt.ready?.then(() => {
            const css = getComputedStyle(root), d = css.getPropertyValue("--duration-mode").trim()
            const duration = d.endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000 // the token can compute to "0.76s"
            root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${reach}px at ${x}px ${y}px)`] },
              { duration: duration || 760, easing: css.getPropertyValue("--ease-mode").trim() || "ease-in-out", pseudoElement: "::view-transition-new(root)" })
          })
          vt.finished?.finally(clear)
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

/**
 * あ / A: read in Japanese or English, beside the sun and moon. On for everyone (Jehan, 6 Oct).
 * The Japanese is still worth a native speaker's read-through; flip back to false if it needs work first.
 */
const guests = true
export function LangToggle() {
  const { lang, setLang } = useLang()
  const [show] = useState(() => { try { return guests || Boolean(localStorage.getItem("ng-crew")) } catch { return guests } })
  if (!show) return null
  const ja = lang === "ja"
  return (
    <button type="button" onClick={() => setLang(ja ? "en" : "ja")} className="utility-btn press font-label text-(length:--type-ui-size) font-medium"
      title={ja ? "Switch to English" : "日本語に切り替える"}
      aria-label={ja ? "Switch to English" : "日本語に切り替える"} lang={ja ? "en" : "ja"}>
      <span aria-hidden>{ja ? "A" : "あ"}</span>
    </button>
  )
}

const MusicToggle = lazy(() => import("@/components/music-toggle"))

/** The sun or moon, with あ / A beside it where shown, as one group (the letter's corner, or the top bar). */
export function ModeSwitches({ className }: { className?: string }) {
  const music = useOption("music") === "on" // Options → Music toggle: the opt-in music button beside the sun
  return <span className={cn("mode-switches", className)}><LangToggle />{music && <Suspense><MusicToggle /></Suspense>}<LanternToggle /></span>
}
