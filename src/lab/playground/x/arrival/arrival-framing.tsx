import { useEffect, useRef, useState } from "react"
import { SCENES } from "@/lib/scenes"
import { liveUrl, openLive } from "../../registry"
import { useKnob, useTake } from "../../params"

/**
 * Arrival framing on phones (lab run 19): the live site's sealed envelope at four phone sizes, each in its own frame,
 * measured where it stands, so this never goes stale. For each phone: where their faces land (scenes.json's face box,
 * through the photo's real object-fit and object-position, as src/lib/face.ts does) and where the envelope is, and
 * how far apart they are.
 * - site: the site as it is (since #178: the photo in the top 60% of the screen, fading out where the envelope floats)
 * - zoom: the alternative that keeps the photo full screen: no box and no fade; the photo grows from its bottom edge
 *   just enough that both faces clear the envelope by 24 px, and slides sideways so the faces sit in the middle. It's
 *   injected into the same live page (one style), worked out from that page's own envelope.
 * Light shows the day photo, Lantern the night one.
 */
const PHONES = [{ name: "Small Android", w: 360, h: 780 }, { name: "iPhone 14", w: 390, h: 844 }, { name: "Pixel 8", w: 412, h: 915 }, { name: "iPhone Pro Max", w: 430, h: 932 }]
const CLEAR = 24
const P = "x-af"
const css = `
.${P} { min-height: 100svh; display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-5) var(--space-4) 120px; background: var(--surface-paper); color: var(--ink-soft); }
.${P}-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
@media (min-width: 900px) { .${P}-row { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.${P}-cell { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.${P}-phone { position: relative; width: 100%; overflow: hidden; border-radius: 18px; box-shadow: 0 0 0 6px #1b1410, var(--elevation-sheet); background: #222; container-type: inline-size; }
.${P}-screen { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.${P}-screen iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; pointer-events: none; }
.${P}-face, .${P}-env { position: absolute; pointer-events: none; border-radius: 10px; }
.${P}-face { border: 2px dashed #ffd36a; box-shadow: 0 0 0 1px rgb(0 0 0 / .35); }
.${P}-env { border: 2px solid rgb(255 255 255 / .7); }
.${P}-cap { font: 500 var(--type-small-size) / 1.35 var(--font-label); }
.${P}-cap b { color: var(--ink); }
.${P}-cap[data-bad] b { color: var(--ink-story); }
.${P}-note { max-width: 70ch; font-size: var(--type-small-size); }
`
type Box = { x: number; y: number; w: number; h: number }
type Got = { face: Box; env: Box; clear: number; zoom?: number; x?: number }

/** The face box on the page the way src/lib/face.ts finds it: the shown photo, its cover scale and object-position */
function faceIn(doc: Document, wide: boolean): Box | null {
  const box = doc.querySelector<HTMLElement>("[data-photo].opacity-100"), img = box?.querySelector("img")
  const name = box?.dataset.photo as keyof typeof SCENES | undefined
  const meta = name && (wide && SCENES[name].wide ? SCENES[name].wide : SCENES[name])
  if (!img || !meta?.face || !img.complete) return null
  const r = img.getBoundingClientRect(), s = Math.max(r.width / meta.w, r.height / meta.h)
  const cs = doc.defaultView!.getComputedStyle(img)
  const [px, py] = cs.objectPosition.split(" ").map((v) => parseFloat(v) / 100)
  // (The zoom take's CSS scale is already in the rect, so the same sums hold)
  const ox = r.left + (r.width - meta.w * s) * (Number.isNaN(px) ? 0.5 : px), oy = r.top + (r.height - meta.h * s) * (Number.isNaN(py) ? 0.5 : py)
  const [x0, y0, x1, y1] = meta.face
  return { x: ox + x0 * meta.w * s, y: oy + y0 * meta.h * s, w: (x1 - x0) * meta.w * s, h: (y1 - y0) * meta.h * s }
}

