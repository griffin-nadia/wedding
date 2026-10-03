import { useEffect, useRef, useState } from "react"
import { List, Map as MapIcon } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Photo } from "@/components/photo"
import { getFlying, type Flying } from "@/lib/api"
import { cn } from "@/lib/utils"

export type Stop = { title: string; body: string; photo?: string; at: [number, number] }
type Labels = { kyoto: string; brisbane: string; canada: string; seeList: string; seeMap: string; next: string; done: string; flyingFrom: (n: number, of: number) => string }

// Where cities sit on the hand-drawn map (viewBox 400 × 300). Stylised, not to scale.
const KYOTO: [number, number] = [262, 96]
const CITY: Partial<Record<Flying, [number, number]>> = {
  Brisbane: [168, 238], Sydney: [158, 258], Melbourne: [140, 272], Adelaide: [118, 262], Perth: [62, 248],
  "Elsewhere in Australia": [112, 228], Canada: [372, 46],
}
const arc = ([x1, y1]: [number, number], [x2, y2]: [number, number]) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.25 - 20
  return `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`
}

/** A hand-drawn line that draws in once (a mask reveals it), already drawn under reduced motion. */
function Route({ d, colour, drawn, delay, id }: { d: string; colour: string; drawn: boolean; delay: number; id: string }) {
  return (
    <g className="journey-route">
      <mask id={id}><path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth="8" strokeDasharray="1" className="journey-draw" style={{ strokeDashoffset: drawn ? 0 : 1, transitionDelay: `${delay}s` }} /></mask>
      <path d={d} mask={`url(#${id})`} fill="none" stroke={colour} strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

/**
 * Option E journey map: Brisbane and Canada drawing in to Kyoto, three story stops (bottom sheet on
 * phones, cards beside the map on desktop), "See as a list", and anonymous "Flying from" lines.
 */
export function JourneyMap({ stops, labels, showFlying = false }: { stops: Stop[]; labels: Labels; showFlying?: boolean }) {
  const ref = useRef<SVGSVGElement>(null)
  const [drawn, setDrawn] = useState(false)
  const [list, setList] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const [flying, setFlyingState] = useState<Awaited<ReturnType<typeof getFlying>>>(null)
  useEffect(() => { if (showFlying) getFlying().then(setFlyingState) }, [showFlying])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setDrawn(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect() } }, { rootMargin: "-10% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [list])

  const toggle = (
    <Button variant="ghost" size="sm" onClick={() => setList((v) => !v)} className="min-h-11">
      {list ? <MapIcon aria-hidden /> : <List aria-hidden />}{list ? labels.seeMap : labels.seeList}
    </Button>
  )
  const stopList = (
    <ol className="space-y-4">
      {stops.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-3">
          <span className="numerals text-2xl text-primary">{i + 1}</span>
          <span><span className="block font-semibold">{s.title}</span><span className="block text-body">{s.body}</span></span>
        </li>
      ))}
    </ol>
  )
  if (list) return <div className="space-y-4"><div className="flex justify-end">{toggle}</div>{stopList}</div>

  const extra = flying ? (Object.entries(flying.counts) as [Flying, number][]).filter(([c]) => CITY[c] && c !== "Brisbane" && c !== "Canada") : []
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {flying && flying.told > 0 ? <p className="text-sm text-muted-foreground">{labels.flyingFrom(flying.told, flying.households)}</p> : <span />}
        {toggle}
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-start">
        <svg ref={ref} aria-hidden viewBox="0 0 400 300" className="w-full rounded-md bg-card ring-1 ring-border">
          {/* land: Australia, Japan, a corner of Canada (soft blobs) */}
          <path d="M40 232c18-26 60-34 92-30 26-16 52-6 66 12 14 18 6 42-12 56-26 16-70 18-104 8-30-8-56-24-42-46z" fill="var(--secondary)" />
          <path d="M226 132c10-14 22-26 34-40 10-12 22-26 36-30 6 8-2 18-10 26-12 12-22 26-34 38-8 8-18 14-26 6z" fill="var(--secondary)" />
          <path d="M346 14c20-6 46-4 54 2v56c-16 4-34-2-46-10-12-10-22-40-8-48z" fill="var(--secondary)" />
          {extra.map(([c], i) => <Route key={c} id={`r-${i}`} d={arc(CITY[c]!, KYOTO)} colour="var(--leaf)" drawn={drawn} delay={1.4 + i * 0.2} />)}
          <Route id="r-bne" d={arc(CITY.Brisbane!, KYOTO)} colour="var(--primary)" drawn={drawn} delay={0} />
          <Route id="r-can" d={arc(CITY.Canada!, KYOTO)} colour="var(--success)" drawn={drawn} delay={0.3} />
          <circle cx={CITY.Brisbane![0]} cy={CITY.Brisbane![1]} r="4.5" fill="var(--primary)" />
          <text x={CITY.Brisbane![0] + 8} y={CITY.Brisbane![1] + 4} fontSize="12" fill="var(--body)">{labels.brisbane}</text>
          <circle cx={CITY.Canada![0]} cy={CITY.Canada![1]} r="4.5" fill="var(--success)" />
          <text x={CITY.Canada![0] - 52} y={CITY.Canada![1] - 8} fontSize="12" fill="var(--body)">{labels.canada}</text>
          {/* Kyoto: a little hanko seal */}
          <g transform={`translate(${KYOTO[0]} ${KYOTO[1]})`}>
            <circle r="13" fill="var(--card)" stroke="var(--primary)" strokeWidth="2" />
            <text y="5" textAnchor="middle" fontSize="14" fill="var(--primary)" fontFamily="var(--font-ja)">京</text>
          </g>
          <text x={KYOTO[0] - 14} y={KYOTO[1] + 30} fontSize="12" fill="var(--foreground)">{labels.kyoto}</text>
        </svg>

        {/* Desktop: the stops beside the map */}
        <ol className="hidden space-y-3 md:block">
          {stops.map((s) => (
            <li key={s.title} className="space-y-2 rounded-md bg-card p-4 ring-1 ring-border">
              {s.photo && <Photo name={s.photo} treatment="split" sizes="320px" />}
              <p className="font-medium text-foreground">{s.title}</p>
              <p className="text-sm text-body">{s.body}</p>
            </li>
          ))}
        </ol>
        {/* Phone: tap through the stops in a bottom sheet */}
        <ol className="flex gap-2 md:hidden">
          {stops.map((s, i) => (
            <li key={s.title} className="flex-1">
              <button type="button" onClick={() => setOpen(i)} className="min-h-13 w-full rounded-lg bg-card px-2 text-sm ring-1 ring-border">
                <span className="numerals mr-1 text-primary">{i + 1}</span>{s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="bottom" className="gap-4 rounded-t-(--radius-section) bg-background p-6">
          {open !== null && (
            <>
              {stops[open].photo && <Photo name={stops[open].photo!} treatment="arch" sizes="240px" className="mx-auto w-48" />}
              <p className="text-sm text-muted-foreground">{open + 1} of {stops.length}</p>
              <SheetTitle className="font-display text-2xl font-normal">{stops[open].title}</SheetTitle>
              <SheetDescription className="text-base text-body">{stops[open].body}</SheetDescription>
              <Button size="lg" className={cn("w-full")} onClick={() => setOpen(open + 1 < stops.length ? open + 1 : null)}>
                {open + 1 < stops.length ? labels.next : labels.done}
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
