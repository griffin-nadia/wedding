import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

/**
 * Sun or moon: the mode toggle. Switching reveals the new mode in a circle growing from the button (v3 S,
 * View Transitions where the browser has them); a plain cut under reduced motion or older browsers.
 */
export function LanternToggle({ className }: { className?: string }) {
  const { t } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  return (
    <button type="button" aria-pressed={lantern} title={t.theme.label} onClick={(e) => {
      const next = lantern ? "autumn" : "lantern"
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
      if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTheme(next)
      const r = e.currentTarget.getBoundingClientRect(), root = document.documentElement
      root.style.setProperty("--vt-x", `${r.left + r.width / 2}px`); root.style.setProperty("--vt-y", `${r.top + r.height / 2}px`)
      doc.startViewTransition(() => flushSync(() => setTheme(next)))
    }} className={cn("utility-btn press", className)}>
      {lantern ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      <span className="sr-only">{t.theme.label}</span>
    </button>
  )
}
