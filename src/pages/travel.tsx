import { useEffect, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { DriverCard } from "@/components/driver-card"
import { FlyingFrom } from "@/components/flying-from"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"

// Ticks live on this device only (localStorage), never sent anywhere.
const KEY = "ng-trip-ticks"
const readTicks = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") } catch { return [] }
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center">{children}</a>
}

/**
 * Travel, three parts with anchors: Getting there (paragraph, driver card, one accordion),
 * Where to stay (three areas, one map link), Before you fly (the tickable checklist).
 */
export function TravelPage() {
  const { t } = useLang()
  const g = t.getting
  const { household } = useHousehold()
  const coming = household?.guests.some((x) => x.attending === "yes")
  const [ticks, setTicks] = useState(readTicks)
  // /travel#stay and #before scroll to their section once the page is in
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [])
  const toggle = (title: string, on: boolean) => {
    const next = on ? [...ticks, title] : ticks.filter((x) => x !== title)
    setTicks(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode */ }
  }
  return (
    <>
      <h1 className="heading">{t.nav.travel}</h1>
      <section id="getting-there" aria-labelledby="getting-title" className="flex scroll-mt-24 flex-col gap-(--letter-gap)">
      <header className="flex flex-col gap-4">
        <h2 id="getting-title" className="font-sans text-base font-semibold text-foreground">{g.title}</h2>
        <p>{g.intro}</p>
      </header>
      <DriverCard />
      <Accordion type="multiple" aria-label={g.rowsLabel}>
        <AccordionItem value="flying">
          <AccordionTrigger>{g.flyingTitle}</AccordionTrigger>
          <AccordionContent>
            <p>{g.flyingBody}</p>
            <p>{g.tokyoBody}</p>
            <div className="flex flex-wrap gap-x-4"><Ext {...g.links.haruka}>{g.links.haruka.label}</Ext><Ext {...g.links.flights}>{g.links.flights.label}</Ext><Ext {...g.links.trains}>{g.links.trains.label}</Ext></div>
            {household && coming && <FlyingFrom token={household.token} />}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="walking">
          <AccordionTrigger>{g.walkingTitle}</AccordionTrigger>
          <AccordionContent><p>{g.walkingBody}</p><Ext {...g.links.walk}>{g.links.walk.label}</Ext></AccordionContent>
        </AccordionItem>
        <AccordionItem value="shuttle">
          <AccordionTrigger>{g.shuttleTitle}</AccordionTrigger>
          <AccordionContent><p>{g.shuttleBody}</p></AccordionContent>
        </AccordionItem>
        <AccordionItem value="early">
          <AccordionTrigger>{g.earlyTitle}</AccordionTrigger>
          <AccordionContent><p>{g.earlyBody}</p></AccordionContent>
        </AccordionItem>
      </Accordion>
      </section>

      <section id="stay" aria-labelledby="stay-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="stay-title" className="heading">{t.stay.title}</h2>
        <p>{t.stay.intro}</p>
        <ul className="flex flex-col divide-y divide-border border-y">
          {t.day.stay.map((a) => (
            <li key={a.label} className="flex flex-col gap-2 py-4">
              <h3 className="font-sans text-base font-semibold text-foreground">{a.label}</h3>
              <p><span className="label-caps mr-2 text-success">{t.day.stayGood}</span>{a.good}</p>
              <p><span className="label-caps mr-2 text-muted-foreground">{t.day.stayWatch}</span>{a.watch}</p>
            </li>
          ))}
        </ul>
        <Ext href={t.stay.mapHref}>{t.stay.mapLink}</Ext>
      </section>

      <section id="before" aria-labelledby="before-title" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="before-title" className="heading">{g.beforeTitle}</h2>
        <p className="hand">{t.travel.tickHint}</p>
        <ul className="flex flex-col gap-4">
          {t.travel.items.slice(0, 4).map((item, i) => {
            const id = `tick-${i}`
            const done = ticks.includes(item.title)
            return (
              <li key={item.title} className="flex items-start gap-3">
                <Checkbox id={id} checked={done} onCheckedChange={(v) => toggle(item.title, v === true)} className="mt-1 size-5 shrink-0" aria-describedby={`${id}-body`} />
                <div className="flex flex-col gap-1">
                  <label htmlFor={id} className="cursor-pointer font-semibold text-foreground">{item.title}{done && <span className="ml-2 font-normal text-muted-foreground">{t.travel.ticked}</span>}</label>
                  <p id={`${id}-body`}>{item.body}</p>
                  {"links" in item && item.links && (
                    <ul className="flex flex-wrap gap-x-4">{item.links.map((l) => <li key={l.href}><Ext href={l.href}>{l.label}</Ext></li>)}</ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {g.tips.map((tip) => <p key={tip}>{tip}</p>)}
        <Ext href={g.links.smartraveller.href}>{g.links.smartraveller.label}</Ext>
      </section>
    </>
  )
}
