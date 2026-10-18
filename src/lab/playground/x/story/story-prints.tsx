import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Photo } from "@/components/photo"
import { Segmented } from "@/components/segmented"
import { STORY_PLAN } from "@/content/story-plan"

/**
 * Experiment: nicer prints for Our story. The same print with four shadows (the site's, a soft contact shadow, a
 * lifted one with a long falloff, and a print taped to the table), and three backdrops behind it that change with
 * the chapter: none (the card's paper), the chapter's own photo blurred into a wash, or that wash drifting slowly
 * (a gentle Ken Burns). Backdrops cross-fade over 700 ms; reduced motion: no drift, a plain cut.
 */
const css = `
.x-pr { position: relative; isolation: isolate; min-height: var(--stage-h, 100svh); display: grid; place-items: center; gap: var(--space-5); padding: var(--space-6) var(--space-4); overflow: hidden; background: var(--letter-bg); color: var(--ink); }
.x-pr-back { position: absolute; inset: -40px; z-index: -1; opacity: 0; transition: opacity 700ms var(--ease-paper); }
.x-pr-back[data-on] { opacity: 1; }
.x-pr-back img { width: 100%; height: 100%; object-fit: cover; filter: blur(28px) saturate(1.1); }
.x-pr-back::after { content: ""; position: absolute; inset: 0; background: color-mix(in oklab, var(--letter-bg) 55%, transparent); }
@keyframes x-pr-drift { from { transform: scale(1.06) translate(-1.5%, -1%); } to { transform: scale(1.14) translate(1.5%, 1%); } }
@media (prefers-reduced-motion: no-preference) { .x-pr[data-back="drift"] .x-pr-back[data-on] img { animation: x-pr-drift 14s ease-in-out infinite alternate; } }
@media (prefers-reduced-motion: reduce) { .x-pr-back { transition: none; } }
.x-pr-print { width: min(72vw, 320px); transition: box-shadow 300ms var(--ease-paper); border-radius: 2px; }
.x-pr[data-shadow="soft"] .x-pr-print .photo-print { box-shadow: 0 1px 1px rgb(var(--tint-shadow) / 0.18), 0 6px 14px -6px rgb(var(--tint-shadow) / 0.35) !important; }
.x-pr[data-shadow="lifted"] .x-pr-print .photo-print { box-shadow: 0 2px 3px rgb(var(--tint-shadow) / 0.16), 0 18px 30px -12px rgb(var(--tint-shadow) / 0.38), 0 40px 70px -30px rgb(var(--tint-shadow) / 0.3) !important; }
.x-pr[data-shadow="taped"] .x-pr-print { position: relative; }
.x-pr[data-shadow="taped"] .x-pr-print .photo-print { box-shadow: 0 1px 2px rgb(var(--tint-shadow) / 0.2), 0 10px 18px -10px rgb(var(--tint-shadow) / 0.3) !important; }
.x-pr[data-shadow="taped"] .x-pr-print::before { content: ""; position: absolute; z-index: 2; top: -10px; left: 50%; width: 84px; height: 22px; translate: -50% 0; rotate: -3deg; background: color-mix(in oklab, var(--brand-wara) 70%, transparent); box-shadow: 0 1px 2px rgb(var(--tint-shadow) / 0.12); }
.x-pr-bar { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); }
.x-pr-nav { display: flex; align-items: center; gap: var(--space-3); }
.x-pr-cap { text-align: center; min-height: 3em; }
`
const SHADOWS = [{ value: "site", label: "Site" }, { value: "soft", label: "Soft" }, { value: "lifted", label: "Lifted" }, { value: "taped", label: "Taped" }] as const
const BACKS = [{ value: "none", label: "No backdrop" }, { value: "wash", label: "Photo wash" }, { value: "drift", label: "Drifting wash" }] as const
const chapters = STORY_PLAN.filter((c) => c.photo)

export default function StoryPrints() {
  const [at, setAt] = useState(0)
  const [shadow, setShadow] = useState<(typeof SHADOWS)[number]["value"]>("lifted")
  const [back, setBack] = useState<(typeof BACKS)[number]["value"]>("wash")
  const c = chapters[at]
  return (
    <div className="x-pr" data-shadow={shadow} data-back={back}>
      <style>{css}</style>
      {back !== "none" && chapters.map((ch, i) => (
        <div key={ch.key} aria-hidden className="x-pr-back" data-on={i === at || undefined}><Photo name={ch.photo!} treatment="full" sizes="40vw" alt="" /></div>
      ))}
      <div className="x-pr-bar">
        <Segmented label="Shadow" size="sm" value={shadow} onChange={setShadow} items={[...SHADOWS]} />
        <Segmented label="Backdrop" size="sm" value={back} onChange={setBack} items={[...BACKS]} />
      </div>
      <div className="x-pr-print"><Photo key={c.key} name={c.photo!} treatment="print" vary sizes="320px" alt={`${c.title}, ${c.year}`} /></div>
      <p className="x-pr-cap"><span className="text-small text-muted-foreground">{c.year}{c.place ? ` · ${c.place}` : ""}</span><br /><span className="font-display text-heading">{c.title}</span></p>
      <div className="x-pr-nav">
        <button type="button" className="utility-btn" aria-label="Previous chapter" disabled={at === 0} onClick={() => setAt(at - 1)}><ChevronLeft className="size-5" aria-hidden /></button>
        <span className="text-small">{at + 1} of {chapters.length}</span>
        <button type="button" className="utility-btn" aria-label="Next chapter" disabled={at === chapters.length - 1} onClick={() => setAt(at + 1)}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
    </div>
  )
}
