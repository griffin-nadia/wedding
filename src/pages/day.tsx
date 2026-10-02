import { useEffect, useState } from "react"
import { Tabs as TabsPrimitive } from "radix-ui"
import { MotionConfig, motion } from "motion/react"
import { CloudRain, Flower2, Printer, UtensilsCrossed, Wine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Qr } from "@/components/qr"
import { Photo } from "@/components/photo"
import { InfoBlock, TimelineRow } from "@/components/blocks"
import { DriverCard } from "@/components/driver-card"
import { Reveal } from "@/components/reveal"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { jstLabel, kyotoNow, localTime } from "@/lib/time"
import { mapUrl } from "@/lib/calendar"
import { cn } from "@/lib/utils"

const TABS = ["details", "timeline", "getting-there", "stay", "faq"] as const
type Tab = (typeof TABS)[number]
const fromHash = (): Tab => {
  const h = window.location.hash.replace("#", "") as Tab
  return TABS.includes(h) ? h : "details"
}
const ICONS = [Flower2, Wine, UtensilsCrossed]

/**
 * On the wedding day only (Japan time): where "now" sits between the schedule rows, 0 to 1.
 * ?now=2027-10-15T12:30 mocks the time for checking.
 */
function nowOnTheDay(real: Date, times: string[]) {
  const mock = new URLSearchParams(location.search).get("now")
  const now = mock ? new Date(`${mock}:00+09:00`) : real
  if (now.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }) !== "2027-10-15") return null
  const at = (hhmm: string) => new Date(`2027-10-15T${hhmm}:00+09:00`).getTime()
  const start = at(times[0]), end = at("15:30")
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)))
}
function NowMarker({ at, label }: { at: number; label: string }) {
  return (
    <span className="absolute -left-[0.2rem] z-10 flex items-center gap-2" style={{ top: `calc(${at * 100}% - 0.5rem)` }}>
      <span aria-hidden className="size-3 rounded-full bg-primary ring-4 ring-background" />
      <span className="label-caps rounded-full bg-primary px-2 py-0.5 text-primary-foreground">{label}</span>
    </span>
  )
}

