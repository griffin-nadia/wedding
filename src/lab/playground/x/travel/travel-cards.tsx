import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, BedDouble, ListChecks, MapPinned, Plane } from "lucide-react"
import { Letter } from "@/components/letter/letter"
import { Scene } from "@/components/letter/scene"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle } from "@/components/ui/sheet"
import { Trail } from "@/components/trail"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { sceneFor } from "@/lib/scenes"
import { useTheme } from "@/lib/theme"
import { ms, still } from "../../motion"

/**
 * Travel's four sections as four paper cards (two columns from 768). Each card leans toward the pointer and lifts
 * under it; tap one and it rises off the letter, then the site's Sheet opens with that section's content. Closing
 * settles the card back down and focus returns to it. Reduced motion: no lean or lift, the sheet just opens.
 */
const css = `
.x-travel-cards { position: relative; min-height: var(--stage-h, 100svh); padding: 16px 12px 24px; }
@media (min-width: 768px) { .x-travel-cards { padding: var(--letter-top) 24px var(--space-8); } }
@media (min-width: 1024px) { .x-travel-cards { padding-left: var(--letter-left); } }
.x-travel-cards .letter { min-height: 0; }
.x-travel-cards-grid { display: grid; gap: var(--space-4); perspective: 900px; }
@media (min-width: 768px) { .x-travel-cards-grid { grid-template-columns: 1fr 1fr; } }
.x-travel-cards-card { --rx: 0deg; --ry: 0deg; --lift: 0px; position: relative; isolation: isolate; display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-3); width: 100%; min-height: 168px;
  padding: var(--space-5); border-radius: var(--radius-section); text-align: left; color: var(--ink-soft); overflow: hidden;
  background: radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, var(--brand-mitsu) 16%, transparent), transparent 60%), color-mix(in oklab, var(--letter-bg) 55%, var(--surface-raised));
  box-shadow: 0 1px 1px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.14), inset 0 0 0 1px var(--line-hairline);
  transform: translateY(calc(var(--lift) * -1)) rotateX(var(--rx)) rotateY(var(--ry)); transform-style: preserve-3d;
  transition: transform 420ms var(--ease-spring), box-shadow 320ms var(--ease-paper); outline: 2px solid transparent; outline-offset: 3px; -webkit-tap-highlight-color: transparent; }
.x-travel-cards-card::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--paper-live, none) center / cover; mix-blend-mode: var(--paper-blend); opacity: 0.6; pointer-events: none; }
/* A folded corner, like a card from a stack */
.x-travel-cards-card::after { content: ""; position: absolute; top: 0; right: 0; width: 26px; height: 26px; border-bottom-left-radius: 8px;
  background: linear-gradient(225deg, var(--letter-bg) 50%, color-mix(in oklab, var(--surface-alt) 80%, var(--ink) 8%) 50%); box-shadow: -1px 1px 2px rgb(0 0 0 / 0.1); }
.x-travel-cards-card:focus-visible { outline-color: var(--input-focus); }
@media (hover: hover) { .x-travel-cards-card:hover { --lift: 4px; box-shadow: 0 2px 2px rgb(0 0 0 / 0.06), 0 14px 28px -12px rgb(0 0 0 / 0.3), inset 0 0 0 1px var(--line-hairline); } }
.x-travel-cards-card:active { --lift: 1px; transition-duration: 120ms; }
.x-travel-cards-card[data-open] { --lift: 14px; --rx: 6deg; --ry: 0deg; box-shadow: 0 30px 50px -18px rgb(0 0 0 / 0.4), inset 0 0 0 1px var(--line-hairline); z-index: 2; }
.x-travel-cards-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--surface-alt); color: var(--ink-moss); }
.x-travel-cards-title { font-family: var(--font-display); font-size: var(--type-heading-size); line-height: var(--type-heading-leading); color: var(--ink); }
.x-travel-cards-line { padding-right: 56px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: var(--type-small-size); line-height: var(--type-small-leading); }
.x-travel-cards-num { position: absolute; right: var(--space-5); bottom: var(--space-4); font-family: var(--font-display); font-size: 40px; line-height: 1; color: color-mix(in oklab, var(--ink) 9%, transparent); }
.x-travel-cards-part { display: flex; flex-direction: column; gap: var(--space-3); padding-block: var(--space-4); border-top: 1px solid var(--line-hairline); }
.x-travel-cards-part:first-child { border-top: 0; padding-top: 0; }
.x-travel-cards-link { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; align-self: flex-start; }
@media (prefers-reduced-motion: reduce) { .x-travel-cards-card, .x-travel-cards-card[data-open], .x-travel-cards-card:hover { transform: none; transition: none; } }
`

const firstSentence = (s: string) => (s.match(/^.+?[.!?。！？](?=\s|$)/u)?.[0] ?? s).trim()

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="btn-text x-travel-cards-link">{children}<ArrowUpRight className="size-4" aria-hidden /></a>
}
function Part({ title, children }: { title?: string; children: React.ReactNode }) {
  return <section className="x-travel-cards-part">{title && <h3 className="font-medium text-foreground">{title}</h3>}{children}</section>
}

