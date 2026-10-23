import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { Photo } from "@/components/photo"
import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { STORY_PLAN } from "@/content/story-plan"
import { pending } from "@/content/pending"
import { still } from "../../motion"

/**
 * Run 24, opening a photo: what every take shares. The prints (their chapters, their photos), the polaroid they sit
 * in, the opened print (a dialog that grows out of the print you picked and goes back into it) and the paper rustle.
 * Only words they've written: the Content tab's chapters when there's a back end, the planner's otherwise, with the
 * placeholder line for bodies not written yet (as our-story.tsx does).
 */
export const P = "x-open24"

/** The chapters that have a photo, with their words */
export function useChapters() {
  const { lang } = useLang()
  const { story, ready } = useContent()
  const src = ready && story.length ? story : STORY_PLAN
  return src.filter((c) => c.photo).map((c) => (c.body.length ? c : { ...c, body: [pending("story.chapterBody", lang)] }))
}

/** The polaroid caption: year and the last part of the place, lowercase ("2017 · hirakata"), their own words */
export const capOf = (c: { year: string; place?: string }) => [c.year, c.place?.split(",").pop()?.trim().toLowerCase()].filter(Boolean).join(" · ")
/** One fixed, hand-placed lean per print, kept wherever it appears */
export const LEAN = [-5, 4, -3, 6, -4, 3, -2, 5]

