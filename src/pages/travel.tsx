import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpRight } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Disclosure } from "@/components/disclosure"
import { DriverCard } from "@/components/driver-card"
import { Trail } from "@/components/trail"
import { KyotoMap } from "@/components/kyoto-map"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { getStayPicks } from "@/lib/api"
import { pickList, type Pick, type Picks } from "@/lib/stay"

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{children}</a>
}

/** A plain accordion row: the same row as FAQs and the checklist, without the tick. */
function Plain({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent><div className="flex flex-col gap-3">{children}</div></AccordionContent>
    </AccordionItem>
  )
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

/** Her note, in her words, kept to its first two sentences so it reads in a line or two. */
const twoSentences = (s: string) => (s.match(/[^.!?]+[.!?]+/g) ?? [s]).slice(0, 2).join("").trim()

/**
 * Their picks under the areas, as one plain list: Hotels, then Airbnbs. Each row is the name (the area for an
 * Airbnb), area or sleeps with the rough price a night, one note, and the whole row is the link out.
 * Rows come from the planner's Accommodation Options tab, or the list in en.ts if that can't be read.
 */
function Picks() {
  const { t, lang } = useLang()
  const p = t.stay.picks
  const fallback: Picks = { note: p.note, hotels: p.hotels, airbnbs: p.airbnbs }
  const [live, setLive] = useState<unknown>(livePicks)
  useEffect(() => {
    if (livePicksLoaded) return
    let on = true
    void getStayPicks().then((d) => { livePicks = d; livePicksLoaded = true; if (on) setLive(d) })
    return () => { on = false }
  }, [])
  const picks = pickList(live, fallback)
  // Her note in English; the translated note in Japanese
  const note = lang === "ja" ? p.note : twoSentences(picks.note)
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
  return (
    <div id="picks" className="flex scroll-mt-24 flex-col gap-3">
      <h3 className="font-display text-xl text-foreground">{p.title}</h3>
      <p className="text-sm text-muted-foreground">{note}</p>
      <h4 className="pt-2 font-medium text-foreground">{p.hotelsTitle}</h4>
      <ul className="flex flex-col border-y border-border">{picks.hotels.map((x) => row(x, false))}</ul>
      <h4 className="pt-2 font-medium text-foreground">{p.airbnbsTitle} <span className="font-normal text-muted-foreground">· {p.airbnbsNote}</span></h4>
      <ul className="flex flex-col border-y border-border">{picks.airbnbs.map((x) => row(x, true))}</ul>
    </div>
  )
}

/**
 * Travel, one page, one scroll, in the order a guest needs it: the taxi card for the day itself (with the way from
 * the station, walking in and the map around the venue), Getting to Kyoto, Where to stay (the three areas, then
 * their picks), and Before you fly as a ticked checklist. Every section is the same accordion rows.
 * /travel#stay, #picks and #before scroll to their section.
 */
export function TravelPage() {
  const { t } = useLang()
  const g = t.getting
  const { household } = useHousehold()
  const [ticks, setTick] = useTicks(household?.token)
  const { hash } = useLocation()
  useEffect(() => {
    const id = hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [hash])
  const goStay = () => document.getElementById("stay")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
  const rows: [string, string, React.ReactNode][] = [
    ["passport", g.rows.passport, <p>{t.travel.items[0].body}</p>],
    ["insurance", g.rows.insurance, <><p>{g.insuranceBody}</p><Ext href={g.links.smartraveller.href}>{g.links.smartraveller.label}</Ext></>],
    ["booking", g.rows.booking, <><p>{t.travel.items[2].body}</p><button type="button" className="btn-text inline-flex min-h-11 items-center self-start" onClick={goStay}>{g.seeStay}</button></>],
    ["phones", g.rows.phones, <>
      <p>{t.travel.items[3].body}</p><p>{g.tips[1]}</p>
      <div className="flex flex-wrap gap-x-4">{("links" in t.travel.items[3] ? t.travel.items[3].links ?? [] : []).map((l) => <Ext key={l.href} href={l.href}>{l.label}</Ext>)}</div>
    </>],
    ["weather", g.rows.weather, <p>{g.tips[0]}</p>],
    ["medicines", g.rows.medicines, <><p>{g.tips[2]}</p><Ext href={g.links.smartraveller.href}>{g.links.smartraveller.label}</Ext></>],
  ]
  return (
    <>
      <h1 className="heading">{t.nav.travel}</h1>

      <section id="getting-there" aria-label={g.onTheDayTitle} className="flex scroll-mt-24 flex-col gap-4">
        <p>{g.intro}</p>
        <DriverCard />
        <Disclosure label={g.onTheDayTitle}>
          <Plain value="trail" title={t.trail.label}><Trail /><p>{g.shuttleBody}</p></Plain>
          <Plain value="walk" title={g.walkingTitle}><p>{g.walkingBody}</p><Ext href={g.links.walk.href}>{g.links.walk.label}</Ext></Plain>
          <Plain value="around" title={t.kyotoMap.title}><KyotoMap /></Plain>
        </Disclosure>
      </section>

      <section id="to-kyoto" aria-labelledby="to-kyoto-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="to-kyoto-title" className="font-display text-2xl text-foreground">{g.toKyotoTitle}</h2>
        <Disclosure label={g.toKyotoTitle}>
          <Plain value="flights" title={g.rows.flights}>
            <p>{t.travel.items[1].body}</p><p>{g.flyingBody}</p>
            <div className="flex flex-wrap gap-x-4"><Ext href={g.links.haruka.href}>{g.links.haruka.label}</Ext><Ext href={g.links.flights.href}>{g.links.flights.label}</Ext></div>
          </Plain>
          <Plain value="tokyo" title={g.tokyoTitle}><p>{g.tokyoBody}</p><Ext href={g.links.trains.href}>{g.links.trains.label}</Ext></Plain>
          <Plain value="early" title={g.earlyTitle}><p>{g.earlyBody}</p></Plain>
        </Disclosure>
      </section>

      <section id="stay" aria-labelledby="stay-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="stay-title" className="font-display text-2xl text-foreground">{t.stay.title}</h2>
        <p>{t.stay.intro}</p>
        <Disclosure label={t.stay.title}>
          {t.day.stay.map((a) => (
            <Plain key={a.label} value={a.label} title={a.label}>
              <p>{t.day.stayGood}: {a.good}</p>
              <p className="text-muted-foreground">{t.day.stayWatch}: {a.watch}</p>
              <Ext href={a.maps}>{g.seeOnMap}</Ext>
            </Plain>
          ))}
        </Disclosure>
        <Picks />
      </section>

      <section id="before" aria-labelledby="before-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="before-title" className="font-display text-2xl text-foreground">{g.beforeTitle}</h2>
        <p className="text-sm text-muted-foreground" aria-live="polite">{g.ticked(rows.filter(([v]) => ticks[v]).length, rows.length)}</p>
        <Disclosure label={g.beforeTitle}>
          {rows.map(([value, title, body]) => <Row key={value} value={value} title={title} done={Boolean(ticks[value])} onTick={(v) => setTick(value, v)} tickLabel={g.tick(title)}>{body}</Row>)}
        </Disclosure>
      </section>
    </>
  )
}
