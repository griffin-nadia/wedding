// Two tiny sounds, made in the browser (no files): the envelope's paper slide and the furin chime
// on the hanko. Off until the guest turns sound on (footer); nothing is created before that.
const KEY = "ng-sound"
let ctx: AudioContext | null = null
let last = 0

export function soundOn() {
  try { return localStorage.getItem(KEY) === "on" } catch { return false }
}

export function setSound(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off") } catch { /* private mode */ }
  if (on) audio() // warm up only once it's wanted
  window.dispatchEvent(new Event("ng-sound"))
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

/** At most one sound a second, and only when sound is on. */
function gate() {
  if (!soundOn()) return null
  const now = Date.now()
  if (now - last < 1000) return null
  last = now
  return audio()
}

/** Furin: two soft glassy rings, about 0.45 s. */
export function playFurin() {
  const a = gate(); if (!a) return
  const ring = (at: number, gain: number) => {
    for (const [f, g] of [[2093, 1], [3136, 0.35], [4186, 0.15]] as const) {
      const o = a.createOscillator(), v = a.createGain()
      o.type = "sine"; o.frequency.value = f
      v.gain.setValueAtTime(0, a.currentTime + at)
      v.gain.linearRampToValueAtTime(0.12 * gain * g, a.currentTime + at + 0.005)
      v.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + 0.42)
      o.connect(v).connect(a.destination); o.start(a.currentTime + at); o.stop(a.currentTime + at + 0.45)
    }
  }
  ring(0, 1); ring(0.12, 0.55)
}

/** Paper slide: a short, soft brush of filtered noise, about 0.35 s. */
export function playPaper() {
  const a = gate(); if (!a) return
  const len = Math.floor(a.sampleRate * 0.35)
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len)
  const src = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain()
  f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.8; v.gain.value = 0.08
  src.buffer = buf; src.connect(f).connect(v).connect(a.destination); src.start()
}
