import { useState, type CSSProperties } from "react"
import { ClipboardCopy } from "lucide-react"
import { Photo } from "@/components/photo"
import { StoryJourney } from "@/components/story-journey"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { STORY_PLAN } from "@/content/story-plan"
import { pending } from "@/content/pending"
import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { useKnob, setParam } from "../../params"
import { useSpeed } from "../../motion"
import { copyText, settingsNote } from "../../controls"
import { byId } from "../../registry"
import { privatePhoto } from "../../private"
import { ALL, GRIFFIN, NADIA, type Pick } from "./kids"

/**
 * The kid opener with every print to choose from (run 24, section 7): a front pair (Griffin, Nadia) and an optional
 * third print tucked half behind his. The choice lives in the address (k.griffin, k.nadia, k.behind), so the Options
 * sheet's Copy settings, or the Copy button here, gives Jehan a note to paste back.
 *
 * The cluster: instant-film frames (about 5% border, 18% at the bottom), the front pair tilted towards each other
 * (his clockwise, hers anticlockwise, leaning into his), washi tape across their overlap, the third print turned the
 * other way under his. Pictures not on the site yet come from the dev server only; a build shows a plain paper print.
 */
const P = "x-kp"
/** Private pictures only on the dev server: in a build the string never ships (vite's no-private-in-build guard) */
const priv = (file: string) => (import.meta.env.DEV ? privatePhoto(file) : null)

