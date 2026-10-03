import { useEffect, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { setSound, soundOn } from "@/lib/sound"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/** The tiny switch for the two little sounds, at the end of the letter. Off by default, remembered on this device. Icon only; the name is spoken. */
export function SoundToggle({ className }: { className?: string }) {
  const { t } = useLang()
  const [on, setOn] = useState(soundOn)
  useEffect(() => {
    const sync = () => setOn(soundOn())
    window.addEventListener("ng-sound", sync)
    return () => window.removeEventListener("ng-sound", sync)
  }, [])
  return (
    <button type="button" aria-pressed={on} onClick={() => setSound(!on)}
      title={on ? t.sound.on : t.sound.off} className={cn("utility-btn press", className)}>
      {on ? <Volume2 className="size-5" strokeWidth={1.6} aria-hidden /> : <VolumeX className="size-5" strokeWidth={1.6} aria-hidden />}
      <span className="sr-only">{t.sound.label}</span>
    </button>
  )
}
