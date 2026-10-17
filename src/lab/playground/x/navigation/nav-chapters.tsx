import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLang } from "@/lib/lang"
import { Letter } from "@/components/letter/letter"
import { HomePage } from "@/pages/home"
import { DayPage } from "@/pages/day"
import { TravelPage } from "@/pages/travel"
import { StoryPage } from "@/pages/our-story"
import { FaqsPage } from "@/pages/faqs"
import { nextFrame } from "@/lib/frame"
import { Stage } from "../../stage"
import { still } from "../../motion"

/**
 * No pages at all: the whole site is one letter you scroll, in five chapters, with a chapter bar along the top.
 * Each of its five segments fills as you read through that chapter and the current chapter's name sits beside it;
 * tap a segment to glide there (at once under reduced motion). The bar reads the scroll once a frame at most.
 */
const CHAPTERS: { key: "home" | "day" | "travel" | "story" | "faqs"; page: () => ReactNode }[] = [
  { key: "home", page: () => <HomePage /> }, { key: "day", page: () => <DayPage /> }, { key: "travel", page: () => <TravelPage /> },
  { key: "story", page: () => <StoryPage /> }, { key: "faqs", page: () => <FaqsPage /> },
]
const css = `
.x-nc-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 10; display: flex; align-items: center; gap: var(--space-3); padding: calc(var(--space-2) + env(safe-area-inset-top)) var(--space-4) var(--space-2); background: color-mix(in oklab, var(--letter-bg) 90%, transparent); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); box-shadow: 0 1px 0 var(--line-hairline); }
.x-nc-name { flex: none; min-width: 6.5em; font: 400 var(--type-body-size) / 1.2 var(--font-display); color: var(--ink); }
.x-nc-segs { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.x-nc-seg { position: relative; display: grid; align-items: center; min-height: 44px; outline: 2px solid transparent; outline-offset: 2px; border-radius: var(--radius-control); }
.x-nc-seg:focus-visible { outline-color: var(--input-focus); }
.x-nc-track { display: block; height: 4px; border-radius: var(--radius-pill); background: var(--line-hairline); overflow: hidden; }
.x-nc-fill { display: block; height: 100%; border-radius: inherit; background: var(--action); transform-origin: left; }
.x-nc-letter { padding: calc(72px + env(safe-area-inset-top)) 12px var(--space-8); }
.x-nc-letter .letter { max-width: var(--letter-width); margin-inline: auto; }
.x-nc-chapter + .x-nc-chapter { margin-top: var(--space-6); padding-top: var(--space-6); border-top: 1px solid var(--line-hairline); }
.x-nc-chapter { scroll-margin-top: 72px; }
.x-nc-chapter .page-header { position: static; }
`

export default function NavChapters() {
  const { t } = useLang()
  const [fill, setFill] = useState<number[]>([0, 0, 0, 0, 0])
  const [at, setAt] = useState(0)
  const parts = useRef<(HTMLElement | null)[]>([])
  useEffect(() => {
    let queued = false
    const read = () => {
      queued = false
      const view = innerHeight * 0.35
      const f = parts.current.map((el) => { if (!el) return 0; const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0, (view - r.top) / Math.max(1, r.height))) })
      setFill(f); setAt(Math.max(0, f.findIndex((v) => v < 1) === -1 ? 4 : f.findIndex((v) => v < 1)))
    }
    const on = () => { if (!queued) { queued = true; nextFrame(read) } }
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on)
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on) }
  }, [])
  return (
    <Stage photo className="!block !p-0">
      <style>{css}</style>
      <nav aria-label="Chapters" className="x-nc-bar">
        <span className="x-nc-name" aria-live="polite">{t.nav[CHAPTERS[at].key]}</span>
        <span className="x-nc-segs">
          {CHAPTERS.map((c, i) => (
            <button key={c.key} type="button" className="x-nc-seg" aria-label={t.nav[c.key]} aria-current={i === at ? "location" : undefined}
              onClick={() => parts.current[i]?.scrollIntoView({ behavior: still() ? "instant" : "smooth" })}>
              <span className="x-nc-track"><span className="x-nc-fill" style={{ transform: `scaleX(${fill[i]})` }} /></span>
            </button>
          ))}
        </span>
      </nav>
      <div className="x-nc-letter">
        <Letter id="letter">
          {CHAPTERS.map((c, i) => <section key={c.key} ref={(el) => { parts.current[i] = el }} className="x-nc-chapter letter-body" aria-label={t.nav[c.key]}>{c.page()}</section>)}
        </Letter>
      </div>
    </Stage>
  )
}