export const commonCss = `
.${P}-row { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-5) var(--space-4); padding: var(--space-4) var(--space-2) var(--space-6); list-style: none; margin: 0; }
.${P}-row > li { width: clamp(100px, 27vw, 176px); }
.${P}-btn { position: relative; display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; border-radius: 2px; outline: 2px solid transparent; outline-offset: 5px; -webkit-tap-highlight-color: transparent; }
.${P}-btn:focus-visible { outline-color: var(--input-focus); }
[data-x-open24-away] { opacity: 0; }
/* The polaroid: about 5% top and sides, 18% at the bottom, bright paper with a faint grain, two-layer shadow */
.${P}-pol { position: relative; display: block; container-type: inline-size; padding: 5% 5% 0; border-radius: 2px; rotate: var(--lean, 0deg);
  background: radial-gradient(circle at 30% 20%, rgb(255 255 255 / .5), transparent 60%), var(--brand-paper-bright);
  box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .16), 0 1px 2px rgb(var(--tint-shadow) / .18), 0 12px 24px -14px rgb(var(--tint-shadow) / .45); }
[data-theme="lantern"] .${P}-pol { box-shadow: 0 0 0 .5px rgb(0 0 0 / .3), 0 1px 2px rgb(0 0 0 / .4), 0 14px 26px -12px rgb(60 30 0 / .6); }
.${P}-photo { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; border-radius: 1px; background: color-mix(in oklab, var(--brand-kinari) 70%, #bbb);
  box-shadow: inset 0 0 0 .5px rgb(0 0 0 / .18); }
.${P}-photo figure, .${P}-photo figure > div { margin: 0; width: 100%; height: 100%; aspect-ratio: auto !important; border-radius: 0 !important; }
.${P}-photo figcaption { display: none; }
.${P}-photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; display: block; }
.${P}-photo::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .08), inset 0 1px 3px rgb(0 0 0 / .18); pointer-events: none; }
.${P}-cap { display: grid; place-items: center; height: 18cqi; padding-inline: 4%; color: #3b2a1e; font: 400 max(11px, 7cqi) / 1 var(--font-display); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-blank { display: grid; place-items: center; width: 100%; height: 100%; color: #6b5442; font: 500 12px / 1.3 var(--font-label); text-align: center; padding: 8%; }

/* The opened print */
.${P}-dlg { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: var(--space-4); overflow-y: auto; }
.${P}-scrim { position: fixed; inset: 0; background: rgb(var(--tint-shadow) / .48); opacity: 0; transition: opacity .35s var(--ease-paper); }
.${P}-dlg[data-in] .${P}-scrim { opacity: 1; }
[data-theme="lantern"] .${P}-scrim { background: rgb(0 0 0 / .6); }
/* Table: the rest of the table goes soft (a still blur, only its opacity fades) with the edges in shadow */
.${P}-dlg[data-table] .${P}-scrim { -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); background: radial-gradient(circle at 50% 45%, transparent 25%, rgb(var(--tint-shadow) / .3)); }
[data-theme="lantern"] .${P}-dlg[data-table] .${P}-scrim { background: radial-gradient(circle at 50% 45%, transparent 20%, rgb(0 0 0 / .62)); }
.${P}-dlg[data-table] .${P}-big { width: min(60vw, 300px, calc((100svh - 300px) / 1.36)); }
@media (min-width: 900px) { .${P}-dlg[data-table] .${P}-big { width: min(30vw, 340px); } }
.${P}-body { position: relative; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); max-width: 100%; }
@media (min-width: 900px) { .${P}-dlg:not([data-mode="flip"]) .${P}-body { flex-direction: row; gap: var(--space-7, 48px); } }
.${P}-big { position: relative; width: min(80vw, 400px, calc((100svh - 280px) / 1.36)); min-width: 200px; transform-origin: 50% 50%; perspective: 1400px; }
.${P}-dlg[data-mode="flip"] .${P}-big { width: min(84vw, 460px, calc((100svh - 150px) / 1.36)); }
@media (min-width: 900px) { .${P}-big { width: min(42vw, 440px, calc((100svh - 120px) / 1.36)); } }
.${P}-big .${P}-pol { rotate: 0deg; }
/* A wider shadow under the lifted print, faded in (opacity only) */
.${P}-lift { position: absolute; inset: 2% 4% -2%; border-radius: 4px; box-shadow: 0 40px 70px -20px rgb(var(--tint-shadow) / .55), 0 18px 30px -18px rgb(var(--tint-shadow) / .4); opacity: 0; transition: opacity .5s var(--ease-paper); }
[data-theme="lantern"] .${P}-lift { box-shadow: 0 40px 70px -20px rgb(0 0 0 / .8), 0 18px 30px -18px rgb(70 35 0 / .5); }
.${P}-dlg[data-in] .${P}-lift { opacity: 1; }
.${P}-words { position: relative; width: min(100%, 34rem); max-width: 92vw; padding: var(--space-4) var(--space-5); border-radius: var(--radius-card); background: var(--letter-bg); color: var(--ink-soft);
  box-shadow: 0 1px 2px rgb(var(--tint-shadow) / .14), 0 16px 30px -18px rgb(var(--tint-shadow) / .4); opacity: 0; transition: opacity .4s var(--ease-paper) .15s; }
.${P}-dlg[data-in] .${P}-words { opacity: 1; }
.${P}-words h2 { margin: 0 0 4px; color: var(--ink); font: 500 var(--type-h3-size, 1.35rem) / 1.2 var(--font-display); }
.${P}-meta { margin: 0 0 var(--space-3); font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink-soft); }
.${P}-words p:not(.${P}-meta) { margin: 0 0 var(--space-2); font: 400 var(--type-body-size, 1rem) / 1.6 var(--font-body); max-width: 65ch; }
.${P}-bar { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
.${P}-act { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; min-width: 48px; padding-inline: 18px; border: 0; border-radius: var(--radius-pill); cursor: pointer;
  background: var(--action); color: var(--action-ink); font: 500 var(--type-ui-size, 1rem) / 1 var(--font-label); }
.${P}-act[data-quiet] { background: color-mix(in oklab, var(--letter-bg) 92%, var(--ink)); color: var(--ink); box-shadow: inset 0 0 0 1px var(--line-hairline); }
.${P}-act:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.${P}-dlg[data-mode="flip"] .${P}-bar { justify-content: center; }
/* Flip: front and back faces of one card */
.${P}-card { position: relative; display: block; transform-style: preserve-3d; transition: transform .7s cubic-bezier(.3,.7,.2,1); cursor: pointer; }
.${P}-card[data-back] { transform: rotateY(180deg); }
.${P}-face { display: block; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.${P}-back { position: absolute; inset: 0; transform: rotateY(180deg); padding: 10% 9%; overflow: hidden; border-radius: 2px; text-align: left; color: #2f2116;
  background: repeating-linear-gradient(0deg, transparent 0 27px, rgb(120 90 60 / .12) 27px 28px), var(--brand-paper-bright);
  box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .16), 0 1px 2px rgb(var(--tint-shadow) / .18); }
.${P}-back h2 { margin: 0 0 6px; font: italic 500 clamp(18px, 6.4cqi, 26px) / 1.2 var(--font-display); color: #2a1206; rotate: -1deg; }
.${P}-back .${P}-date { display: block; margin-bottom: 14px; font: italic 400 15px / 1 var(--font-display); color: #6b3a22; }
.${P}-back p { margin: 0 0 10px; font: italic 400 clamp(15px, 4.6cqi, 18px) / 28px var(--font-display); rotate: -.4deg; }
.${P}-back { container-type: inline-size; }
@media (prefers-reduced-motion: reduce) {
  .${P}-card { transition: none; }
  .${P}-card .${P}-face { transition: opacity .3s; }
  .${P}-card[data-back] { transform: none; }
  .${P}-card[data-back] .${P}-front, .${P}-card:not([data-back]) .${P}-back { opacity: 0; }
  .${P}-back { transform: none; }
}
/* Develop: milky and grey, clearing to full colour (opacity only) */
.${P}-milk, .${P}-grey { position: absolute; inset: 0; pointer-events: none; opacity: 0; }
.${P}-grey { background: #8a8580; mix-blend-mode: color; }
.${P}-milk { background: color-mix(in oklab, var(--brand-paper-bright) 80%, #9aa0a0); }
.${P}-dlg[data-develop] .${P}-grey { animation: ${P}-clear 1.1s ease-out .25s both; }
.${P}-dlg[data-develop] .${P}-milk { animation: ${P}-clear-milk 1.2s ease-out .15s both; }
@keyframes ${P}-clear { from { opacity: 1 } to { opacity: 0 } }
@keyframes ${P}-clear-milk { from { opacity: .85 } to { opacity: 0 } }
/* Zoom (loupe take): the photo scales inside its frame */
.${P}-zoom { display: block; width: 100%; height: 100%; transform-origin: var(--ox, 50%) var(--oy, 50%); transition: transform .18s ease-out; }
/* Table: a pool of lantern light under the print you hold */
.${P}-pool { position: absolute; left: 50%; top: 50%; width: 230%; aspect-ratio: 1; translate: -50% -50%; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .7s var(--ease-paper);
  background: radial-gradient(closest-side, color-mix(in oklab, var(--brand-hachimitsu) 60%, transparent), color-mix(in oklab, var(--brand-hachimitsu) 22%, transparent) 55%, transparent); }
[data-theme="lantern"] .${P}-pool { background: radial-gradient(closest-side, color-mix(in oklab, var(--brand-hachimitsu) 55%, transparent), color-mix(in oklab, var(--brand-hachimitsu) 20%, transparent) 55%, transparent); }
.${P}-dlg[data-in] .${P}-pool { opacity: 1; }
.${P}-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`