function Phone({ ph, take, faces }: { ph: (typeof PHONES)[number]; take: string; faces: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [got, setGot] = useState<Got | null>(null)
  useEffect(() => {
    setGot(null)
    let alive = true, n = 0
    const poll = () => {
      if (!alive) return
      const doc = frame.current?.contentDocument
      const env = doc?.querySelector(".arrival .envelope")?.getBoundingClientRect()
      const face = doc && faceIn(doc, false)
      if (!doc || !env || !face || env.width === 0) { if (n++ < 80) setTimeout(poll, 150); return }
      // Let the sealed framing settle (it transitions in) before measuring
      if (n < 8) { n++; setTimeout(poll, 150); return }
      if (take === "zoom" && !doc.getElementById("x-af-zoom")) {
        // Full screen again, then just enough zoom from the bottom, faces centred
        const st = doc.createElement("style"); st.id = "x-af-zoom"
        st.textContent = `[data-sealed] .scene-photo { bottom: 0 !important; left: 0 !important; mask-image: none !important; transition: none !important; } [data-sealed] .scene-photo img { transition: none !important; }`
        doc.head.appendChild(st)
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const f0 = faceIn(doc, false), e0 = doc.querySelector(".arrival .envelope")!.getBoundingClientRect()
          const img = doc.querySelector<HTMLImageElement>("[data-photo].opacity-100 img")
          if (!f0 || !img) return
          const H = ph.h, need = e0.top - CLEAR, fb = f0.y + f0.h
          const s = fb > need ? (H - need) / (H - fb) : 1
          const r = img.getBoundingClientRect()
          const name = img.closest<HTMLElement>("[data-photo]")!.dataset.photo as keyof typeof SCENES
          const meta = SCENES[name], cover = Math.max(r.width / meta.w, r.height / meta.h), mw = meta.w * cover
          const cx = ((meta.face![0] + meta.face![2]) / 2) * mw, over = Math.max(0, mw - ph.w)
          const left = Math.min(0, Math.max(ph.w - mw, ph.w / 2 - cx)), xPct = over ? Math.round((-left / over) * 100) : 50
          st.textContent += ` [data-sealed] .scene-photo img { object-position: ${xPct}% 50% !important; scale: ${s.toFixed(3)}; transform-origin: 50% 100%; }`
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const face = faceIn(doc, false)!
            if (alive) setGot({ face, env: { x: e0.left, y: e0.top, w: e0.width, h: e0.height }, clear: Math.round(e0.top - (face.y + face.h)), zoom: s, x: xPct })
          }))
        }))
        return
      }
      setGot({ face, env: { x: env.left, y: env.top, w: env.width, h: env.height }, clear: Math.round(env.top - (face.y + face.h)) })
    }
    const f = frame.current
    const on = () => { n = 0; setTimeout(poll, 300) }
    f?.addEventListener("load", on)
    return () => { alive = false; f?.removeEventListener("load", on) }
  }, [take, ph])
  const ok = got ? got.clear >= 0 : true
  return (
    <figure className={`${P}-cell`}>
      <div className={`${P}-phone`} style={{ aspectRatio: `${ph.w} / ${ph.h}` }}>
        <div className={`${P}-screen`} style={{ width: ph.w, height: ph.h, transform: `scale(calc(100cqw / ${ph.w}px))` }}>
          <iframe ref={frame} key={take} title={`The live site, sealed, ${ph.w} by ${ph.h}`} src={liveUrl("/")} tabIndex={-1} />
          {got && faces && <span className={`${P}-face`} style={{ left: got.face.x, top: got.face.y, width: got.face.w, height: got.face.h }} />}
          {got && faces && <span className={`${P}-env`} style={{ left: got.env.x, top: got.env.y, width: got.env.w, height: got.env.h }} />}
        </div>
      </div>
      <figcaption className={`${P}-cap`} data-bad={ok ? undefined : ""} aria-live="polite">
        {ph.name}, {ph.w} × {ph.h}: <b>{!got ? "measuring…" : ok ? `faces clear by ${got.clear} px` : `envelope over the faces by ${-got.clear} px`}</b>
        {got?.zoom && got.zoom > 1 && <> · zoom {got.zoom.toFixed(3)}, x {got.x}%</>}
      </figcaption>
    </figure>
  )
}

export default function ArrivalFraming() {
  const take = useTake("site")
  const faces = useKnob("faces", "on") === "on"
  // The sealed envelope, as on a first visit (this origin only: the lab's dev server)
  const [ready] = useState(() => { openLive({ path: "/", arrival: true }); return true })
  return (
    <div className={P}>
      <style>{css}</style>
      <p className={`${P}-note`}>The live site, sealed, at four phone sizes. Dashed: both faces (scenes.json). Solid: the envelope. Light shows the day photo, Lantern the night one (switch in Options).</p>
      {ready && <div className={`${P}-row`}>{PHONES.map((ph) => <Phone key={ph.name} ph={ph} take={take} faces={faces} />)}</div>}
    </div>
  )
}
