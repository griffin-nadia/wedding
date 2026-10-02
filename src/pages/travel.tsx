import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useLang } from "@/lib/lang"
import { TravelDates } from "@/components/slots"
import { Photo } from "@/components/photo"

// Ticks live on this device only (localStorage), never sent anywhere.
const KEY = "ng-trip-ticks"
const readTicks = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") } catch { return [] }
}

export function TravelPage() {
  const { t } = useLang()
  const [ticks, setTicks] = useState(readTicks)
  const toggle = (title: string, on: boolean) => {
    const next = on ? [...ticks, title] : ticks.filter((x) => x !== title)
    setTicks(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode */ }
  }
  return (
    <div className="mx-auto max-w-[40rem] space-y-6 py-6 md:py-12">
      <header className="space-y-2">
        <h1 className="title leaf-rule">{t.travel.title}</h1>
        <p className="text-body">{t.travel.lead}</p>
        <p className="hand text-sm text-muted-foreground">{t.travel.tickHint}</p>
      </header>
      <TravelDates />
      <div className="space-y-3">
        {t.travel.items.map((item, i) => {
          const done = ticks.includes(item.title)
          const id = `tick-${i}`
          return (
            <Card key={item.title}>
              <CardContent className="flex-row items-start gap-4">
                <Checkbox id={id} checked={done} onCheckedChange={(v) => toggle(item.title, v === true)} className="mt-1 size-6 shrink-0 after:-inset-3" aria-describedby={`${id}-body`} />
                <div className="space-y-2">
                  <label htmlFor={id} className="block cursor-pointer font-sans text-base font-bold">
                    {item.title}{done && <span className="ml-2 text-sm font-normal text-muted-foreground">{t.travel.ticked}</span>}
                  </label>
                  <p id={`${id}-body`} className="text-sm text-body">{item.body}</p>
                  {"links" in item && item.links && (
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {item.links.map((l) => (
                        <li key={l.href}><a className="inline-flex min-h-11 items-center text-primary underline underline-offset-4" href={l.href} target="_blank" rel="noreferrer">{l.label}</a></li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <section aria-labelledby="handy" className="space-y-3 pt-6">
        <h2 id="handy" className="title leaf-rule">{t.travel.moreTitle}</h2>
        {t.travel.more.map((m) => (
          <div key={m.label} className="space-y-2 rounded-[1.25rem] bg-card p-5 shadow-paper ring-1 ring-border">
            {"photo" in m && m.photo && <Photo name={m.photo} treatment="split" sizes="(min-width: 640px) 600px, 90vw" className="mb-3" />}
            <h3 className="label-caps text-eyebrow">{m.label}</h3>
            <p className="text-body">{m.body}</p>
            {"action" in m && m.action && (
              <a href={m.action.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-link underline underline-offset-4">{m.action.label}</a>
            )}
          </div>
        ))}
        <p className="text-sm text-muted-foreground">
          <Link to="/the-day#getting-there" className="text-link underline underline-offset-4">{t.travel.toVenue}</Link>
        </p>
      </section>
    </div>
  )
}
