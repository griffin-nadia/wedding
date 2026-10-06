import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"

const KEY = "ng-music"
const VOLUME = 0.2
const FADE_IN = 2000
const FADE_OUT = 600

/** One second of silence as a WAV, so the toggle works end to end before the real track is cleared to use. */
function silentWav() {
  const rate = 8000, n = rate, buf = new ArrayBuffer(44 + n), v = new DataView(buf)
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true)
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128)
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }))
}

/**
 * Background music, opt-in only (Options → Music toggle). Off by default and never autoplays with sound: it starts
 * only from a tap on this button, fades in over 2 s to 20%, fades out when paused, remembers the choice on this
 * device (a return visit shows it on, and it plays after their first tap anywhere), and pauses while the tab is hidden.
 * The track is ART.music; until the artist says yes it plays silence.
 */
export default function MusicToggle() {
  const { t } = useLang()
  const audio = useRef<HTMLAudioElement | null>(null)
  const fade = useRef(0)
  const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) === "on" } catch { return false } })

  const el = () => {
    if (!audio.current) {
      const a = new Audio(ART.music.src ? `${import.meta.env.BASE_URL}${ART.music.src}` : silentWav())
      a.loop = true; a.volume = 0; a.preload = "none"
      audio.current = a
    }
    return audio.current
  }
  const ramp = (to: number, ms: number, then?: () => void) => {
    const a = el(), from = a.volume, start = performance.now()
    cancelAnimationFrame(fade.current)
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms)
      a.volume = from + (to - from) * k
      if (k < 1) fade.current = requestAnimationFrame(step); else then?.()
    }
    fade.current = requestAnimationFrame(step)
  }
  const play = () => { const a = el(); void a.play().then(() => ramp(VOLUME, FADE_IN)).catch(() => {}) }
  const pause = () => { if (audio.current) ramp(0, FADE_OUT, () => audio.current?.pause()) }

  // Remembered as on: wait for their first tap anywhere (browsers never allow sound before one), then fade in
  useEffect(() => {
    if (!on) return
    const first = () => play()
    addEventListener("pointerdown", first, { once: true })
    return () => removeEventListener("pointerdown", first)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Hidden tab: fade out and pause; back again: fade in if it's on
  useEffect(() => {
    const vis = () => { if (document.hidden) pause(); else if (on && audio.current) play() }
    document.addEventListener("visibilitychange", vis)
    return () => document.removeEventListener("visibilitychange", vis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])
  useEffect(() => () => { cancelAnimationFrame(fade.current); audio.current?.pause() }, [])

  const toggle = () => {
    const next = !on
    setOn(next)
    try { localStorage.setItem(KEY, next ? "on" : "off") } catch { /* private mode */ }
    if (next) play(); else pause()
  }
  return (
    <button type="button" onClick={toggle} aria-pressed={on} className="utility-btn press" title={on ? t.music.off : t.music.on} aria-label={on ? t.music.off : t.music.on}>
      {on ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
    </button>
  )
}