export default function TravelCards() {
  const { t } = useLang()
  const { theme } = useTheme()
  const g = t.getting
  const [lifted, setLifted] = useState("")
  const [which, setWhich] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const cards = [
    { id: "to-kyoto", Icon: Plane, title: g.toKyotoTitle, line: firstSentence(g.flyingBody), body: <>
      <Part title={g.rows.flights}><p>{t.travel.items[1].body}</p><p>{g.flyingBody}</p><div className="flex flex-wrap gap-x-4"><Ext href={g.links.haruka.href}>{g.links.haruka.label}</Ext><Ext href={g.links.flights.href}>{g.links.flights.label}</Ext></div></Part>
      <Part title={g.tokyoTitle}><p>{g.tokyoBody}</p><Ext href={g.links.trains.href}>{g.links.trains.label}</Ext></Part>
      <Part title={g.earlyTitle}><p>{g.earlyBody}</p></Part>
    </> },
    { id: "stay", Icon: BedDouble, title: t.stay.title, line: firstSentence(t.stay.intro), body: <>
      <Part><p>{t.stay.intro}</p></Part>
      {t.day.stay.map((a) => <Part key={a.label} title={a.label}><p>{t.day.stayGood}: {a.good}</p><p className="text-muted-foreground">{t.day.stayWatch}: {a.watch}</p><Ext href={a.maps}>{g.seeOnMap}</Ext></Part>)}
      <Part title={`${t.stay.picks.title}: ${t.stay.picks.hotelsTitle}`}>
        <p className="text-small text-muted-foreground">{t.stay.picks.note}</p>
        <ul className="flex flex-col">{t.stay.picks.hotels.map((h) => (
          <li key={h.href}><a href={h.href} target="_blank" rel="noreferrer" className="stay-row stay-pick"><span className="flex min-w-0 flex-1 flex-col"><span className="font-medium text-foreground">{h.name}</span><span className="text-small">{[h.area, t.stay.picks.perNight(h.price)].join(" · ")}</span></span><ArrowUpRight className="size-5 shrink-0 text-muted-foreground" aria-hidden /><span className="sr-only">, {t.stay.picks.opensHotel}</span></a></li>
        ))}</ul>
      </Part>
    </> },
    { id: "before", Icon: ListChecks, title: g.beforeTitle, line: [g.rows.passport, g.rows.insurance, g.rows.phones].join(", "), body: <>
      <Part title={g.rows.passport}><p>{t.travel.items[0].body}</p></Part>
      <Part title={g.rows.insurance}><p>{g.insuranceBody}</p><Ext href={g.links.smartraveller.href}>{g.links.smartraveller.label}</Ext></Part>
      <Part title={g.rows.booking}><p>{t.travel.items[2].body}</p></Part>
      <Part title={g.rows.phones}><p>{t.travel.items[3].body}</p><p>{g.tips[1]}</p><div className="flex flex-wrap gap-x-4">{("links" in t.travel.items[3] ? t.travel.items[3].links ?? [] : []).map((l) => <Ext key={l.href} href={l.href}>{l.label}</Ext>)}</div></Part>
      <Part title={g.rows.weather}><p>{g.tips[0]}</p></Part>
      <Part title={g.rows.medicines}><p>{g.tips[2]}</p></Part>
    </> },
    { id: "on-the-day", Icon: MapPinned, title: g.onTheDayTitle, line: g.shuttleTitle, body: <>
      <Part><Trail /></Part>
      <Part title={g.shuttleTitle}><p>{g.shuttleBody}</p><p className="text-small text-muted-foreground">{t.driver.fare}</p></Part>
      <Part title={g.walkingTitle}><p>{g.walkingBody}</p><Ext href={g.links.walk.href}>{g.links.walk.label}</Ext></Part>
      <Part title={VENUE.name}>{t.day.addressLines.map((l) => <p key={l}>{l}</p>)}</Part>
    </> },
  ]
  const tap = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.currentTarget.style.removeProperty("--rx"); e.currentTarget.style.removeProperty("--ry")
    setLifted(id); setWhich(id)
    clearTimeout(timer.current)
    // The card rises first, then the sheet comes up over it
    if (still()) setIsOpen(true)
    else timer.current = window.setTimeout(() => setIsOpen(true), ms(200))
  }
  const close = () => { setIsOpen(false); setLifted("") }
  const lean = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || still()) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width) - 0.5) * 6}deg`)
    e.currentTarget.style.setProperty("--rx", `${(0.5 - (e.clientY - r.top) / r.height) * 6}deg`)
  }
  const unlean = (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.style.removeProperty("--rx"); e.currentTarget.style.removeProperty("--ry") }
  const shown = cards.find((c) => c.id === which)
  return (
    <div className="x-travel-cards">
      <style>{css}</style>
      <Scene source={sceneFor(theme)} />
      <Letter>
        <header className="flex flex-col gap-2">
          <h1 className="heading">{t.nav.travel}</h1>
          <p>{g.intro}</p>
        </header>
        <ul className="x-travel-cards-grid">
          {cards.map(({ id, Icon, title, line }, i) => (
            <li key={id}>
              <button type="button" className="x-travel-cards-card" data-open={lifted === id || undefined} aria-haspopup="dialog" aria-expanded={isOpen && which === id}
                onClick={(e) => tap(e, id)} onPointerMove={(e) => lifted !== id && lean(e)} onPointerLeave={unlean}>
                <span aria-hidden className="x-travel-cards-icon"><Icon className="size-5" /></span>
                <span className="x-travel-cards-title">{title}</span>
                <span className="x-travel-cards-line">{line}</span>
                <span aria-hidden className="x-travel-cards-num">{String(i + 1).padStart(2, "0")}</span>
              </button>
            </li>
          ))}
        </ul>
      </Letter>
      <Sheet open={isOpen} onOpenChange={(o) => { if (!o) close() }}>
        {shown && (
          <SheetContent aria-describedby={undefined}>
            <SheetHead>
              <SheetTitle className="heading">{shown.title}</SheetTitle>
            </SheetHead>
            <SheetBody><div className="flex flex-col">{shown.body}</div></SheetBody>
          </SheetContent>
        )}
      </Sheet>
    </div>
  )
}
