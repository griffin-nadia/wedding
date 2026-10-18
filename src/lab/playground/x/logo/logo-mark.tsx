import { Moon, Sun, VolumeX } from "lucide-react"
import { useLang } from "@/lib/lang"
import { useKnob, useTake } from "../../params"

/**
 * The bar's mark (lab run 19): today's G&N set in Oranienbaum, against a G and an N cut from Nadia's own lettering of
 * the names (the same masks the names use, public/art/names), with her "&" between. Shown in the top bar at its real
 * size, in Light and Lantern at once, and three times up to see the cut.
 * - type: today's mark
 * - lettering: her G and N in the ink, her "&" in the sage, as the names are
 * - one-ink: her G, "&" and N all in the ink (quieter at 20 px)
 * The cut, measured from the mask's ink (1040 × 274): the G is columns 10 to 114 (it joins the r at 111 to 128,
 * cut at its thinnest), the N 582 to 739 (on its own), the "&" 486 to 540; all three share rows 10 to 272 (the G's tail goes below the line), so they
 * keep her baseline. The words stay as text for screen readers (the link's name is "G&N").
 */
const P = "x-lm"
const MASK = { w: 1040, h: 274, top: 10, rows: 262 }
const PARTS = { g: [10, 114], amp: [486, 540], n: [582, 739] } as const
const url = (m: string) => `image-set(url(${import.meta.env.BASE_URL}art/names/${m}-520.webp) 1x, url(${import.meta.env.BASE_URL}art/names/${m}-1040.webp) 2x)`
const css = `
.${P} { width: 100%; display: flex; flex-direction: column; gap: var(--space-4); }
.${P}-bar { display: flex; align-items: center; gap: var(--space-3); height: var(--bar-h, 56px); padding-inline: var(--space-4); border-radius: var(--radius-control);
  background: var(--letter-bg); color: var(--ink); box-shadow: inset 0 0 0 1px var(--line-hairline); }
.${P}-bar .site-mark { margin-right: auto; }
.${P}-bar .ico { display: grid; place-items: center; width: 44px; height: 44px; color: var(--ink-soft); }
.${P}-bar .ico svg { width: 20px; height: 20px; }
.${P}-cap { font: 500 var(--type-small-size) / 1.3 var(--font-label); color: var(--ink-muted); }
.${P}-mark { display: inline-flex; align-items: flex-start; gap: calc(var(--h) * .02); height: var(--h); }
.${P}-part { display: block; height: var(--h); background: var(--ink); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }
.${P}-part.amp { background: var(--fill-amp, var(--action)); }
.${P}-big { --h: 84px; padding: var(--space-4); border-radius: var(--radius-control); background: var(--letter-bg); box-shadow: inset 0 0 0 1px var(--line-hairline); display: flex; justify-content: center; }
.${P}-big .site-mark { font-size: calc(var(--type-heading-size) * 3); }
`
function Lettered({ oneInk }: { oneInk: boolean }) {
  // One mask pixel in CSS px, at this height; each part is a window onto the mask at its own columns
  const part = (k: keyof typeof PARTS, m: string) => {
    const [a, b] = PARTS[k]
    const s = `calc(var(--h) / ${MASK.rows})`
    return (
      <span aria-hidden className={`${P}-part ${k === "amp" ? "amp" : ""}`} style={{
        width: `calc(${b - a} * ${s})`,
        WebkitMaskImage: url(m), maskImage: url(m),
        WebkitMaskSize: `calc(${MASK.w} * ${s}) calc(${MASK.h} * ${s})`, maskSize: `calc(${MASK.w} * ${s}) calc(${MASK.h} * ${s})`,
        WebkitMaskPosition: `calc(${-a} * ${s}) calc(${-MASK.top} * ${s})`, maskPosition: `calc(${-a} * ${s}) calc(${-MASK.top} * ${s})`,
      }} />
    )
  }
  return (
    <span className={`${P}-mark`} style={oneInk ? { ["--fill-amp" as string]: "var(--ink)" } : undefined}>
      {part("g", "names-mask")}{part("amp", "amp-mask")}{part("n", "names-mask")}
    </span>
  )
}

export default function LogoMark() {
  const take = useTake("lettering")
  const size = useKnob("size", 30)
  const { t } = useLang()
  const mark = (big = false) => take === "type"
    ? <span className="site-mark">{t.meta.shortTitle}</span>
    : <span className="site-mark" role="img" aria-label={t.meta.shortTitle} style={{ ["--h" as string]: big ? "84px" : `${size}px` }}><Lettered oneInk={take === "one-ink"} /></span>
  return (
    <div className={P}>
      <style>{css}</style>
      {(["autumn", "lantern"] as const).map((th) => (
        <div key={th} className="flex flex-col gap-2">
          <p className={`${P}-cap`}>{th === "autumn" ? "Light" : "Lantern"}: the top bar at its real size</p>
          <div data-theme={th} className={`${P}-bar`}>{mark()}<span aria-hidden className="ico"><VolumeX /></span><span aria-hidden className="ico">{th === "autumn" ? <Moon /> : <Sun />}</span></div>
        </div>
      ))}
      <p className={`${P}-cap`}>Three times up, to see the cut</p>
      <div className={`${P}-big`}>{mark(true)}</div>
      <div data-theme="lantern" className={`${P}-big`}>{mark(true)}</div>
    </div>
  )
}
