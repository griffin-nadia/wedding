import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { SCENES, photoFor } from "@/lib/scenes"
import { art } from "../opening/art"
import { useKnob, useTake } from "../../params"

/**
 * Arrival framing on phones (lab run 19): their photo behind the sealed envelope at four phone sizes, with where
 * their faces are (scenes.json, face: the box round both faces) and where the envelope sits, so it's plain whether
 * the envelope covers a face. The envelope and its label sit as on the site (index.css .arrival, polish.css): 260 px
 * wide at Nadia's ratio, 16 px above the 44 px label, max(5svh, 24px) off the bottom.
 * - today: object-fit cover, centred (the site on phones)
 * - zoom: the photo grows from its bottom edge just enough that both faces clear the envelope by 24 px, and slides
 *   sideways so the faces sit in the middle (one transform; the smallest zoom for each size)
 * - lift: no zoom; the photo moves up so the faces clear the envelope, and its bottom fades into the card's paper
 *   behind the envelope (a transform and a mask)
 * The numbers under each phone are what the main run would ship (docs/lab.md).
 */
const PHONES = [{ name: "Small Android", w: 360, h: 780 }, { name: "iPhone 14", w: 390, h: 844 }, { name: "Pixel 8", w: 412, h: 915 }, { name: "iPhone Pro Max", w: 430, h: 932 }]
const ENV_W = 260, ENV_H = Math.round(260 / 1.3948), LABEL = 44, GAP = 16, CLEAR = 24
const P = "x-af"
const css = `
.${P} { min-height: 100svh; display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-5) var(--space-4) 120px; background: var(--surface-paper); color: var(--ink-soft); }
.${P}-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
@media (min-width: 900px) { .${P}-row { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.${P}-cell { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.${P}-phone { position: relative; width: 100%; overflow: hidden; border-radius: 18px; box-shadow: 0 0 0 6px #1b1410, var(--elevation-sheet); background: var(--scene-scrim, #222); container-type: inline-size; }
.${P}-screen { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.${P}-screen img.photo { position: absolute; max-width: none; transform-origin: 50% 100%; }
.${P}-face { position: absolute; border: 2px dashed #ffd36a; border-radius: 10px; box-shadow: 0 0 0 1px rgb(0 0 0 / .35); }
.${P}-env { position: absolute; width: ${ENV_W}px; filter: drop-shadow(0 18px 22px rgb(0 0 0 / .3)); }
.${P}-label { position: absolute; left: 0; right: 0; height: ${LABEL}px; display: grid; place-items: center; color: #fff; text-shadow: 0 1px 6px rgb(0 0 0 / .45); font: 400 18px / 1 var(--font-display); }
.${P}-fade { position: absolute; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent, var(--letter-bg) 70%); }
.${P}-cap { font: 500 var(--type-small-size) / 1.35 var(--font-label); }
.${P}-cap b { color: var(--ink); }
.${P}-cap[data-bad] b { color: var(--ink-story); }
.${P}-note { max-width: 70ch; font-size: var(--type-small-size); }
`
type Fit = { iw: number; ih: number; left: number; top: number; s: number; dy: number; face: { x0: number; y0: number; x1: number; y1: number }; envTop: number; clear: number }

/** Where everything lands on a W × H phone for a take, in that phone's own CSS pixels */
function fit(W: number, H: number, photo: keyof typeof SCENES, take: string): Fit {
  const m = SCENES[photo], [fx0, fy0, fx1, fy1] = m.face ?? [0.4, 0.4, 0.6, 0.6]
  const c = Math.max(W / m.w, H / m.h), iw = m.w * c, ih = m.h * c
  const envTop = H - Math.max(0.05 * H, 24) - LABEL - GAP - ENV_H
  const top = (H - ih) / 2
  let left = (W - iw) / 2, s = 1, dy = 0
  const faceAt = () => ({ x0: left + (W / 2 - left) * (1 - s) + fx0 * iw * s, x1: left + (W / 2 - left) * (1 - s) + fx1 * iw * s, y0: H - s * (H - (top + fy0 * ih)) + dy, y1: H - s * (H - (top + fy1 * ih)) + dy })
  if (take !== "today") {
    // Centre the faces sideways, as far as the photo's edges allow
    const cx = ((fx0 + fx1) / 2) * iw
    left = Math.min(0, Math.max(W - iw, W / 2 - cx))
    const need = envTop - CLEAR // the faces' bottom must be above this
    const fyb = top + fy1 * ih
    if (take === "zoom" && fyb > need) s = (H - need) / (H - fyb)
    if (take === "lift" && fyb > need) dy = need - fyb
  }
  const face = faceAt()
  return { iw, ih, left, top, s, dy, face, envTop, clear: Math.round(envTop - face.y1) }
}

export default function ArrivalFraming() {
  const take = useTake("today")
  const faces = useKnob("faces", "on")
  const { theme } = useTheme()
  const { t } = useLang()
  const photo = photoFor(theme) as keyof typeof SCENES
  const base = import.meta.env.BASE_URL
  return (
    <div className={P}>
      <style>{css}</style>
      <p className={`${P}-note`}>Their {photo === "kyoto-view" ? "day" : "night"} photo behind the sealed envelope, four phone sizes. The dashed box is both faces (scenes.json). Switch the theme for the other photo.</p>
      <div className={`${P}-row`}>
        {PHONES.map((ph) => {
          const f = fit(ph.w, ph.h, photo, take)
          const ok = f.clear >= 0
          return (
            <figure key={ph.name} className={`${P}-cell`}>
              <div className={`${P}-phone`} style={{ aspectRatio: `${ph.w} / ${ph.h}` }}>
                {/* The screen at its real size in CSS px, scaled down to the cell (container query units) */}
                <div className={`${P}-screen`} style={{ width: ph.w, height: ph.h, transform: `scale(calc(100cqw / ${ph.w}px))` }}>
                  <img className="photo" alt="" src={`${base}scenes/${photo}-1200.webp`} style={{ left: f.left, top: f.top, width: f.iw, height: f.ih, transform: `translateY(${f.dy}px) scale(${f.s})`, transformOrigin: `${ph.w / 2 - f.left}px ${ph.h - f.top}px` }} />
                  {take === "lift" && f.dy < 0 && <span className={`${P}-fade`} style={{ height: -f.dy + 40 }} />}
                  {faces === "on" && <span className={`${P}-face`} style={{ left: f.face.x0, top: f.face.y0, width: f.face.x1 - f.face.x0, height: f.face.y1 - f.face.y0 }} />}
                  <img className={`${P}-env`} alt="" src={art("closed", 410)} style={{ left: (ph.w - ENV_W) / 2, top: f.envTop }} />
                  <span className={`${P}-label`} style={{ top: f.envTop + ENV_H + GAP }}>{t.letter.note}</span>
                </div>
              </div>
              <figcaption className={`${P}-cap`} data-bad={ok ? undefined : ""}>
                {ph.name}, {ph.w} × {ph.h}: <b>{ok ? `faces clear by ${f.clear} px` : `envelope over the faces by ${-f.clear} px`}</b>
                {take === "zoom" && f.s > 1 && <> · zoom {f.s.toFixed(3)}</>}
                {take === "lift" && f.dy < 0 && <> · up {Math.round(-f.dy)} px</>}
                {take !== "today" && <> · x {Math.round(f.left)} px</>}
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  )
}