const css = `
.${P} { display: flex; flex-direction: column; gap: var(--space-4); }
/* The opener is the cluster alone, so it takes the words' room too: no empty band under it */
.${P} .story-slide-opener .story-media { height: auto; min-height: var(--stop-h); width: 100%; }
.${P}-cluster { position: relative; width: min(100%, 560px, calc((var(--stop-h) + 7rem) * 1.25)); aspect-ratio: 5 / 4; margin-inline: auto; }
.${P}-print { position: absolute; width: 50%; padding: 2.5% 2.5% 9%; border-radius: 2px; background: var(--brand-paper-bright);
  translate: 0 0; rotate: var(--r); transition: translate var(--duration-base) var(--ease-paper), rotate var(--duration-base) var(--ease-paper);
  box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .18), 0 1px 2px rgb(var(--tint-shadow) / .2), 0 14px 28px -14px rgb(var(--tint-shadow) / .5); }
[data-theme="lantern"] .${P}-print { box-shadow: 0 0 0 .5px rgb(0 0 0 / .3), 0 1px 2px rgb(0 0 0 / .35), 0 16px 30px -14px rgb(60 30 10 / .7); }
/* Wide: the third print half out to the left of his, the pair overlapping a little; without it the pair centres */
.${P}-print { width: 44%; }
.${P}-print[data-at="behind"] { left: 0; top: 2%; width: 40%; --r: -10deg; z-index: 1; filter: saturate(.9); }
.${P}-print[data-at="his"] { left: 21%; top: 9%; --r: 4deg; z-index: 2; }
.${P}-print[data-at="hers"] { left: 55%; top: 14%; --r: -6deg; z-index: 3; }
.${P}-cluster:not(:has([data-at="behind"])) [data-at="his"] { left: 8%; }
.${P}-cluster:not(:has([data-at="behind"])) [data-at="hers"] { left: 46%; }
.${P}-cluster:not(:has([data-at="behind"])) .${P}-tape { left: 40%; }
/* Phones: taller, so the pair is bigger and steps down; the third peeks out above his */
@media (max-width: 767px) {
  .${P}-cluster { aspect-ratio: 3 / 4; width: min(100%, calc((var(--stop-h) + 12rem) * 3 / 4)); }
  .${P}-print { width: 62%; }
  .${P}-print[data-at="behind"] { left: 40%; top: 0; width: 50%; --r: 9deg; }
  .${P}-print[data-at="his"], .${P}-cluster:not(:has([data-at="behind"])) [data-at="his"] { left: 0; top: 8%; }
  .${P}-print[data-at="hers"], .${P}-cluster:not(:has([data-at="behind"])) [data-at="hers"] { left: 37%; top: 33%; }
  .${P}-cluster .${P}-tape, .${P}-cluster:not(:has([data-at="behind"])) .${P}-tape { left: 40%; top: 30%; width: 22%; height: 5.5%; }
}
@media (hover: hover) { .${P}-print:hover { translate: 0 -6px; rotate: calc(var(--r) * .8); } }
.${P}-photo { position: relative; display: block; overflow: hidden; aspect-ratio: 4 / 5; background: var(--surface-alt);
  box-shadow: inset 0 0 0 .5px rgb(0 0 0 / .18); }
.${P}-photo img { position: absolute; max-width: none; height: auto; }
.${P}-photo .photo-print, .${P}-photo .photo-print > div { position: absolute; inset: 0; width: 100% !important; height: 100% !important; aspect-ratio: auto !important; margin: 0; }
.${P}-photo .photo-print .photo-img { object-position: 50% 30%; }
/* A print the build can't show: plain paper, a faint inner edge */
.${P}-blank { position: absolute; inset: 0; background: color-mix(in oklab, var(--brand-paper-bright) 88%, var(--ink) 4%); }
/* Washi tape across the overlap of the front pair */
.${P}-tape { position: absolute; z-index: 4; left: 53%; top: 10%; width: 16%; height: 7%; rotate: -14deg; opacity: .85;
  background: color-mix(in oklab, var(--brand-sabi) 42%, white); mask: linear-gradient(90deg, transparent 0, #000 3px calc(100% - 3px), transparent 100%);
  box-shadow: 0 1px 1px rgb(var(--tint-shadow) / .12); }
/* The picker: three groups of small radio thumbnails */
.${P}-pick { border-top: 1px solid var(--line-hairline); padding-top: var(--space-3); }
.${P}-pick summary { display: inline-flex; align-items: center; min-height: 44px; cursor: pointer; font-weight: 500; color: var(--ink); }
.${P}-pick summary:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; border-radius: 4px; }
.${P}-groups { display: grid; gap: var(--space-4); padding-top: var(--space-2); }
@media (min-width: 1024px) { .${P}-groups { grid-template-columns: 1fr 1fr 1.3fr; } }
.${P}-group legend { margin-bottom: var(--space-2); }
.${P}-opts { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-2); }
.${P}-opt { display: flex; align-items: center; gap: var(--space-2); min-height: 48px; padding: 4px 8px 4px 4px; border-radius: var(--radius-control);
  border: 1px solid var(--line-hairline); font-size: var(--type-small-size); line-height: 1.25; color: var(--ink); cursor: pointer; }
.${P}-opt:has(input:checked) { border-color: var(--action); background: color-mix(in oklab, var(--action) 8%, transparent); }
.${P}-opt:has(input:focus-visible) { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.${P}-opt input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.${P}-thumb { position: relative; flex: none; width: 36px; }
.${P}-thumb .${P}-photo { box-shadow: 0 0 0 1px var(--line-hairline); }
@media (prefers-reduced-motion: reduce) { .${P}-print { transition: none; } .${P}-print:hover { translate: none; rotate: var(--r); } }
`

/** The picture inside a print, cropped to the face: an <img> placed so `at` sits in the frame's middle at zoom z */
function Picture({ p, sizes }: { p: Pick; sizes: string }) {
  const [failed, setFailed] = useState(false)
  if (p.photo) return <span className={`${P}-photo`}><Photo name={p.photo} treatment="print" sizes={sizes} /></span>
  const src = priv(p.file!)
  const [cx, cy] = p.at ?? [0.5, 0.5], z = p.z ?? 1, a = p.a ?? 0.8
  // Kept inside the picture (no paper showing at an edge) unless it's turned
  const clamp = (v: number, h: number) => (p.rot ? v : Math.min(1 - h, Math.max(h, v)))
  const x = clamp(cx, 0.5 / z), y = clamp(cy, (0.625 * a) / z)
  const style: CSSProperties = { width: `${z * 100}%`, left: `${50 - x * z * 100}%`, top: `${50 - (y * z * 100) / (1.25 * a)}%`,
    transformOrigin: `${x * 100}% ${y * 100}%`, transform: p.rot ? `rotate(${p.rot}deg)` : undefined }
  return (
    <span className={`${P}-photo`}>
      {!src || failed
        ? <span className={`${P}-blank`} role="img" aria-label={p.alt} />
        : <img src={src} alt={p.alt} style={style} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />}
    </span>
  )
}

