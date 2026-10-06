import { useEffect, useSyncExternalStore } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"

const KEY = "ng-music"
/** One level for every sound on the site (the music and the envelope's paper sound). */
export const SITE_VOLUME = 0.3
const FADE_IN = 2500
/** After the first tap anywhere (usually opening the envelope) wait this long, so the song arrives with the letter. */
const START_DELAY = 2000
const FADE_OUT = 600

/** One second of silence as a WAV, in case ART.music.src is ever empty. */
function silentWav() {
  const rate = 8000, n = rate, buf = new ArrayBuffer(44 + n), v = new DataView(buf)
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true)
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128)
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }))
}

/*
 * One player for the whole site. The toggle can be on screen more than once (the top bar and the corner chip, and
 * again on every page), so the audio, the fade and the on/off state live here, not in each button. That stops two
 * copies of the song playing over each other, or restarting, when you change page.
 */
let audio: HTMLAudioElement | null = null
let fade = 0
// On by default: with nothing remembered, the song starts on their first tap anywhere (usually opening the envelope)
let on = (() => { try { return localStorage.getItem(KEY) !== "off" } catch { return true } })()
let armed = false
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

function el() {
  if (!audio) {
    audio = new Audio(ART.music.src ? `${import.meta.env.BASE_URL}${ART.music.src}` : silentWav())
    audio.loop = true; audio.volume = 0; audio.preload = "auto"
  }
  return audio
}
function ramp(to: number, ms: number, then?: () => void) {
  const a = el(), from = a.volume, start = performance.now()
  cancelAnimationFrame(fade)
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / ms)
    // Eased (slow start, gentle landing) so the fade sounds smooth rather than switched on
    const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
    a.volume = Math.max(0, Math.min(1, from + (to - from) * eased))
    if (k < 1) fade = requestAnimationFrame(step); else then?.()
  }
  fade = requestAnimationFrame(step)
}
function play() {
  const a = el()
  if (!a.paused) { ramp(SITE_VOLUME, FADE_IN); return }
  void a.play().then(() => ramp(SITE_VOLUME, FADE_IN)).catch(() => {})
}
function pause() { if (audio && !audio.paused) ramp(0, FADE_OUT, () => audio?.pause()) }
function setOn(next: boolean) {
  on = next
  try { localStorage.setItem(KEY, next ? "on" : "off") } catch { /* private mode */ }
  if (next) play(); else pause()
  emit()
}

// Remembered as on: start after their first tap anywhere except the toggle (browsers never allow sound before one)
function arm() {
  if (armed || !on) return
  armed = true
  const first = (e: PointerEvent) => {
    if ((e.target as Element | null)?.closest?.("[data-music-toggle]")) return
    removeEventListener("pointerdown", first)
    window.setTimeout(() => { if (on) play() }, START_DELAY)
  }
  addEventListener("pointerdown", first)
  // Hidden tab: fade out and pause; back again: carry on if it's on
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); else if (on && audio) play() })
}

/**
 * Background music (Options → Music toggle). On by default, but browsers never allow sound before a tap, so it starts
 * on the guest's first tap anywhere (usually opening the envelope), waits 2 s, then fades in smoothly over 2.5 s to 30%, fades out when paused, remembers the choice on this
 * device, keeps playing across pages, and pauses while the tab is hidden. The track is ART.music.
 */
export default function MusicToggle() {
  const { t } = useLang()
  const isOn = useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => on, () => false)
  useEffect(() => { arm() }, [])
  return (
    <button type="button" data-music-toggle onClick={() => { arm(); setOn(!on) }} aria-pressed={isOn} className="utility-btn press" title={isOn ? t.music.off : t.music.on} aria-label={isOn ? t.music.off : t.music.on}>
      {isOn ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
    </button>
  )
}
