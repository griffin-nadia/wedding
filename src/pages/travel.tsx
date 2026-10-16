import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Disclosure } from "@/components/disclosure"
import { DriverCard } from "@/components/driver-card"
import { Trail } from "@/components/trail"
import { KyotoMap } from "@/components/kyoto-map"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { getStayPicks } from "@/lib/api"
import { areasOf, pickList, type Pick, type Picks } from "@/lib/stay"
import { Segmented } from "@/components/segmented"

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{children}</a>
}

/**
 * Before you fly as a checklist inside the accordion (v3 S): each row has its own tick (saved on this
 * device) and opens for the detail. The tick is the marker, so no numbers.
 */
function Row({ value, title, done, onTick, tickLabel, children }: { value: string; title: string; done: boolean; onTick: (v: boolean) => void; tickLabel: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value}>
      <div className="check-acc">
        <Checkbox checked={done} onCheckedChange={(v) => onTick(v === true)} aria-label={tickLabel} className="check-acc-box" />
        <AccordionTrigger><span className={done ? "text-muted-foreground" : undefined}>{title}</span></AccordionTrigger>
      </div>
      <AccordionContent><div className="flex flex-col gap-3 pl-10">{children}</div></AccordionContent>
    </AccordionItem>
  )
}

/** The ticks, per household, on this device only. */
function useTicks(token: string | undefined) {
  const key = `ng-fly-${token ?? "anon"}`
  const [ticks, setTicks] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem(key) || "{}") } catch { return {} } })
  const set = (k: string, v: boolean) => setTicks((t) => { const n = { ...t, [k]: v }; try { localStorage.setItem(key, JSON.stringify(n)) } catch { /* fine */ } return n })
  return [ticks, set] as const
}

// The planner's answer, once per visit (the back end caches it for 6 hours too)
let livePicks: unknown = null
let livePicksLoaded = false

/**
 * Their picks under the areas: a note, area chips (toggle buttons) and two collapsed groups, Hotels and Airbnbs. Each
 * compact row opens its own site. Rows come from the planner's Accommodation Options tab, or the list in en.ts.
 */