/** A photo on the site (Photo), or one only the lab has (privatePhoto) with a plain paper print if it 404s */
export function PrintPhoto({ name, src, alt, sizes = "(min-width: 768px) 180px, 30vw" }: { name?: string; src?: string; alt: string; sizes?: string }) {
  const [failed, setFailed] = useState(false)
  if (name) return <Photo name={name} treatment="print" sizes={sizes} alt={alt} />
  if (!src || failed) return <span className={`${P}-blank`} role="img" aria-label={alt}>{alt}</span>
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
}

/** Develop (inside a Polaroid's photo): milky grey that clears when the dialog opens with develop */
export const Develop = () => <><span className={`${P}-grey`} aria-hidden /><span className={`${P}-milk`} aria-hidden /></>

/** A polaroid: the photo (with any layers over it) and the caption on the bottom border */
export function Polaroid({ name, src, alt, cap, lean = 0, sizes, children, style }: { name?: string; src?: string; alt: string; cap?: string; lean?: number; sizes?: string; children?: ReactNode; style?: CSSProperties }) {
  return (
    <span className={`${P}-pol`} style={{ ["--lean" as string]: `${lean}deg`, ...style }}>
      <span className={`${P}-photo`}><PrintPhoto name={name} src={src} alt={alt} sizes={sizes} />{children}</span>
      <span className={`${P}-cap`} aria-hidden>{cap}</span>
    </span>
  )
}

