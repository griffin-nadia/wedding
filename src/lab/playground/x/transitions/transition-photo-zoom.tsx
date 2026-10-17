import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { ArrowLeft } from "lucide-react"
import { useLang } from "@/lib/lang"
import { STORY_PLAN } from "@/content/story-plan"
import { pending } from "@/content/pending"
import { Photo } from "@/components/photo"
import { Stage } from "../../stage"
import { still } from "../../motion"

/**
 * Our story's prints laid out on the letter. Tap one and, with View Transitions, that very print grows into the
 * chapter's page (one shared element from its place in the grid to the top of the page) while the words fade in;
 * Back shrinks it home into its place. Browsers without View Transitions, and reduced motion, cross-fade instead.
 */
const CH = STORY_PLAN.filter((c) => c.photo)
const css = `
.x-pz { width: min(100%, 980px); padding: var(--space-5); border-radius: var(--letter-radius); background: var(--letter-bg); }
.x-pz-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
@media (min-width: 900px) { .x-pz-grid { grid-template-columns: repeat(4, 1fr); } }
.x-pz-item { display: flex; flex-direction: column; gap: var(--space-2); text-align: left; border-radius: var(--radius-control); outline: 2px solid transparent; outline-offset: 4px; }
.x-pz-item:focus-visible { outline-color: var(--input-focus); }
.x-pz-item .photo-print > div, .x-pz-hero .photo-print > div { aspect-ratio: 3 / 4 !important; height: auto; width: 100%; }
.x-pz-item small { font: 500 var(--type-label-size) / 1.3 var(--font-label); color: var(--ink-muted); }
.x-pz-page { display: grid; gap: var(--space-5); align-items: start; }
@media (min-width: 900px) { .x-pz-page { grid-template-columns: 360px 1fr; } }
.x-pz-hero { width: min(100%, 360px); justify-self: center; }
.x-pz-words { display: flex; flex-direction: column; gap: var(--space-3); }
::view-transition-group(x-pz-photo) { animation-duration: 520ms; animation-timing-function: cubic-bezier(0.2, 0.9, 0.2, 1); }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 320ms; }
`

export default function PhotoZoom() {
  const { t, lang } = useLang()
  const [open, setOpen] = useState<number | null>(null)
  const last = useRef<number | null>(null)
  const back = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (open !== null) back.current?.focus({ preventScroll: true }); else if (last.current !== null) document.querySelector<HTMLElement>(`[data-x-pz="${last.current}"]`)?.focus({ preventScroll: true }) }, [open])
  const swap = (next: number | null, from: HTMLElement | null) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }
    if (!doc.startViewTransition || still()) { setOpen(next); return }
    // The tapped print (or the open page's print) carries the name, so the browser moves that one element
    if (from) from.style.viewTransitionName = "x-pz-photo"
    const vt = doc.startViewTransition(() => {
      if (from) from.style.viewTransitionName = ""
      flushSync(() => setOpen(next))
      const to = document.querySelector<HTMLElement>(next === null ? `[data-x-pz="${last.current}"] .photo-print` : ".x-pz-hero")
      if (to) to.style.viewTransitionName = "x-pz-photo"
    })
    vt.finished.finally(() => document.querySelectorAll<HTMLElement>(".x-pz [style*='view-transition-name']").forEach((el) => { el.style.viewTransitionName = "" }))
  }
  const c = open !== null ? CH[open] : null
  return (
    <Stage photo hint={c ? undefined : "Tap a print"}>
      <style>{css}</style>
      <section className="x-pz paper-feel" aria-label={t.story.title}>
        {c ? (
          <div className="x-pz-page">
            <button ref={back} type="button" className="btn-text inline-flex min-h-11 items-center gap-2 self-start text-small" style={{ gridColumn: "1 / -1" }}
              onClick={(e) => { last.current = open; swap(null, (e.currentTarget.parentElement?.querySelector(".x-pz-hero") as HTMLElement) ?? null) }}>
              <ArrowLeft className="size-4" aria-hidden />{t.story.title}
            </button>
            <div className="x-pz-hero"><Photo name={c.photo!} treatment="print" sizes="360px" alt={`${c.title}, ${c.year}`} /></div>
            <div className="x-pz-words">
              <p className="text-small text-muted-foreground">{c.year} · {c.place}</p>
              <h2 className="heading">{c.title}</h2>
              <p>{c.body[0] ?? pending("story.chapterBody", lang)}</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="heading mb-5">{t.story.title}</h2>
            <ul className="x-pz-grid">
              {CH.map((ch, i) => (
                <li key={ch.key}>
                  <button type="button" data-x-pz={i} className="x-pz-item w-full" onClick={(e) => { last.current = i; swap(i, e.currentTarget.querySelector(".photo-print")) }}>
                    <Photo name={ch.photo!} treatment="print" sizes="(min-width: 900px) 220px, 45vw" alt="" />
                    <span className="font-medium text-foreground">{ch.title}</span>
                    <small>{ch.year}</small>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </Stage>
  )
}