function Picks() {
  const { t, lang } = useLang()
  const p = t.stay.picks
  const fallback: Picks = { note: p.note, hotels: p.hotels, airbnbs: p.airbnbs }
  const [live, setLive] = useState<unknown>(livePicks)
  const [area, setArea] = useState("")
  useEffect(() => {
    if (livePicksLoaded) return
    let on = true
    void getStayPicks().then((d) => { livePicks = d; livePicksLoaded = true; if (on) setLive(d) })
    return () => { on = false }
  }, [])
  const picks = pickList(live, fallback)
  // Her note in English; the translated note in Japanese
  const note = lang === "ja" ? p.note : picks.note
  const areas = areasOf(picks)
  const shown = (list: Pick[]) => list.filter((x) => !area || x.area === area)
  const hotels = shown(picks.hotels), airbnbs = shown(picks.airbnbs)
  const row = (x: Pick, airbnb: boolean) => (
    <li key={x.href} className="border-b border-border last:border-b-0">
      <a href={x.href} target="_blank" rel="noreferrer" className="stay-row stay-pick">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium text-foreground">{airbnb ? x.area : x.name}</span>
          <span className="text-sm">{[airbnb ? (x.sleeps ? p.sleeps(x.sleeps) : "") : x.area, x.price ? p.perNight(x.price) : ""].filter(Boolean).join(" · ")}</span>
          {x.note && <span className="text-sm text-muted-foreground">{x.note}</span>}
        </span>
        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">, {airbnb ? p.opensAirbnb : p.opensHotel}</span>
      </a>
    </li>
  )
  const group = (key: string, title: string, list: Pick[], airbnb: boolean, extra?: string) => (
    <AccordionItem value={key}>
      <AccordionTrigger><span>{title} <span className="text-muted-foreground">· {list.length}</span></span></AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2">
          {extra && <p className="text-sm text-muted-foreground">{extra}</p>}
          {list.length ? <ul className="flex flex-col">{list.map((x) => row(x, airbnb))}</ul> : <p className="text-sm text-muted-foreground">{p.none}</p>}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
  return (
    <div id="picks" className="flex scroll-mt-40 flex-col gap-3">
      <h3 className="font-display text-xl text-foreground">{p.title}</h3>
      <p className="text-sm text-muted-foreground">{note}</p>
      {areas.length > 1 && (
        <div role="group" aria-label={p.filterLabel} className="chip-row">
          {["", ...areas].map((a) => (
            <button key={a || "all"} type="button" aria-pressed={area === a} onClick={() => setArea(a)} className="chip-filter">{a || p.allAreas}</button>
          ))}
        </div>
      )}
      <Accordion type="multiple" aria-label={p.title}>
        {group("hotels", p.hotelsTitle, hotels, false)}
        {group("airbnbs", p.airbnbsTitle, airbnbs, true, p.airbnbsNote)}
      </Accordion>
    </div>
  )
}

type Part = "getting" | "stay"
const partOf = (hash: string): Part => (/^#?(stay|picks)$/.test(hash) ? "stay" : "getting")

/**
 * Travel, in two parts behind a sticky switch (tabs): Getting there (the venue card with directions, Show the driver
 * and Copy address, the trail, the map, then Before you fly as a checklist) and Where to stay (the three areas as
 * short cards, then their picks). /travel#stay opens Where to stay; #before and #getting-there open Getting there.
 */
export function TravelPage() {
  const { t } = useLang()
  const g = t.getting
  const { household } = useHousehold()
  const [ticks, setTick] = useTicks(household?.token)
  const { hash } = useLocation()
  const navigate = useNavigate()
  const part = partOf(hash)
  const switcher = useRef<HTMLDivElement>(null)
  // #before (and any other section) scrolls into view once its part is showing
  useEffect(() => {
    const id = hash.slice(1)
    if (id && id !== "stay" && id !== "getting-there") requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [hash])
  const choose = (p: Part) => {
    navigate({ hash: p === "stay" ? "stay" : "getting-there" }, { replace: true })
    // Keep the switch where it is: if the page was scrolled past it, bring the new part's top to it
    const el = switcher.current
    if (el && el.getBoundingClientRect().top <= parseFloat(getComputedStyle(el).top) + 1) requestAnimationFrame(() => el.scrollIntoView({ block: "start" }))
  }
  const rows: [string, string, React.ReactNode][] = [
    ["passport", g.rows.passport, <p>{t.travel.items[0].body}</p>],
    ["flights", g.rows.flights, <>
      <p>{t.travel.items[1].body}</p><p>{g.flyingBody}</p><p>{g.tokyoBody}</p>
      <div className="flex flex-wrap gap-x-4"><Ext href={g.links.haruka.href}>{g.links.haruka.label}</Ext><Ext href={g.links.flights.href}>{g.links.flights.label}</Ext><Ext href={g.links.trains.href}>{g.links.trains.label}</Ext></div>
    </>],
    ["insurance", g.rows.insurance, <><p>{g.insuranceBody}</p><Ext href={g.links.smartraveller.href}>{g.links.smartraveller.label}</Ext></>],
    ["booking", g.rows.booking, <><p>{t.travel.items[2].body}</p><button type="button" className="btn-text inline-flex min-h-11 items-center self-start" onClick={() => choose("stay")}>{g.seeStay}</button></>],
    ["phones", g.rows.phones, <>
      <p>{t.travel.items[3].body}</p><p>{g.tips[1]}</p>
      <div className="flex flex-wrap gap-x-4">{("links" in t.travel.items[3] ? t.travel.items[3].links ?? [] : []).map((l) => <Ext key={l.href} href={l.href}>{l.label}</Ext>)}</div>
    </>],
    ["weather", g.rows.weather, <p>{g.tips[0]}</p>],
    ["medicines", g.rows.medicines, <><p>{g.tips[2]}</p><Ext href={g.links.smartraveller.href}>{g.links.smartraveller.label}</Ext></>],
    ["day", g.rows.onTheDay, <><p>{g.walkingBody}</p><Ext href={g.links.walk.href}>{g.links.walk.label}</Ext><p>{g.shuttleBody}</p><p>{g.earlyBody}</p></>],
  ]
  return (
    <>
      <h1 className="heading">{t.nav.travel}</h1>

      <div ref={switcher} className="travel-switch">
        <Segmented role="tablist" idPrefix="travel" label={g.partsLabel} value={part} onChange={choose}
          items={[{ value: "getting" as Part, label: g.title }, { value: "stay" as Part, label: t.stay.title }]} />
      </div>

      {part === "getting" ? (
        <div id="travel-panel-getting" role="tabpanel" aria-labelledby="travel-tab-getting" className="flex flex-col gap-8">
          <section id="getting-there" className="flex scroll-mt-32 flex-col gap-4">
            <p>{g.intro}</p>
            <DriverCard />
            <Trail />
            <KyotoMap />
          </section>

          <section id="before" aria-labelledby="before-title" className="flex scroll-mt-32 flex-col gap-4">
            <h2 id="before-title" className="font-display text-2xl text-foreground">{g.beforeTitle}</h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">{g.ticked(rows.filter(([v]) => ticks[v]).length, rows.length)}</p>
            <Disclosure label={g.beforeTitle}>
              {rows.map(([value, title, body]) => <Row key={value} value={value} title={title} done={Boolean(ticks[value])} onTick={(v) => setTick(value, v)} tickLabel={g.tick(title)}>{body}</Row>)}
            </Disclosure>
          </section>
        </div>
      ) : (
        <div id="travel-panel-stay" role="tabpanel" aria-labelledby="travel-tab-stay" className="flex flex-col gap-6">
          <section id="stay" className="flex scroll-mt-32 flex-col gap-4">
            <p>{t.stay.intro}</p>
            <ul className="stay-areas">
              {t.day.stay.map((a) => (
                <li key={a.label}>
                  <a href={a.maps} target="_blank" rel="noreferrer" className="stay-area">
                    <span className="flex items-center justify-between gap-2 font-medium text-foreground">{a.label}<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden /></span>
                    <span className="text-sm">{t.day.stayGood}: {a.good}</span>
                    <span className="text-sm text-muted-foreground">{t.day.stayWatch}: {a.watch}</span>
                    <span className="sr-only">, {g.stayOpens}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <Picks />
        </div>
      )}
    </>
  )
}
