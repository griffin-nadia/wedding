import { Lamp, Sun } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"

/** Lantern mode (evening), next to the sound switch at the end of the letter. */
export function LanternToggle() {
  const { t } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  return (
    <button type="button" aria-pressed={lantern} title={t.theme.label} onClick={() => setTheme(lantern ? "autumn" : "lantern")} className="utility-btn press">
      {lantern ? <Sun className="size-5" strokeWidth={1.6} aria-hidden /> : <Lamp className="size-5" strokeWidth={1.6} aria-hidden />}
      <span className="sr-only">{t.theme.label}</span>
    </button>
  )
}
