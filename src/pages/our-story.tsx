import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useContent, type Chapter } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { useOption } from "@/lib/options"
import { JourneyMap } from "@/components/journey-map"
import { cn } from "@/lib/utils"

/** Journey A · the letter continues (default): chapters as pages of the letter. Swipe or arrows on phones, side by side from 1024. No photos. */
function StoryLetter({ chapters }: { chapters: Chapter[] }) {
  const { t } = useLang()
  const row = useRef<HTMLOListElement>(null)
  const [i, setI] = useState(0)
  const go = (n: number) => { const el = row.current?.children[n] as HTMLElement | undefined; el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" }); setI(n) }
  return (
    <div className="flex flex-col gap-4">
      <ol ref={row} className="story-pages" onScroll={(e) => { const el = e.currentTarget; setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))) }}>
        {chapters.map((c) => (
          <li key={c.key} className="story-page">
            <p className="text-sm text-muted-foreground">{c.year}</p>
            <h2 className="font-display text-2xl text-foreground">{c.title}</h2>
            {c.body.map((p, k) => <p key={k}>{p}</p>)}
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between lg:hidden">
        <button type="button" className="utility-btn" onClick={() => go(Math.max(0, i - 1))} disabled={i === 0} aria-label={t.story.prevChapter}><ChevronLeft className="size-5" aria-hidden /></button>
        <span className="text-sm text-muted-foreground" aria-live="polite">{t.story.page(i + 1, chapters.length)}</span>
        <button type="button" className="utility-btn" onClick={() => go(Math.min(chapters.length - 1, i + 1))} disabled={i === chapters.length - 1} aria-label={t.story.nextChapter}><ChevronRight className="size-5" aria-hidden /></button>
      </div>
    </div>
  )
}

/** Journey B · storybook map: stops on one path; tap a stop and the letter shows its chapter. The painted plate replaces the paper strip later. */
function StoryMap({ chapters }: { chapters: Chapter[] }) {
  const [on, setOn] = useState(0)
  const c = chapters[on]
  const xs = chapters.map((_, i) => 14 + (72 * i) / Math.max(1, chapters.length - 1))
  return (
    <div className="flex flex-col gap-6">
      <div className="trail-plate">
        <div className="trail-track">
          <svg viewBox="0 0 600 72" preserveAspectRatio="none" className="trail-svg" aria-hidden>
            <path d="M84 36 C 156 8, 228 64, 300 36 S 444 8, 516 36" pathLength={1} vectorEffect="non-scaling-stroke" className="trail-path is-drawn" />
          </svg>
          <div role="tablist" aria-label="Our story" className="trail-stops is-drawn">
            {chapters.map((ch, i) => (
              <button key={ch.key} role="tab" aria-selected={on === i} onClick={() => setOn(i)} className={cn("trail-stop is-drawn story-stop", on === i && "is-on")} style={{ left: `${xs[i]}%` }}>
                <span className="trail-icon">{i + 1}</span>
                <span className="trail-text"><span className="font-medium text-foreground">{ch.title}</span><span className="text-sm">{ch.year}</span></span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <section role="tabpanel" aria-label={c.title} className="flex flex-col gap-3">
        <h2 className="font-display text-2xl text-foreground">{c.title}</h2>
        {c.body.map((p, k) => <p key={k}>{p}</p>)}
      </section>
    </div>
  )
}

/** Journey C · timeline: year on one side, the moment on the other, the line draws in. */
function StoryTimeline({ chapters }: { chapters: Chapter[] }) {
  return (
    <ol className="timeline">
      <span aria-hidden className="timeline-line" />
      <span aria-hidden className="timeline-line timeline-fill" />
      {chapters.map((c, i) => (
        <li key={c.key} className={cn("timeline-row is-seen", i % 2 ? "is-right" : "is-left")}>
          <p className="timeline-time numerals text-foreground">{c.year}</p>
          <span aria-hidden className="timeline-icon">{i + 1}</span>
          <div className="timeline-text"><p className="font-medium text-foreground">{c.title}</p>{c.body.slice(0, 1).map((p, k) => <p key={k} className="text-sm">{p}</p>)}</div>
        </li>
      ))}
    </ol>
  )
}

/** Our story (hidden until the story text exists in the Content tab): A by default, B and C as lab options. */
export function StoryPage() {
  const { t } = useLang()
  const { story, ready } = useContent()
  const view = useOption("story")
  const journey = useOption("mapmode") === "journey"
  const flying = useOption("flying") === "on"
  if (ready && story.length) {
    return (
      <>
        <h1 className="heading">{t.story.title}</h1>
        {view === "b" ? (journey
          ? <JourneyMap stops={story.map((c) => ({ title: c.title, body: c.body.join(" "), at: [0, 0] }))} labels={t.story} showFlying={flying} />
          : <StoryMap chapters={story} />) : view === "c" ? <StoryTimeline chapters={story} /> : <StoryLetter chapters={story} />}
      </>
    )
  }
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="heading">{t.letter.comingSoon}</h1>
        <p>{t.story.soonBody}</p>
      </div>
    </div>
  )
}
