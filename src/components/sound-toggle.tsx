import { useEffect, useState } from "react"
import { Music2, VolumeX } from "lucide-react"
import { setSound, soundOn } from "@/lib/sound"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/** Footer switch for the two little sounds. Off by default, remembered on this device. */
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
      className={cn("press inline-flex min-h-11 items-center gap-2 rounded-full border border-current/30 px-4 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", className)}>
      {on ? <Music2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
      <span className="sr-only">{t.sound.label}: </span>{on ? t.sound.on : t.sound.off}
    </button>
  )
}
