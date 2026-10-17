import { useState, type ReactNode } from "react"
import { flushSync } from "react-dom"
import { useLang } from "@/lib/lang"
import { Letter } from "@/components/letter/letter"
import { DayPage } from "@/pages/day"
import { TravelPage } from "@/pages/travel"
import { StoryPage } from "@/pages/our-story"
import { FaqsPage } from "@/pages/faqs"
import { Stage } from "../../stage"
import { still } from "../../motion"

/**
 * Paper laid on paper: on a page change the letter you were reading sinks back (to 96%, a little darker, its shadow
 * softening) while the new one settles onto it from just above (102% to 100%) as it fades in. A view transition on
 * the letter, so the photo and the tabs never move. Without View Transitions, and under reduced motion, a plain cut.
 */
const PAGES: { key: "day" | "travel" | "story" | "faqs"; page: () => ReactNode }[] = [
  { key: "day", page: () => <DayPage /> }, { key: "travel", page: () => <TravelPage /> }, { key: "story", page: () => <StoryPage /> }, { key: "faqs", page: () => <FaqsPage /> },
]
const css = `
.x-dp { position: fixed; inset: 0; overflow-y: auto; padding: var(--space-5) 12px 110px; }
@media (min-width: 768px) { .x-dp { padding-top: 88px; } }
.x-dp .letter { max-width: var(--letter-width); margin-inline: auto; view-transition-name: x-dp-letter; }
.x-dp-tabs { position: fixed; z-index: 5; left: 50%; bottom: calc(var(--space-4) + env(safe-area-inset-bottom)); translate: -50% 0; background: var(--letter-bg); box-shadow: var(--elevation-paper); }
@media (min-width: 768px) { .x-dp-tabs { top: var(--space-4); bottom: auto; } }
.x-dp-tabs [data-on="true"] { background: var(--input-selected-bg); box-shadow: inset 0 0 0 2px var(--input-selected-line); }
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
::view-transition-old(x-dp-letter) { animation: x-dp-sink 420ms cubic-bezier(0.4, 0, 0.2, 1) both; transform-origin: 50% 30%; }
::view-transition-new(x-dp-letter) { animation: x-dp-settle 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both; transform-origin: 50% 30%; }
::view-transition-group(x-dp-letter) { animation-duration: 520ms; }
@keyframes x-dp-sink { to { transform: scale(0.96); opacity: 0; filter: brightness(0.9); } }
@keyframes x-dp-settle { from { transform: scale(1.02) translateY(-6px); opacity: 0; } }
`

export default function Depth() {
  const { t } = useLang()
  const [at, setAt] = useState(0)
  const go = (i: number) => {
    if (i === at) return
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    const swap = () => { flushSync(() => setAt(i)); document.querySelector(".x-dp")?.scrollTo({ top: 0 }) }
    if (!doc.startViewTransition || still()) return swap()
    doc.startViewTransition(swap)
  }
  return (
    <Stage photo className="!p-0">
      <style>{css}</style>
      <div className="x-dp"><Letter id="letter"><div className="letter-body">{PAGES[at].page()}</div></Letter></div>
      <div className="x-dp-tabs segmented" role="tablist" aria-label="Pages">
        {PAGES.map((p, i) => <button key={p.key} type="button" role="tab" aria-selected={i === at} data-on={i === at} className="segmented-item" onClick={() => go(i)}>{t.nav[p.key]}</button>)}
      </div>
    </Stage>
  )
}
