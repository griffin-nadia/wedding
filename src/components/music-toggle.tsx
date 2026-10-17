import { useEffect, useSyncExternalStore } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"
import { loop } from "@/lib/frame"

const KEY = "ng-music"
/** The site's only sound is the music, at this level, and never louder than MAX_VOLUME. */
export const SITE_VOLUME = 0.3
const MAX_VOLUME = 0.35
/** The first tap anywhere (usually the envelope): from silence to 30% over 2.5 s, eased out */
const FADE_IN = 2500
/** Switched on with the toggle: they asked for it, so it comes in quickly */
const TOGGLE_FADE = 500
const FADE_OUT = 600
/** Coming back to the tab: it carries on from where it stopped, back up to 30% in half a second (not the first 2.5 s fade) */
const RESUME_FADE = 500

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
let fade = () => {}
// On by default: with nothing remembered, the song starts on their first tap anywhere (usually opening the envelope)
let on = (() => { try { return localStorage.getItem(KEY) !== "off" } catch { return true } })()
let armed = false
const subs = new Set<() => void>()
// One player across browser tabs too: when this tab starts the song, any other open tab of the site fades out.
const tab = Math.random().toString(36).slice(2)
let channel: BroadcastChannel | null = null
try { channel = new BroadcastChannel("ng-music") } catch { /* older browsers: one tab is the norm anyway */ }
channel?.addEventListener("message", (e: MessageEvent) => { if (e.data?.playing && e.data.tab !== tab) pause() })
const emit = () => subs.forEach((f) => f())

// npm run dev and the lab play private/song.mp3 when it's there (served by the dev server only, never built)
const SRC = import.meta.env.DEV && __PRIVATE_SONG__ ? "__private/song.mp3" : ART.music.src

function el() {
  if (!audio) {
    audio = new Audio(SRC ? `${import.meta.env.BASE_URL}${SRC}` : silentWav())
    audio.loop = true; audio.volume = 0; audio.preload = "auto"
  }
  return audio
}
function ramp(to: number, ms: number, then?: () => void) {
  const a = el(), from = a.volume, start = performance.now()
  fade()
  fade = loop((now) => {
    const k = Math.min(1, (now - start) / ms)
    // Eased out (it's audible at once, then settles gently) so it sounds faded in rather than switched on
    const eased = 1 - Math.pow(1 - k, 3)
    a.volume = Math.max(0, Math.min(MAX_VOLUME, from + (to - from) * eased))
    if (k < 1) return true
    then?.(); return false
  })
}
let played = false
let starting = false
function play(fadeMs = FADE_IN) {
  channel?.postMessage({ playing: true, tab })
  const a = el()
  if (!a.paused) { ramp(SITE_VOLUME, fadeMs); return }
  if (starting) return // visibilitychange and pageshow can both ask at once on a phone: one start is enough
  starting = true
  void a.play().then(() => { played = true; sound(true); ramp(SITE_VOLUME, fadeMs); session("playing") }).catch(() => {}).finally(() => { starting = false })
}
function pause() { if (audio && !audio.paused) ramp(0, FADE_OUT, () => { audio?.pause(); sound(false); session("paused") }) }
// Actually making sound (the browser has allowed it). Until then, with the music on, the toggle pulses gently.
let sounding = false
function sound(next: boolean) { if (sounding !== next) { sounding = next; emit() } }
/**
 * Stops at once, with no fade. Hidden pages don't run frames, so a fade's last step (the pause) would never come and
 * the song would carry on in the phone's media controls. This never waits on a frame. It also clears the Now Playing
 * entry (iPhone lock screen, Android's media notification): a paused song with its title still set lingers there
 * after the page is gone. Coming back sets it again.
 */
function hardStop() {
  fade()
  if (!audio) return
  audio.volume = 0
  audio.pause()
  sound(false)
  session("none")
}
// Hidden, locked, swiped away or frozen: stop now. Back again: fade in if it's on (and has played before)
const resume = () => { if (on && audio && played && !document.hidden) play(RESUME_FADE) }
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => { if (document.hidden) hardStop(); else resume() })
  addEventListener("pagehide", hardStop)
  addEventListener("pageshow", resume)
  document.addEventListener("freeze", hardStop)
}

// The phone's lock screen and media controls: our name and mark, and play / pause that follow the toggle
function session(state: MediaSessionPlaybackState) {
  if (!("mediaSession" in navigator)) return
  const ms = navigator.mediaSession
  ms.playbackState = state
  if (state === "none") {
    ms.metadata = null
    try { ms.setActionHandler("play", null); ms.setActionHandler("pause", null) } catch { /* older browsers */ }
    return
  }
  if (ms.metadata) return
  try {
    ms.metadata = new MediaMetadata({ title: "Griffin & Nadia", artist: ART.music.artist, artwork: [{ src: `${import.meta.env.BASE_URL}og-image.png`, sizes: "1200x630", type: "image/png" }] })
    ms.setActionHandler("play", () => setOn(true))
    ms.setActionHandler("pause", () => setOn(false))
  } catch { /* older browsers */ }
}
function setOn(next: boolean) {
  on = next
  try { localStorage.setItem(KEY, next ? "on" : "off") } catch { /* private mode */ }
  if (next) play(TOGGLE_FADE); else pause()
  emit()
}

/*
 * Remembered as on: start on their very first touch, click or key anywhere except the toggle (browsers never allow
 * sound before one). Each kind of event is tried, because they don't all count everywhere: on an iPhone a touch's
 * pointerdown doesn't unlock sound but its touchend does. The listeners go once it's playing.
 */
const GESTURES = ["pointerdown", "touchend", "click", "keydown"] as const
let warmed = false
function arm() {
  // Start downloading the song as soon as the page has loaded, on or off, so it's buffered by the first tap or the
  // toggle (off, a guest switching it on wants it now)
  if (!warmed) {
    warmed = true
    const warm = () => { el().load() }
    if (document.readyState === "complete") warm()
    else addEventListener("load", warm, { once: true })
  }
  if (armed || !on) return
  armed = true
  const first = (e: Event) => {
    if ((e.target as Element | null)?.closest?.("[data-music-toggle]")) return
    if (!on || sounding) return done()
    play()
  }
  const done = () => GESTURES.forEach((g) => removeEventListener(g, first, true))
  subs.add(() => { if (sounding) done() })
  GESTURES.forEach((g) => addEventListener(g, first, { capture: true, passive: true }))
}

/**
 * Background music (Options → Music toggle). On by default, but browsers never allow sound before a tap, so it starts
 * on the guest's first tap anywhere (usually opening the envelope), fading in over 2.5 s to 30% (half a second from the toggle), fades out when paused, remembers the choice on this
 * device, keeps playing across pages, and stops at once while the tab is hidden. The track is ART.music.
 */
export default function MusicToggle() {
  const { t } = useLang()
  const store = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
  const isOn = useSyncExternalStore(store, () => on, () => false)
  // On, but the browser hasn't allowed sound yet: a slow pulse says "tap anywhere and it starts"
  const waiting = useSyncExternalStore(store, () => on && !sounding, () => false)
  useEffect(() => { arm() }, [])
  return (
    <button type="button" data-music-toggle data-waiting={waiting || undefined} onClick={() => { setOn(!on); arm() }} aria-pressed={isOn} className="utility-btn press" title={isOn ? t.music.off : t.music.on} aria-label={isOn ? t.music.off : t.music.on}>
      {isOn ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
    </button>
  )
}