/** Is the site's music playing now? Read from the music button the shell already shows (on, and not waiting for a tap) */
export const musicPlaying = () => !!document.querySelector('[data-music-toggle][aria-pressed="true"]:not([data-waiting])')

let audio: AudioContext | null = null
/**
 * A soft paper rustle, made on the spot (no sound file): a few short bursts of filtered noise, quieter than the music
 * (peak about 0.06 against its 0.2). Only when the music is already playing, so the site never starts making sound by itself.
 */
export function rustle() {
  if (!musicPlaying()) return
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    audio ??= new AC()
    void audio.resume()
    const ctx = audio, now = ctx.currentTime, len = 0.42
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * len), ctx.sampleRate), d = buf.getChannelData(0)
    // Brown-ish noise with crackles: paper is mostly low hiss with small sharp ticks in it
    let last = 0
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.08 * w) / 1.02; d[i] = last * 3 + (Math.random() < 0.004 ? w * 0.9 : 0) }
    const src = ctx.createBufferSource(); src.buffer = buf
    const band = ctx.createBiquadFilter(); band.type = "bandpass"; band.frequency.value = 2400; band.Q.value = 0.6
    const high = ctx.createBiquadFilter(); high.type = "highpass"; high.frequency.value = 500
    const g = ctx.createGain(); g.gain.setValueAtTime(0, now)
    // Three soft swells, like a print slid against another and lifted
    ;[[0, 0.05], [0.12, 0.035], [0.24, 0.06]].forEach(([t, v]) => { g.gain.linearRampToValueAtTime(v, now + t + 0.03); g.gain.linearRampToValueAtTime(v * 0.3, now + t + 0.1) })
    g.gain.linearRampToValueAtTime(0, now + len)
    src.connect(high).connect(band).connect(g).connect(ctx.destination)
    src.start(now); src.stop(now + len)
  } catch { /* no sound is fine */ }
}

export type Words = { title: string; year?: string; place?: string; body?: string[] }

/**
 * The opened print: a modal dialog that grows out of the print you picked (FLIP, transform only) and goes back into
 * it. Escape, Done or a tap outside closes; focus stays inside while open and goes back to the print after. Reduced
 * motion: a fade. mode "flip": the words are on the back (Turn over); otherwise beside it.
 */
