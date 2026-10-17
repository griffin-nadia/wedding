import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { BookOpen, CalendarDays, CircleHelp, Home, TrainFront } from "lucide-react"
import { useLang } from "@/lib/lang"
import { Letter } from "@/components/letter/letter"
import { HomePage } from "@/pages/home"
import { DayPage } from "@/pages/day"
import { TravelPage } from "@/pages/travel"
import { StoryPage } from "@/pages/our-story"
import { FaqsPage } from "@/pages/faqs"
import { Stage } from "../../stage"
import { spring } from "../../motion"

/**
 * The nav with an ink stroke for the current page instead of a tinted pill: tap another page and the stroke's
 * leading edge runs ahead while its trailing edge catches up (two springs, one stiffer), so it stretches like a brush
 * dragged across and settles under the new label. A dock on phones, a top bar on laptops; the real pages show under
 * it. Reduced motion: the stroke moves at once.
 */
const PAGES: { key: "home" | "day" | "travel" | "story" | "faqs"; icon: typeof Home; page: () => ReactNode }[] = [
  { key: "home", icon: Home, page: () => <HomePage /> },
  { key: "day", icon: CalendarDays, page: () => <DayPage /> },
  { key: "travel", icon: TrainFront, page: () => <TravelPage /> },
  { key: "story", icon: BookOpen, page: () => <StoryPage /> },
  { key: "faqs", icon: CircleHelp, page: () => <FaqsPage /> },
]
// A brush stroke: fuller in the middle, dry at the ends
const BRUSH = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M1 6.2C10 3.6 22 3 38 3.4S70 3 86 3.6 99 4.6 99 5.6s-4 2-14 2.2-30 .6-48 .4S6 8.4 2 7.6 0 6.6 1 6.2Z"/></svg>')}")`
const css = `
.x-ni { position: fixed; inset: 0; display: flex; flex-direction: column; }
.x-ni-page { flex: 1; overflow-y: auto; padding: var(--space-5) 12px 120px; }
.x-ni-page .letter { max-width: var(--letter-width); margin-inline: auto; }
.x-ni-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); background: color-mix(in oklab, var(--letter-bg) 86%, transparent); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-top: 1px solid var(--line-hairline); }
.x-ni-list { position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; max-width: 720px; margin-inline: auto; }
.x-ni-link { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 52px; color: var(--ink-muted); font: 500 var(--type-label-size) / 1.2 var(--font-label); border-radius: var(--radius-control); outline: 2px solid transparent; outline-offset: -2px; transition: color var(--duration-fast); }
.x-ni-link[aria-current] { color: var(--ink); }
.x-ni-link:focus-visible { outline-color: var(--input-focus); }
.x-ni-ink { position: absolute; bottom: 4px; height: 7px; background: var(--action); -webkit-mask: ${BRUSH} center / 100% 100% no-repeat; mask: ${BRUSH} center / 100% 100% no-repeat; pointer-events: none; opacity: 0.85; }
@media (min-width: 768px) {
  .x-ni-bar { top: 0; bottom: auto; padding: 8px 24px; border-top: 0; border-bottom: 1px solid var(--line-hairline); }
  .x-ni-page { padding: 96px 24px 64px; }
  .x-ni-link { flex-direction: row; min-height: 44px; font-size: var(--type-small-size); }
  .x-ni-link svg { display: none; }
  .x-ni-ink { bottom: 2px; height: 8px; }
}
`

export default function NavInk() {
  const { t } = useLang()
  const [at, setAt] = useState(0)
  const list = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState<{ l: number; r: number } | null>(null)
  const pos = useRef({ l: 0, r: 0 }), stops = useRef<(() => void)[]>([])
  const page = useRef<HTMLDivElement>(null)
  // Where the stroke goes: under the label, a little wider than it
  const target = (i: number) => {
    const ul = list.current, a = ul?.querySelectorAll("a")[i]?.querySelector("span")
    if (!ul || !a) return null
    const r = a.getBoundingClientRect(), u = ul.getBoundingClientRect()
    return { l: r.left - u.left - 6, r: r.right - u.left + 6 }
  }
  useLayoutEffect(() => {
    const place = () => { const tgt = target(at); if (tgt) { pos.current = tgt; setEdge(tgt) } }
    place()
    const ro = new ResizeObserver(place); if (list.current) ro.observe(list.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const go = (i: number) => {
    const tgt = target(i)
    setAt(i); page.current?.scrollTo({ top: 0 })
    if (!tgt) return
    stops.current.forEach((s) => s())
    const right = tgt.l > pos.current.l
    // The edge in front leads (stiff), the one behind follows (soft)
    stops.current = [
      spring(pos.current.l, tgt.l, (v) => { pos.current.l = v; setEdge({ ...pos.current }) }, right ? { k: 140, c: 20 } : { k: 420, c: 34 }),
      spring(pos.current.r, tgt.r, (v) => { pos.current.r = v; setEdge({ ...pos.current }) }, right ? { k: 420, c: 34 } : { k: 140, c: 20 }),
    ]
  }
  return (
    <Stage photo>
      <style>{css}</style>
      <div className="x-ni">
        <div ref={page} className="x-ni-page"><Letter id="letter"><div className="letter-body" key={at}>{PAGES[at].page()}</div></Letter></div>
        <nav aria-label="Main" className="x-ni-bar">
          <ul ref={list} className="x-ni-list">
            {edge && <li aria-hidden className="x-ni-ink" style={{ left: edge.l, width: Math.max(8, edge.r - edge.l) }} />}
            {PAGES.map((p, i) => (
              <li key={p.key} className="flex">
                <a href={`#${p.key}`} className="x-ni-link flex-1" aria-current={i === at ? "page" : undefined} onClick={(e) => { e.preventDefault(); go(i) }}>
                  <p.icon className="size-5" aria-hidden /><span>{t.nav[p.key]}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </Stage>
  )
}