function Cluster({ his, hers, behind }: { his: Pick; hers: Pick; behind: Pick | null }) {
  return (
    <div className={`${P}-cluster`}>
      {behind && <span className={`${P}-print`} data-at="behind"><Picture p={behind} sizes="(min-width: 768px) 240px, 40vw" /></span>}
      <span className={`${P}-print`} data-at="his"><Picture p={his} sizes="(min-width: 768px) 280px, 46vw" /></span>
      <span className={`${P}-print`} data-at="hers"><Picture p={hers} sizes="(min-width: 768px) 280px, 46vw" /></span>
      <span aria-hidden className={`${P}-tape`} />
    </div>
  )
}

function Group({ legend, knob, items, value }: { legend: string; knob: string; items: { key: string; pick: Pick | null; label: string }[]; value: string }) {
  return (
    <fieldset className={`${P}-group`}>
      <legend className="label-caps text-muted-foreground">{legend}</legend>
      <div className={`${P}-opts`}>
        {items.map((it) => (
          <label key={it.key} className={`${P}-opt`}>
            <input type="radio" name={`${P}-${knob}`} value={it.key} checked={value === it.key} onChange={() => setParam(`k.${knob}`, it.key)} />
            <span aria-hidden className={`${P}-thumb`}>{it.pick ? <Picture p={{ ...it.pick, alt: "" }} sizes="36px" /> : <span className={`${P}-photo`}><span className={`${P}-blank`} /></span>}</span>
            {it.label.replace(/ \(.*\)$/, "")}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function KidPicker() {
  const { t, lang } = useLang()
  const { theme } = useTheme()
  const speed = useSpeed()
  const { story, ready } = useContent()
  const g = useKnob("griffin", "portrait"), n = useKnob("nadia", "home"), b = useKnob("behind", "g-first-day")
  const his = GRIFFIN.find((p) => p.id === g) ?? GRIFFIN[0], hers = NADIA.find((p) => p.id === n) ?? NADIA[0]
  // The third print can't be one already at the front
  const behind = b === `g-${his.id}` || b === `n-${hers.id}` ? null : ALL.find((p) => p.key === b) ?? null
  const chapters = ready && story.length ? story : STORY_PLAN.map((c) => (c.body.length ? c : { ...c, body: [pending("story.chapterBody", lang)] }))
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async () => {
    const e = byId("kid-picker")
    if (!e) return
    const note = settingsNote(e, theme, speed)
    setCopied((await copyText(note)) ? null : note)
  }
  return (
    <div className={P}>
      <style>{css}</style>
      <PageHeader title={t.story.title} lettering="ourStory" />
      <StoryJourney chapters={chapters} opener={<Cluster his={his} hers={hers} behind={behind} />} />
      <details className={`${P}-pick`}>
        <summary>Pick the kid photos</summary>
        <div className={`${P}-groups`}>
          <Group legend="Griffin, in front" knob="griffin" value={his.id} items={GRIFFIN.map((p) => ({ key: p.id, pick: p, label: p.label }))} />
          <Group legend="Nadia, in front" knob="nadia" value={hers.id} items={NADIA.map((p) => ({ key: p.id, pick: p, label: p.label }))} />
          <Group legend="Behind his (optional)" knob="behind" value={behind ? b : "none"}
            items={[{ key: "none", pick: null, label: "None" }, ...ALL.filter((p) => p.key !== `g-${his.id}` && p.key !== `n-${hers.id}`).map((p) => ({ key: p.key, pick: p, label: `${p.key[0] === "g" ? "Griffin" : "Nadia"}: ${p.label}` }))]} />
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <Button variant="secondary" size="sm" className="self-start" onClick={copy}><ClipboardCopy aria-hidden />Copy settings</Button>
          {copied && <label className="flex flex-col gap-1 text-small">Copying wasn't allowed, so here it is:<textarea className="field" rows={7} readOnly value={copied} onFocus={(ev) => ev.currentTarget.select()} /></label>}
        </div>
      </details>
    </div>
  )
}
