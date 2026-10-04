import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { useState } from "react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useOption } from "@/lib/options"
import { photoFor } from "@/lib/scenes"

/**
 * Sun or moon: the mode toggle. Switching reveals the new mode in a circle growing from the button (v3 S,
 * View Transitions where the browser has them); a plain cut under reduced motion or older browsers.
 */
export function LanternToggle({ className }: { className?: string }) {
  const { t } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  const mode = useOption("modeswitch")
  return (
    <button type="button" aria-pressed={lantern} title={t.theme.label} onClick={(e) => {
      const next = lantern ? "autumn" : "lantern"
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
      if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTheme(next)
      const r = e.currentTarget.getBoundingClientRect(), root = document.documentElement
      root.style.setProperty("--vt-x", `${r.left + r.width / 2}px`); root.style.setProperty("--vt-y", `${r.top + r.height / 2}px`)
      // Wait (briefly) for the next mode's photo to be decoded, so the reveal shows it whole, not loading
      const img = document.querySelector<HTMLImageElement>(`[data-photo="${photoFor(next)}"] img`)
      const ready = img ? Promise.race([img.decode().catch(() => {}), new Promise((ok) => setTimeout(ok, 350))]) : Promise.resolve()
      root.dataset.vt = mode === "fade" ? "fade" : "circle"
      void ready.then(() => {
        const vt = doc.startViewTransition!(() => flushSync(() => setTheme(next))) as { finished?: Promise<void> }
        vt.finished?.finally(() => { delete root.dataset.vt })
      })
    }} className={cn("utility-btn press", className)}>
      {lantern ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      <span className="sr-only">{t.theme.label}</span>
    </button>
  )
}

/**
 * あ / A: read in Japanese or English, beside the sun and moon (Jehan, 6 Oct). Crew devices only until a
 * native speaker has checked the Japanese; then `guests` flips to true and everyone gets it.
 */
const guests = false
export function LangToggle() {
  const { lang, setLang } = useLang()
  const [show] = useState(() => { try { return guests || Boolean(localStorage.getItem("ng-crew")) } catch { return guests } })
  if (!show) return null
  const ja = lang === "ja"
  return (
    <button type="button" onClick={() => setLang(ja ? "en" : "ja")} className="utility-btn press font-label text-(length:--type-ui-size) font-medium"
      aria-label={ja ? "Read in English" : "日本語で読む"} lang={ja ? "en" : "ja"}>
      <span aria-hidden>{ja ? "A" : "あ"}</span>
    </button>
  )
}

/** The sun or moon, with あ / A beside it where shown, as one group (the letter's corner, or the top bar). */
export function ModeSwitches({ className }: { className?: string }) {
  return <span className={cn("mode-switches", className)}><LangToggle /><LanternToggle /></span>
}
