import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { tuneEnabled } from "@/tune/launcher"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { COUPLE } from "@/content/en"
import { cn } from "@/lib/utils"

const TunePanel = tuneEnabled ? lazy(() => import("@/tune/panel").then((m) => ({ default: m.TunePanel }))) : null
const base = import.meta.env.BASE_URL

const PAGES: [string, string][] = [["Home", ""], ["RSVP open", "?rsvp=1"], ["The day", "the-day"], ["Travel", "travel"], ["FAQs", "faqs"], ["Our story", "our-story"]]

/**
 * Options lab (/lab, hidden): the tuning panel docked on the left (tokens, options, notes) and the
 * real site on the right in a phone frame and a desktop frame. Changes show in both straight away.
 * The frames use whichever invite was last opened in this browser (the test household for Jehan).
 */
export function LabPage() {
  const [path, setPath] = useState("")
  const [n, setN] = useState(0)
  const phone = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.6)
  useEffect(() => {
    if (!box.current) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1440))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])
  if (!TunePanel) return <main className="grid min-h-svh place-items-center p-6"><p>The options lab is only in preview builds.</p></main>
  const src = `${base}${path}`
  const replayArrival = () => { try { localStorage.removeItem("ng-opened") } catch { /* ignore */ } setPath(""); setN(n + 1) }
  return (
    <div className="lab min-h-svh bg-background lg:grid lg:grid-cols-[380px_1fr]">
      <Suspense><TunePanel docked /></Suspense>
      <main className="flex min-w-0 flex-col gap-4 p-4 md:p-6">
        <header className="flex flex-wrap items-center gap-3">
          <p className="font-display text-2xl text-foreground">{COUPLE.first[0]}&amp;{COUPLE.second[0]} <span className="label-caps text-muted-foreground">Options lab</span></p>
          <div className="flex flex-wrap items-center gap-2 md:ml-auto">
            <Segmented label="Preview page" value={path} onChange={(p) => { setPath(p); setN(n + 1) }} items={PAGES.map(([label, p]) => ({ value: p, label }))} />
            <Button variant="outline" onClick={replayArrival}><RotateCcw className="size-4" aria-hidden />Replay arrival</Button>
          </div>
        </header>
        <div className="flex flex-wrap items-start gap-6">
          <figure className="flex flex-col gap-2">
            <figcaption className="label-caps text-muted-foreground">Phone · 390 × 844</figcaption>
            <iframe ref={phone} key={`p${n}`} title="Phone preview" src={src} className="lab-frame h-[844px] w-[390px]" />
          </figure>
          <figure className={cn("flex min-w-0 flex-1 flex-col gap-2")}>
            <figcaption className="label-caps text-muted-foreground">Desktop · 1440 × 900 (scaled)</figcaption>
            <div ref={box} className="lab-desktop">
              <iframe key={`d${n}`} title="Desktop preview" src={src} className="lab-frame" style={{ transform: `scale(${scale})` }} />
            </div>
          </figure>
        </div>
      </main>
    </div>
  )
}
