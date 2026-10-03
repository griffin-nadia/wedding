import { useState } from "react"
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

/** Getting there: title, one paragraph, the driver card, then one accordion (not seven cards). */
export function TravelPage() {
  const { t } = useLang()
  const g = t.getting
  const { household } = useHousehold()
  const coming = household?.guests.some((x) => x.attending === "yes")
  const [ticks, setTicks] = useState(readTicks)
  const toggle = (title: string, on: boolean) => {
    const next = on ? [...ticks, title] : ticks.filter((x) => x !== title)
    setTicks(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode */ }
  }
  return (
    <>
      <header className="flex flex-col gap-4">
        <h1 className="heading">{g.title}</h1>
        <p>{g.intro}</p>
      </header>
      <DriverCard />
      <Accordion type="multiple" aria-label={g.rowsLabel}>
        <AccordionItem value="before">
          <AccordionTrigger>{g.beforeTitle}</AccordionTrigger>
          <AccordionContent>
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
          </AccordionContent>
        </AccordionItem>
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
    </>
  )
}
