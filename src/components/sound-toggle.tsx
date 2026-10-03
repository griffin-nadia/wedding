import { useEffect, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { setSound, soundOn } from "@/lib/sound"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/** The tiny switch for the two little sounds, at the end of the letter. Off by default, remembered on this device. */
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
      className={cn("press label-caps inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-2 text-muted-foreground outline-2 outline-offset-2 outline-transparent transition-colors hover:text-foreground focus-visible:outline-ring", className)}>
      {on ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
      <span className="sr-only">{t.sound.label}: </span>{on ? t.sound.on : t.sound.off}
    </button>
  )
}