export function Opened({ from, at = from, print, words, label, onClose, mode = "beside", develop, zoom, table, pickup }: {
  /** from: the button (focus goes back to it); at: what it grows out of and goes back into (the print itself) */
  from: HTMLElement; at?: HTMLElement; print: ReactNode; words?: Words; label: string; onClose: () => void
  mode?: "beside" | "flip"; develop?: boolean; zoom?: boolean; table?: boolean; pickup?: boolean
}) {
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null)
  const big = useRef<HTMLDivElement>(null)
  const done = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const [back, setBack] = useState(false)
  const [scale, setScale] = useState(1)
  const [inn, setIn] = useState(false)
  const flip = (reverse: boolean) => {
    const el = big.current
    if (!el) return null
    if (still()) return el.animate([{ opacity: reverse ? 1 : 0 }, { opacity: reverse ? 0 : 1 }], { duration: 240, fill: "both" })
    const a = at.getBoundingClientRect(), b = el.getBoundingClientRect()
    const there = `perspective(1400px) translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px, ${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${a.width / b.width})`
    // Pick up: on the way it tips towards you a little (a 3D tilt that settles flat)
    const mid = pickup ? [{ transform: `perspective(1400px) translate(0, -2%) scale(1.05) rotateX(10deg) rotateY(-8deg)`, offset: 0.6 }] : []
    const frames = [{ transform: there }, ...mid, { transform: "perspective(1400px)" }]
    return el.animate(reverse ? [...frames].reverse() : frames, { duration: reverse ? 380 : pickup ? 640 : 520, easing: reverse ? "cubic-bezier(0.4, 0, 0.2, 1)" : "cubic-bezier(0.2, 0.9, 0.25, 1.04)", fill: "both" })
  }
  useLayoutEffect(() => {
    at.setAttribute("data-x-open24-away", "")
    flip(false)
    done.current?.focus({ preventScroll: true })
    const r = setTimeout(() => setIn(true), 30)
    return () => { clearTimeout(r); at.removeAttribute("data-x-open24-away") }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Scroll zooms the opened photo (loupe take): a non-passive wheel so the page doesn't scroll under it
  useEffect(() => {
    const el = big.current
    if (!zoom || !el) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      el.style.setProperty("--ox", `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty("--oy", `${((e.clientY - r.top) / r.height) * 100}%`)
      setScale((s) => Math.min(3, Math.max(1, s * (e.deltaY < 0 ? 1.12 : 1 / 1.12))))
    }
    el.addEventListener("wheel", wheel, { passive: false })
    return () => el.removeEventListener("wheel", wheel)
  }, [zoom])
  const close = () => {
    if (closing.current) return
    closing.current = true
    setIn(false)
    setScale(1)
    const a = flip(true)
    const end = () => { at.removeAttribute("data-x-open24-away"); from.focus({ preventScroll: true }); onClose() }
    if (a) a.onfinish = end; else end()
  }
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close() }
    if (e.key === "Tab") {
      const f = [...(box.current?.querySelectorAll<HTMLElement>("button") ?? [])]
      const i = f.indexOf(document.activeElement as HTMLElement)
      e.preventDefault()
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus()
    }
  }
  const zoomed = <span className={`${P}-zoom`} style={{ transform: scale === 1 ? undefined : `scale(${scale})` }}>{print}</span>
  const bar = (
    <div className={`${P}-bar`}>
      {mode === "flip" && <button type="button" className={`${P}-act`} data-quiet aria-pressed={back} onClick={() => setBack(!back)}><RotateCcw className="size-5" aria-hidden />{back ? "Front" : "Turn over"}</button>}
      {zoom && <>
        <button type="button" className={`${P}-act`} data-quiet aria-label="Zoom in" onClick={() => setScale((s) => Math.min(3, s * 1.4))}><ZoomIn className="size-5" aria-hidden /></button>
        <button type="button" className={`${P}-act`} data-quiet aria-label="Zoom out" onClick={() => setScale((s) => Math.max(1, s / 1.4))}><ZoomOut className="size-5" aria-hidden /></button>
      </>}
      <button ref={done} type="button" className={`${P}-act`} onClick={close}><X className="size-5" aria-hidden />{t.story.done}</button>
    </div>
  )
  const meta = words && [words.year, words.place].filter(Boolean).join(" · ")
  return createPortal(
    <div ref={box} className={`${P}-dlg`} role="dialog" aria-modal="true" aria-label={label} data-mode={mode} data-table={table || undefined} data-in={inn || undefined} data-develop={develop || undefined} onKeyDown={keys}>
      <style>{commonCss}</style>
      <div className={`${P}-scrim`} onClick={close} aria-hidden />
      <div className={`${P}-body`}>
        <div ref={big} className={`${P}-big`}>
          {table && <span className={`${P}-pool`} aria-hidden />}
          <span className={`${P}-lift`} aria-hidden />
          {mode === "flip" && words ? (
            <span className={`${P}-card`} data-back={back || undefined} onClick={() => setBack(!back)}>
              <span className={`${P}-face ${P}-front`} aria-hidden={back}>{print}</span>
              <span className={`${P}-face ${P}-back`} aria-hidden={!back}>
                <h2>{words.title}</h2>
                {meta && <span className={`${P}-date`}>{meta}</span>}
                {words.body?.map((p, i) => <p key={i}>{p}</p>)}
              </span>
            </span>
          ) : zoom ? zoomed : print}
        </div>
        {mode === "flip" || !words ? bar : (
          <div className={`${P}-words`}>
            <h2>{words.title}</h2>
            {meta && <p className={`${P}-meta`}>{meta}</p>}
            {words.body?.map((p, i) => <p key={i}>{p}</p>)}
            {bar}
          </div>
        )}
      </div>
      <p className={`${P}-sr`} aria-live="polite">{mode === "flip" && back ? "The back of the print" : ""}</p>
    </div>,
    document.body,
  )
}
