import { useEffect } from "react"
import { ChevronRight } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Disclosure } from "@/components/disclosure"
import { DriverCard } from "@/components/driver-card"
import { FlyingFrom } from "@/components/flying-from"
import { Trail } from "@/components/trail"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { useOption } from "@/lib/options"

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{children}</a>
}

/** A numbered row with a one-line reveal (v3 M). */
function Row({ n, value, title, children }: { n: number; value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <span className="flex items-baseline gap-4">
          <span aria-hidden className="numerals w-6 shrink-0 text-primary">{String(n).padStart(2, "0")}</span>
          <span><span className="sr-only">{n}. </span>{title}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent><div className="flex flex-col gap-3 pl-10">{children}</div></AccordionContent>
    </AccordionItem>
  )
}

/**
 * Travel (v3 A): Getting there (one paragraph, the driver card, the trail), Where to stay (three rows,
 * the whole row opens Maps), Before you fly (numbered rows). No checklist, no tiles.
 */
export function TravelPage() {
  const { t } = useLang()
  const g = t.getting
  const { household } = useHousehold()
  const coming = household?.guests.some((x) => x.attending === "yes")
  // v3 P: "Flying from" exists only when the story map (Our story B) and its Flying from option are on
  const storyOpt = useOption("story"), flyingOpt = useOption("flying")
  const flyingOn = storyOpt === "b" && flyingOpt === "on"
  // /travel#stay and #before scroll to their section once the page is in
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [])
  const rows: [string, string, React.ReactNode][] = [
    ["passport", g.rows.passport, <p>{t.travel.items[0].body}</p>],
    ["flights", g.rows.flights, <>
      <p>{t.travel.items[1].body}</p><p>{g.flyingBody}</p><p>{g.tokyoBody}</p>
      <div className="flex flex-wrap gap-x-4"><Ext href={g.links.haruka.href}>{g.links.haruka.label}</Ext><Ext href={g.links.flights.href}>{g.links.flights.label}</Ext><Ext href={g.links.trains.href}>{g.links.trains.label}</Ext></div>
      {household && coming && flyingOn && <FlyingFrom token={household.token} />}
    </>],
    ["booking", g.rows.booking, <p>{t.travel.items[2].body}</p>],
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

      <section id="getting-there" aria-labelledby="getting-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="getting-title" className="font-display text-2xl text-foreground">{g.title}</h2>
        <p>{g.intro}</p>
        <DriverCard />
        <Trail />
      </section>

      <section id="stay" aria-labelledby="stay-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="stay-title" className="font-display text-2xl text-foreground">{t.stay.title}</h2>
        <p>{t.stay.intro}</p>
        <ol className="flex flex-col border-y border-border">
          {t.day.stay.map((a, i) => (
            <li key={a.label} className="border-b border-border last:border-b-0">
              <a href={a.maps} target="_blank" rel="noreferrer" className="stay-row">
                <span aria-hidden className="numerals w-6 shrink-0 text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium text-foreground">{a.label}</span>
                  <span className="text-sm">{t.day.stayGood}: {a.good}</span>
                  <span className="text-sm text-muted-foreground">{t.day.stayWatch}: {a.watch}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="sr-only">, {g.stayOpens}</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section id="before" aria-labelledby="before-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="before-title" className="font-display text-2xl text-foreground">{g.beforeTitle}</h2>
        <Disclosure label={g.beforeTitle}>
          {rows.map(([value, title, body], i) => <Row key={value} n={i + 1} value={value} title={title}>{body}</Row>)}
        </Disclosure>
      </section>
    </>
  )
}
