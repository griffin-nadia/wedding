import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { letterScroll, nextFrame, scrollToEl, still } from "@/lib/frame"
import { useLocation } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger, Disclosure } from "@/components/ui/accordion"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Chip } from "@/components/ui/checkbox-group"
import { DriverCard } from "@/components/driver-card"
import { Trail } from "@/components/trail"
import { KyotoMap } from "@/components/kyoto-map"
import { VenueMap, venueMapOn } from "@/components/venue-map"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { getStayPicks, getTicks, saveTicks } from "@/lib/api"
import { PageHeader, useUnder } from "@/components/ui/page-header"
import { pickList, type Pick, type Picks } from "@/lib/stay"
import { SECTIONS, travelOrder, type Section } from "@/lib/travel-order"
import { config } from "@/lib/config"
import { useContent } from "@/lib/content"

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{children}</a>
}

/**
 * In-page links glide to their section instead of the browser's instant jump (and land at once under reduced
 * motion), just under the stuck tab row (run 19: one exact target worked out from the row, not a scroll margin).
 * The address keeps the hash, replaced rather than added, so Back still leaves the page.
 */
function glide(e: React.MouseEvent, id: string) {
  e.preventDefault()
  scrollToEl(document.getElementById(id))
  history.replaceState(history.state, "", `#${id}`)
}

/** A plain accordion row: the same row as FAQs and the checklist, without the tick. */
function Plain({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} id={value} className="scroll-mt-(--travel-head)">
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
    <AccordionItem value={value} id={value} className="scroll-mt-(--travel-head)">
      <div className="check-acc">
        <Checkbox checked={done} onCheckedChange={(v) => onTick(v === true)} aria-label={tickLabel} className="check-acc-box" />
        <AccordionTrigger><span className={done ? "text-muted-foreground" : undefined}>{title}</span></AccordionTrigger>
      </div>
      <AccordionContent><div className="flex flex-col gap-3 pl-10">{children}</div></AccordionContent>
    </AccordionItem>
  )
}

/** The ticks, per household: kept on this device for an instant start, and (run 27) on the back end so a phone and a
 *  laptop with the same link show the same. The back end's list wins when it answers; checked again on coming back. */
