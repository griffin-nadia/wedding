// The envelope's paper slide, on the tap that opens it. Made in the browser (no files); nothing is created until
// that tap. It plays unless the guest has turned music off (Options → Music toggle), at the same 30% as the music.
const KEY = "ng-music"
const VOLUME = 0.3
let ctx: AudioContext | null = null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

/** Paper slide: a short, soft brush of filtered noise, about 0.35 s. */
export function playPaper() {
  try { if (localStorage.getItem(KEY) === "off") return } catch { /* private mode: music is on by default */ }
  const a = audio(); if (!a) return
  const len = Math.floor(a.sampleRate * 0.35)
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len)
  const src = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain()
  f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.8; v.gain.value = VOLUME
  src.buffer = buf; src.connect(f).connect(v).connect(a.destination); src.start()
}
