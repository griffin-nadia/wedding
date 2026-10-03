import { Lamp, Sun } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Lantern mode (evening). Lives with the site chrome (top right); the lab can put it back at the end of the letter. */
export function LanternToggle({ className }: { className?: string }) {
  const { t } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  return (
    <button type="button" aria-pressed={lantern} title={t.theme.label} onClick={() => setTheme(lantern ? "autumn" : "lantern")} className={cn("utility-btn press", className)}>
      {lantern ? <Sun className="size-5" strokeWidth={1.6} aria-hidden /> : <Lamp className="size-5" strokeWidth={1.6} aria-hidden />}
      <span className="sr-only">{t.theme.label}</span>
    </button>
  )
}