/** The day as one tabbed panel (Susie & Jay): Details · Timeline · Getting there · Stay · FAQ. Deep-linkable. */
export function DayPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>(fromHash)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const onHash = () => setTab(fromHash())
    window.addEventListener("hashchange", onHash)
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => { window.removeEventListener("hashchange", onHash); clearInterval(id) }
  }, [])
  const nowAt = nowOnTheDay(now, t.day.schedule.map((x) => x.time))
  const change = (v: string) => {
    setTab(v as Tab)
    history.replaceState(null, "", `#${v}`)
  }
  const labels: Record<Tab, string> = { details: t.day.tabs.details, timeline: t.day.tabs.timeline, "getting-there": t.day.tabs.getting, stay: t.day.tabs.stay, faq: t.day.tabs.faq }

  return (
    <div className="mx-auto max-w-[40rem] space-y-8 py-6 md:py-12">
      <header className="space-y-2">
        <h1 className="title leaf-rule">{t.day.title}</h1>
        <p className="text-body">{t.day.date} · {t.day.venue}</p>
      </header>

      <MotionConfig reducedMotion="user">
      <TabsPrimitive.Root value={tab} onValueChange={change} className="space-y-6">
        <TabsPrimitive.List aria-label={t.day.title} className="no-print grid grid-cols-3 gap-1 rounded-[1.25rem] bg-secondary/60 p-1 min-[400px]:grid-cols-5">
          {TABS.map((v) => (
            <TabsPrimitive.Trigger key={v} value={v}
              className="relative min-h-12 rounded-2xl px-2 text-sm font-medium text-body outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=active]:text-foreground">
              {tab === v && <motion.span layoutId="day-tab" transition={{ type: "spring", stiffness: 400, damping: 34 }} className="absolute inset-0 rounded-2xl bg-card shadow-paper" />}
              <span className="relative">{labels[v]}</span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        <TabsPrimitive.Content forceMount value="details" className="print:!block print:mt-8 data-[state=inactive]:hidden space-y-6 outline-none">
          <p className="text-lg text-body">{t.day.venueFacts}</p>
          <section className="flex gap-4 rounded-[1.25rem] bg-card p-4 shadow-paper ring-1 ring-border print:shadow-none">
            <div className="flex-1 space-y-2">
              <p className="text-sm text-body">{t.day.address}</p>
              <p className="label-caps text-muted-foreground">{t.day.showDriver}</p>
              <p lang="ja" className="font-ja text-lg leading-snug">{VENUE.addressJa}</p>
            </div>
            <figure className="w-24 shrink-0 text-center">
              <Qr value={mapUrl} label={t.day.mapQr} className="size-24 text-foreground" />
              <figcaption className="text-xs text-muted-foreground">{t.day.mapQr}</figcaption>
            </figure>
          </section>
          <p className="text-body">{t.day.dressCode}</p>
          <p className="hand text-sm text-muted-foreground">{t.day.contacts}</p>
          <div className="no-print flex flex-wrap gap-3">
            <Button asChild variant="outline" size="lg"><a href={mapUrl} target="_blank" rel="noreferrer">{t.day.openMap}</a></Button>
            <Button variant="outline" size="lg" onClick={() => window.print()}><Printer aria-hidden />{t.day.print}</Button>
          </div>
          <div className="no-print"><AddToCalendar /></div>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content forceMount value="timeline" className="print:!block print:mt-8 data-[state=inactive]:hidden space-y-6 outline-none">
          <ol className="relative space-y-8 pl-12">
            <span aria-hidden className="absolute top-2 bottom-2 left-[1.15rem] w-0.5 rounded bg-border" />
            <span aria-hidden className="timeline-fill absolute top-2 bottom-2 left-[1.15rem] w-0.5 origin-top rounded bg-leaf" />
            {nowAt !== null && <NowMarker at={nowAt} label={t.day.now} />}
            {t.day.schedule.map((s, i) => {
              const Icon = ICONS[i] ?? Flower2
              return <Reveal key={s.time}><TimelineRow icon={<Icon className="size-5" strokeWidth={1.6} />} time={jstLabel(s.time)} title={s.label} where={s.where} local={localTime(s.time)} /></Reveal>
            })}
          </ol>
          <p className="flex items-start gap-2 rounded-[1.25rem] bg-card p-4 text-sm text-body ring-1 ring-border"><CloudRain aria-hidden className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.6} />{t.day.rainPlan}</p>
          <p className="text-sm text-muted-foreground">{t.day.japanTime} <span className="no-print">{t.day.kyotoNow(kyotoNow(now))}</span></p>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content forceMount value="getting-there" className="print:!block print:mt-8 data-[state=inactive]:hidden space-y-6 outline-none">
          <Photo name="pontocho-lanterns" treatment="split" sizes="(min-width: 640px) 640px, 100vw" className="no-print" />
          <header className="space-y-1">
            <h2 className="font-display text-3xl">{t.day.gettingTitle} <span lang="ja" className="font-ja text-xl text-muted-foreground">· {t.day.gettingTitleJa}</span></h2>
            <p className="text-body">{t.day.gettingIntro}</p>
          </header>
          {/* The easy way: three steps on one line of ink */}
          <section aria-labelledby="easy" className="space-y-3 rounded-[1.25rem] bg-card p-5 shadow-paper ring-1 ring-border">
            <h3 id="easy" className="label-caps text-eyebrow">{t.day.easyWay}</h3>
            <ol className="relative space-y-4 pl-8">
              <span aria-hidden className="absolute top-2 bottom-2 left-[0.6rem] w-0.5 rounded bg-border" />
              {t.day.route.map((r, i) => (
                <li key={r.place} className="relative">
                  <span aria-hidden className={cn("absolute top-1.5 -left-8 size-4 rounded-full ring-4 ring-card", i === t.day.route.length - 1 ? "bg-primary" : "bg-leaf")} />
                  <p className="font-semibold">{r.place}</p>
                  <p className="text-sm text-body">{r.note}</p>
                </li>
              ))}
            </ol>
          </section>
          <DriverCard />
          <section aria-labelledby="handy" className="space-y-3">
            <h3 id="handy" className="title text-[1.5rem]">{t.day.handyTitle}</h3>
            {t.day.handy.map((h) => (
              <InfoBlock key={h.label} as="h4" label={h.label} action={h.action}>
                <p className="font-semibold text-foreground">{h.title}</p>
                <p className="text-sm">{h.body}</p>
              </InfoBlock>
            ))}
          </section>
          <section className="space-y-1 rounded-[1.25rem] border-2 border-highlight/60 bg-card p-5">
            <p className="label-caps text-eyebrow">{t.day.headsUpLabel}</p>
            <p className="font-semibold">{t.day.headsUpTitle}</p>
            <p className="text-sm text-body">{t.day.headsUpBody}</p>
          </section>
          <InfoBlock label={t.day.earlyTitle} as="h3">{t.day.earlyBody}</InfoBlock>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="stay" className="space-y-3 outline-none">
          <Photo name="higashiyama-bookshop" treatment="split" sizes="(min-width: 640px) 640px, 100vw" />
          <p className="text-body">{t.day.stayIntro}</p>
          {t.day.stay.map((a) => (
            <InfoBlock key={a.label} label={a.label}>
              <p className="text-sm"><span className="label-caps mr-2 text-success">{t.day.stayGood}</span>{a.good}</p>
              <p className="text-sm"><span className="label-caps mr-2 text-muted-foreground">{t.day.stayWatch}</span>{a.watch}</p>
            </InfoBlock>
          ))}
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="faq" className="outline-none">
          <Accordion type="single" collapsible className={cn("rounded-[1.25rem] bg-card px-5 shadow-paper ring-1 ring-border")}>
            {t.qa.items.map((item, i) => (
              <AccordionItem key={item.q} value={`q${i}`}>
                <AccordionTrigger className="min-h-12 text-base font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="text-base text-body">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
      </MotionConfig>
    </div>
  )
}