function useTicks(token: string | undefined) {
  const key = `ng-fly-${token ?? "anon"}`
  const [ticks, setTicks] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem(key) || "{}") } catch { return {} } })
  const keep = (n: Record<string, boolean>) => { try { localStorage.setItem(key, JSON.stringify(n)) } catch { /* fine */ } }
  useEffect(() => {
    if (!token) return
    let on = true
    const pull = () => void getTicks(token).then((list) => {
      if (!on || !list) return
      const n = Object.fromEntries(list.map((k) => [k, true]))
      keep(n); setTicks(n)
    })
    pull()
    const back = () => { if (!document.hidden) pull() }
    document.addEventListener("visibilitychange", back)
    return () => { on = false; document.removeEventListener("visibilitychange", back) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
  const set = (k: string, v: boolean) => {
    const n = { ...ticks, [k]: v }
    setTicks(n)
    keep(n)
    if (token) saveTicks(token, Object.keys(n).filter((x) => n[x]))
  }
  return [ticks, set] as const
}

// The planner's answer, once per visit (the back end caches it for 6 hours too)
let livePicks: unknown = null
let livePicksLoaded = false

/** Her note, in her words, kept to its first two sentences so it reads in a line or two. */
const twoSentences = (s: string) => (s.match(/[^.!?]+[.!?]+/g) ?? [s]).slice(0, 2).join("").trim()

/** A URL-friendly id for a row (an area's name) */
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "area"

/**
 * Hotels or Airbnbs: one row that opens the shared sheet with every pick, filtered by area with chips (none on = all).
 * Each pick is a link out. Rows come from the planner's Accommodation Options tab, or the list in en.ts.
 */
function PickSheet({ id, title, sub, note, list, airbnb, open, onOpen }: { id: string; title: string; sub?: string; note: string; list: Pick[]; airbnb: boolean; open: boolean; onOpen: (o: boolean) => void }) {
  const { t } = useLang()
  const p = t.stay.picks
  const areas = [...new Set(list.map((x) => x.area).filter(Boolean))]
  const [on, setOn] = useState<string[]>([])
  const shown = on.length ? list.filter((x) => on.includes(x.area)) : list
  return (
    <Sheet open={open} onOpenChange={onOpen}>
      <SheetTrigger asChild>
        <button type="button" id={id} className="stay-row stay-pick w-full scroll-mt-(--travel-head) text-left">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium text-foreground">{title}</span>
            <span className="text-small">{[p.count(list.length), sub].filter(Boolean).join(" · ")}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent className="takeover" aria-describedby={`${id}-note`}>
        <SheetHead>
          <SheetTitle className="heading">{title}</SheetTitle>
          <SheetDescription id={`${id}-note`} className="text-small text-muted-foreground">{note}</SheetDescription>
          {areas.length > 1 && (
            <div role="group" aria-label={p.filterLabel} className="flex flex-wrap gap-2">
              {areas.map((a) => <Chip key={a} on={on.includes(a)} onClick={() => setOn(on.includes(a) ? on.filter((x) => x !== a) : [...on, a])}>{a}</Chip>)}
            </div>
          )}
        </SheetHead>
        <SheetBody>
          <ul aria-live="polite" className="flex flex-col border-y border-border">
            {shown.map((x) => (
              <li key={x.href} className="border-b border-border last:border-b-0">
                <a href={x.href} target="_blank" rel="noreferrer" className="stay-row stay-pick">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-foreground">{airbnb ? x.area : x.name}</span>
                    <span className="text-small">{[airbnb ? (x.sleeps ? p.sleeps(x.sleeps) : "") : x.area, x.price ? p.perNight(x.price) : ""].filter(Boolean).join(" · ")}</span>
                    {x.note && <span className="text-small text-muted-foreground">{x.note}</span>}
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="sr-only">, {airbnb ? p.opensAirbnb : p.opensHotel}</span>
                </a>
              </li>
            ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

/** Their picks under the areas: a Hotels row and an Airbnbs row, each opening its sheet, her note at the top of it
 * (run 19: it was on the page as well, the same lines twice). */
function Picks({ sheet, setSheet }: { sheet: string; setSheet: (s: string) => void }) {
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
  // Her note in English; the translated note in Japanese. The Airbnbs sheet has its own (run 26: hers is about hotels)
  const note = lang === "ja" ? p.note : twoSentences(picks.note)
  return (
    <div id="picks" className="flex scroll-mt-(--travel-head) flex-col gap-3">
      {/* Run 27 review: a proper sub-heading in the headings' serif (smaller than the section's), not a small label */}
      <h3 className="font-display text-[length:var(--type-accent-size)] leading-snug text-foreground">{p.title}</h3>
      <div className="flex flex-col border-y border-border">
        <PickSheet id="hotels" title={p.hotelsTitle} note={note} list={picks.hotels} airbnb={false} open={sheet === "hotels"} onOpen={(o) => setSheet(o ? "hotels" : "")} />
        <div className="border-t border-border" />
        <PickSheet id="airbnbs" title={p.airbnbsTitle} sub={p.airbnbsNote} note={p.airbnbsAbout} list={picks.airbnbs} airbnb open={sheet === "airbnbs"} onOpen={(o) => setSheet(o ? "airbnbs" : "")} />
      </div>
    </div>
  )
}


/**
 * Jump links under the page header (one slim sticky row at the card's top once scrolled past): one per section in the page's order, the one you're reading
 * marked (aria-current), from an IntersectionObserver on the sections. A tapped link is marked straight away and
 * stays marked until you scroll yourself, even if its section can't reach the top. Plain links, so Tab, Enter and
 * screen readers work.
 */
function JumpLinks({ order, labels }: { order: readonly Section[]; labels: Record<Section, string> }) {
  const { t } = useLang()
  const [at, setAt] = useState<string>(order[0])
  const held = useRef("")
  useEffect(() => {
    const els = order.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    const seen = new Map<string, boolean>()
    // A section counts as current while it crosses a line a third of the way down the screen
    const io = new IntersectionObserver((es) => {
      for (const e of es) seen.set(e.target.id, e.isIntersecting)
      const first = order.find((id) => seen.get(id))
      if (first && !held.current) setAt(first)
    }, { rootMargin: "-33% 0px -66% 0px" })
    els.forEach((e) => io.observe(e))
    // Your own scroll (a swipe, the wheel, a key) lets the observer mark sections again
    const free = () => { held.current = "" }
    const opts = { passive: true }
    addEventListener("touchstart", free, opts); addEventListener("wheel", free, opts); addEventListener("keydown", free)
    // 29 Oct (Jehan): the last section is short and can't reach the top, so the card's end marks it instead
    const sc = letterScroll()
    const atEnd = () => { if (sc && !held.current && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) setAt(order[order.length - 1]) }
    sc?.addEventListener("scroll", atEnd, opts)
    return () => { io.disconnect(); removeEventListener("touchstart", free); removeEventListener("wheel", free); removeEventListener("keydown", free); sc?.removeEventListener("scroll", atEnd) }
  }, [order])
  // On a narrow screen the strip scrolls sideways: keep the current link in view (the first and last all the way to
  // their end), and fade whichever edge has more past it
  const strip = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const ul = strip.current, a = ul?.querySelector<HTMLElement>("[aria-current]")
    if (ul && a) ul.scrollTo({ left: Math.max(0, Math.min(ul.scrollWidth - ul.clientWidth, a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2)), behavior: still() ? "instant" : "smooth" })
  }, [at])
  useEffect(() => {
    const ul = strip.current
    if (!ul) return
    const edges = () => { ul.toggleAttribute("data-more-left", ul.scrollLeft > 2); ul.toggleAttribute("data-more-right", ul.scrollLeft < ul.scrollWidth - ul.clientWidth - 2) }
    edges()
    ul.addEventListener("scroll", edges, { passive: true })
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(edges); ro?.observe(ul)
    return () => { ul.removeEventListener("scroll", edges); ro?.disconnect() }
  }, [])
  // The tap's own touchstart comes before the click, so the hold is set after it
  const go = (e: React.MouseEvent, id: Section) => { glide(e, id); held.current = id; setAt(id) }
  // Once scrolled past, the links stay as one slim row at the top of the card (18e)
  const card = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => { card.current = letterScroll() }, []) // before useUnder's observer starts
  const { sentinel, under } = useUnder(card)
  return (
    <>
    <span ref={sentinel} aria-hidden className="jump-links-sentinel" />
    <nav aria-label={t.getting.onThisPage} className="jump-links" data-stuck={under || undefined}>
      <ul ref={strip}>
        {order.map((id) => (
          <li key={id}><a href={`#${id}`} onClick={(e) => go(e, id)} aria-current={at === id ? "true" : undefined} className="jump-link">{labels[id]}</a></li>
        ))}
      </ul>
    </nav>
    </>
  )
}

/**
 * Travel, one page, in the order a guest needs it: Getting to Kyoto, Where to stay (the areas, then their picks),
 * Before you fly as a ticked checklist, and On the day (the taxi card, the way from the station, the map). One accordion row open at a time on the whole page, all closed on
 * load; a hash opens a row directly (/travel#flights, #walk, #hotels) or scrolls to a section (#stay, #before).
 */
export function TravelPage() {
  const { t } = useLang()
  const g = t.getting
  const { household } = useHousehold()
  const [ticks, setTick] = useTicks(household?.token)
  const { hash } = useLocation()
  const [open, setOpen] = useState("")
  const [sheet, setSheet] = useState("")
  const { mode } = useContent()
  // Read once per visit: a page open across the 14-day line keeps its order until the next visit
  const [now] = useState(() => new Date())
  const order = travelOrder(now, config.weddingStart, mode)
  const first = useRef(true)
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1))
    if (!id) return
    const smooth = !first.current && !still()
    first.current = false
    if (id === "hotels" || id === "airbnbs") setSheet(id)
    else if (!(SECTIONS as readonly string[]).includes(id) && id !== "picks" && id !== "getting-there") setOpen(id)
    nextFrame(() => scrollToEl(document.getElementById(id === "getting-there" ? "on-the-day" : id), smooth))
  }, [hash])
  const goStay = (e: React.MouseEvent) => glide(e, "stay")
  const one = { value: open, onValueChange: setOpen }
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
  const sections: Record<Section, React.ReactNode> = {
    "to-kyoto": (
        <section key="to-kyoto" id="to-kyoto" aria-labelledby="to-kyoto-title" className="travel-section flex scroll-mt-(--travel-head) flex-col gap-4">
          <h2 id="to-kyoto-title" className="font-display text-heading text-foreground">{g.toKyotoTitle}</h2>
          <Disclosure label={g.toKyotoTitle} {...one}>
            <Plain value="flights" title={g.rows.flights}>
              <p>{t.travel.items[1].body}</p><p>{g.flyingBody}</p>
              <div className="flex flex-wrap gap-x-4"><Ext href={g.links.haruka.href}>{g.links.haruka.label}</Ext><Ext href={g.links.flights.href}>{g.links.flights.label}</Ext></div>
            </Plain>
            <Plain value="tokyo" title={g.tokyoTitle}><p>{g.tokyoBody}</p><Ext href={g.links.trains.href}>{g.links.trains.label}</Ext></Plain>
            <Plain value="early" title={g.earlyTitle}><p>{g.earlyBody}</p></Plain>
          </Disclosure>
        </section>
    ),
    "stay": (
        <section key="stay" id="stay" aria-labelledby="stay-title" className="travel-section flex scroll-mt-(--travel-head) flex-col gap-4">
          <h2 id="stay-title" className="font-display text-heading text-foreground">{t.stay.title}</h2>
          <p>{t.stay.intro}</p>
          <Disclosure label={t.stay.title} {...one}>
            {t.day.stay.map((a, i) => (
              <Plain key={a.label} value={slug(a.label) === "area" ? `area-${i + 1}` : slug(a.label)} title={a.label}>
                <p>{t.day.stayGood}: {a.good}</p>
                <p className="text-muted-foreground">{t.day.stayWatch}: {a.watch}</p>
                <Ext href={a.maps}>{g.seeOnMap}</Ext>
              </Plain>
            ))}
          </Disclosure>
          <Picks sheet={sheet} setSheet={setSheet} />
        </section>
    ),
    "before": (
        <section key="before" id="before" aria-labelledby="before-title" className="travel-section flex scroll-mt-(--travel-head) flex-col gap-4">
          <h2 id="before-title" className="font-display text-heading text-foreground">{g.beforeTitle}</h2>
          <p className="text-small text-muted-foreground" aria-live="polite">{g.ticked(rows.filter(([v]) => ticks[v]).length, rows.length)}</p>
          <Disclosure label={g.beforeTitle} {...one}>
            {rows.map(([value, title, body]) => <Row key={value} value={value} title={title} done={Boolean(ticks[value])} onTick={(v) => setTick(value, v)} tickLabel={g.tick(title)}>{body}</Row>)}
          </Disclosure>
        </section>
    ),
    "on-the-day": (
        <section key="on-the-day" id="on-the-day" aria-labelledby="on-the-day-title" className="travel-section flex scroll-mt-(--travel-head) flex-col gap-4">
          <h2 id="on-the-day-title" className="font-display text-heading text-foreground">{g.onTheDayTitle}</h2>
          <DriverCard />
          <Disclosure label={g.onTheDayTitle} {...one}>
            <Plain value="trail" title={t.trail.label}><Trail /><p>{g.shuttleBody}</p></Plain>
            <Plain value="walk" title={g.walkingTitle}><p>{g.walkingBody}</p><Ext href={g.links.walk.href}>{g.links.walk.label}</Ext></Plain>
            <Plain value="around" title={t.kyotoMap.title}>{venueMapOn() ? <VenueMap /> : <KyotoMap />}</Plain>
          </Disclosure>
        </section>
    ),
  }
  return (
    <>
      <PageHeader title={t.nav.travel} lettering="travel" />
      {/* Under the header, not in it: they stick to the card's top edge once scrolled past (18e), so their box is the page */}
      <JumpLinks order={order} labels={{ "to-kyoto": g.toKyotoTitle, stay: t.stay.title, before: g.beforeTitle, "on-the-day": g.onTheDayTitle }} />

      {order.map((id) => sections[id])}
    </>
  )
}
