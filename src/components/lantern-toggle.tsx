import { Moon, Sun } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Sun or moon (v3 A): the mode toggle, top right, outside the letter. */
export function LanternToggle({ className }: { className?: string }) {
  const { t } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  return (
    <button type="button" aria-pressed={lantern} title={t.theme.label} onClick={() => setTheme(lantern ? "autumn" : "lantern")} className={cn("utility-btn press", className)}>
      {lantern ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      <span className="sr-only">{t.theme.label}</span>
    </button>
  )
}
