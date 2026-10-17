import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import { FieldError, FormField } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { RadioGroup } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Hanko } from "@/components/hanko"
import { answerOf, type Guest } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { dietString, OTHER_MAX, parseDiet } from "@/lib/diet"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { DATES } from "@/lib/wedding-dates"
import { spring, still } from "../../motion"

/**
 * Experiment: the reply as one question per screen. Each guest's answer, their dietary needs, a song (typed), the
 * dates and a message, each full screen, sliding on a spring; a progress line along the top springs ahead with a
 * little overshoot. Back is always there, Enter moves on, and it ends on a local "You're all set" with the hanko.
 * Nothing is sent: the reply only lives in this component. Reduced motion: screens cross-fade, the line just moves.
 */
const css = `
.x-oq { position: relative; isolation: isolate; min-height: var(--stage-h, 100svh); height: var(--stage-h, 100svh); display: grid; grid-template-rows: auto 1fr auto; background: var(--letter-bg); color: var(--ink); overflow: hidden; }
.x-oq::before { content: ""; position: absolute; inset: 0; z-index: -1; background-image: var(--paper); background-size: var(--paper-size); opacity: 0.6; pointer-events: none; }
.x-oq-top { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px 14px; }
.x-oq-line { position: absolute; left: 0; right: 0; top: 0; height: 4px; background: var(--line-hairline); }
.x-oq-line span { position: absolute; inset: 0; background: var(--action); transform-origin: 0 50%; transform: scaleX(0); border-radius: 0 2px 2px 0; }
.x-oq-count { font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); color: var(--ink-muted); text-transform: uppercase; }
.x-oq-back { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; min-width: 44px; padding-inline: 8px 12px; border-radius: var(--radius-control); color: var(--ink); font: 500 var(--type-ui-size) / 1 var(--font-label); }
.x-oq-back:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.x-oq-back[aria-hidden="true"] { visibility: hidden; }
.x-oq-stage { position: relative; overflow: hidden; }
.x-oq-panel { position: absolute; inset: 0; display: flex; flex-direction: column; overflow-y: auto; overscroll-behavior: contain; padding: 4svh 16px 10svh; will-change: transform, opacity; }
.x-oq-inner { width: 100%; max-width: 36rem; margin: auto; display: flex; flex-direction: column; gap: 20px; }
.x-oq-eyebrow { font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--ink-story); }
.x-oq-q { margin: 0; font-family: var(--font-display); font-size: clamp(2rem, 7vw, 3.25rem); line-height: 1.08; letter-spacing: var(--type-display-tracking); color: var(--ink); outline: none; text-wrap: balance; }
.x-oq [role="group"] > .form-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.x-oq .radio-group-label { font-family: var(--font-display); font-size: var(--type-heading-size); line-height: var(--type-heading-leading); color: var(--ink-soft); }
.x-oq-foot { display: flex; justify-content: center; padding: 12px 16px calc(16px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line-hairline); background: color-mix(in oklab, var(--letter-bg) 92%, transparent); }
.x-oq-foot > div { width: 100%; max-width: 36rem; display: flex; justify-content: flex-end; }
.x-oq-foot button { width: 100%; }
@media (min-width: 640px) { .x-oq-foot button { width: auto; } }
.x-oq-review { margin: 0; border: 1px solid var(--line-hairline); border-radius: var(--radius-control); background: var(--surface-raised); }
.x-oq-review > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 8px 10px 16px; }
.x-oq-review > div + div { border-top: 1px solid var(--line-hairline); }
.x-oq-review dt { font-size: var(--type-small-size); color: var(--ink-muted); }
.x-oq-review dd { margin: 0; color: var(--ink); overflow-wrap: anywhere; }
.x-oq-edit { min-height: 44px; padding-inline: 12px; border-radius: var(--radius-control); color: var(--ink-link); font: 500 var(--type-ui-small-size) / 1 var(--font-label); text-decoration: underline; text-underline-offset: 3px; flex-shrink: 0; }
.x-oq-edit:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.x-oq-done { min-height: var(--stage-h, 100svh); display: grid; place-items: center; padding: 24px 16px; text-align: center; }
.x-oq-done > div { display: flex; flex-direction: column; align-items: center; gap: 20px; max-width: 30rem; animation: x-oq-rise 600ms var(--ease-paper) both; }
@keyframes x-oq-rise { from { opacity: 0; transform: translateY(24px); } }
@media (prefers-reduced-motion: reduce) {
  .x-oq-panel { transition: opacity 240ms linear; }
  .x-oq-done > div { animation: x-oq-fade 300ms linear both; }
  @keyframes x-oq-fade { from { opacity: 0; } }
}
`
const MAX = { name: 40, song: 200, message: 2000 }
const TRIP = { from: DATES.travelFrom, to: DATES.travelTo }
const blankPlusOne = (g: Guest) => (g.plusOne && /^(guest|plus one|\+1)$/i.test(g.firstName.trim()) ? { ...g, firstName: "" } : g)
type Screen = { key: string; kind: "who" | "plus" | "diet" | "song" | "dates" | "message" | "check"; g?: Guest }

export default function RsvpOneQuestion() {
  const { t } = useLang()
  const { household } = useHousehold()
  if (!household) return <div className="x-oq"><style>{css}</style></div>
  return <Flow key={household.token} guests={household.guests.map(blankPlusOne)} t={t} />
}

function Flow({ guests: initial, t }: { guests: Guest[]; t: ReturnType<typeof useLang>["t"] }) {
  const [guests, setGuests] = useState(initial)
  const [song, setSong] = useState("")
  const [arrival, setArrival] = useState("")
  const [departure, setDeparture] = useState("")
  const [message, setMessage] = useState("")
  const [photos, setPhotos] = useState(true)
  const [missing, setMissing] = useState("")
  const [sent, setSent] = useState(false)
  const [at, setAt] = useState(0)

  const nameOf = (g: Guest) => g.firstName || t.rsvp.plusOneName
  const coming = guests.filter((g) => g.attending === "yes")
  const screens: Screen[] = [
    ...guests.filter((g) => !g.plusOne).map((g) => ({ key: `who-${g.id}`, kind: "who" as const, g })),
    ...guests.filter((g) => g.plusOne).map((g) => ({ key: `plus-${g.id}`, kind: "plus" as const, g })),
    ...coming.map((g) => ({ key: `diet-${g.id}`, kind: "diet" as const, g })),
    ...(coming.length ? [{ key: "song", kind: "song" as const }, { key: "dates", kind: "dates" as const }] : []),
    { key: "message", kind: "message" },
    { key: "check", kind: "check" },
  ]
  const total = screens.length
  const outside = (d: string) => Boolean(d) && (d < TRIP.from || d > TRIP.to)
  const dateError = outside(arrival) || outside(departure) ? t.rsvp.dateRange : arrival && departure && departure < arrival ? t.rsvp.dateOrder : ""
  const setGuest = (id: string, patch: Partial<Guest>) => { setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g))); setMissing("") }

  // Where the screens are (in screens, fractional while sliding), and the progress line, both on springs
  const target = useRef(0), pos = useRef(0), cancelPos = useRef(() => {}), cancelLine = useRef(() => {}), line = useRef(0)
  const panels = useRef<(HTMLDivElement | null)[]>([])
  const bar = useRef<HTMLSpanElement>(null)
  const paint = useCallback(() => {
    const p = pos.current, calm = still()
    panels.current.forEach((el, i) => {
      if (!el) return
      const d = i - p, a = Math.abs(d)
      el.style.visibility = a < 0.999 || i === target.current ? "" : "hidden"
      if (calm) { el.style.transform = ""; el.style.opacity = a < 0.5 ? "1" : "0"; return }
      // The arriving screen comes in from the side; the leaving one drifts the other way, a little smaller
      el.style.transform = `translate3d(${d * 100}%, 0, 0) scale(${1 - Math.min(1, a) * 0.06})`
      el.style.opacity = String(Math.max(0, 1 - a * 1.2))
    })
  }, [])
  const paintLine = (v: number) => { if (bar.current) bar.current.style.transform = `scaleX(${Math.max(0, v)})` }

  // Every render places the screens where the spring has them (new screens appear as answers change)
  useLayoutEffect(() => { paint(); paintLine(line.current) })
  // The line's target moves when a screen is added or taken away (a guest says coming or not)
  useEffect(() => {
    cancelLine.current()
    cancelLine.current = spring(line.current, (at + 1) / total, (v) => { line.current = v; paintLine(v) }, { k: 260, c: 13 })
  }, [at, total])
  useEffect(() => () => { cancelPos.current(); cancelLine.current() }, [])

  const headings = useRef<(HTMLHeadingElement | null)[]>([])
  const go = (n: number) => {
    const to = Math.max(0, Math.min(total - 1, n))
    if (to === at) return
    setAt(to); setMissing(""); target.current = to
    cancelPos.current()
    cancelPos.current = spring(pos.current, to, (v) => { pos.current = v; paint() }, { k: 190, c: 24 })
    if (still()) paint()
    // (the line springs ahead in the effect above, with less damping than the screens, so it overshoots a little)
    requestFocus(to)
  }
  const focusNext = useRef<number | null>(null)
  const requestFocus = (i: number) => { focusNext.current = i }
  useEffect(() => {
    if (focusNext.current === null) return
    headings.current[focusNext.current]?.focus({ preventScroll: true })
    panels.current[focusNext.current]?.scrollTo({ top: 0 })
    focusNext.current = null
  })

  const screen = screens[at]
  function next() {
    if (screen.kind === "who" && screen.g && !screen.g.attending) {
      setMissing(t.rsvp.answerMissing(nameOf(screen.g)))
      panels.current[at]?.querySelector<HTMLInputElement>("input[type=radio]")?.focus()
      return
    }
    if (screen.kind === "dates" && dateError) { panels.current[at]?.querySelector<HTMLInputElement>("input")?.focus(); return }
    if (screen.kind === "check") return send()
    go(at + 1)
  }
  function send() {
    // An unticked "Bringing someone?" is a no. Nothing leaves this page: the reply ends here, on this device.
    setGuests((gs) => gs.map((g) => (g.plusOne && g.attending !== "yes" ? { ...g, attending: "no" } : g)))
    setSent(true)
  }

  if (sent) {
    const answer = answerOf({ guests: guests.map((g) => (g.plusOne && g.attending !== "yes" ? { ...g, attending: "no" as const } : g)) })
    return (
      <div className="x-oq" style={{ display: "block" }}>
        <style>{css}</style>
        <div className="x-oq-done" role="status">
          <div>
            {answer !== "none" && <Hanko stamp />}
            <h1 className="x-oq-q">{t.rsvp.doneTitle[answer]}</h1>
            <p className="text-muted-foreground">{t.rsvp.sentLine}</p>
            <button type="button" className="btn-text min-h-11" onClick={() => { setSent(false); pos.current = 0; target.current = 0; line.current = 0; setAt(0) }}>{t.rsvp.changeReply}</button>
          </div>
        </div>
      </div>
    )
  }

  const body = (s: Screen, i: number): ReactNode => {
    const h = (eyebrow: ReactNode, q: ReactNode) => <>
      {eyebrow && <p className="x-oq-eyebrow">{eyebrow}</p>}
      <h2 ref={(el) => { headings.current[i] = el }} tabIndex={-1} className="x-oq-q">{q}</h2>
    </>
    const g = s.g
    switch (s.kind) {
      case "who": return <>
        {h(null, t.rsvp.whoTitle)}
        <RadioGroup id={`x-oq-${g!.id}`} name={`x-oq-${g!.id}`} label={g!.firstName} value={g!.attending ?? ""} invalid={Boolean(missing) && i === at}
          describedBy={missing && i === at ? "x-oq-missing" : undefined}
          onChange={(v) => setGuest(g!.id, { attending: v as Guest["attending"] })}
          options={[{ value: "yes", label: t.rsvp.coming }, { value: "no", label: t.rsvp.notComing }]} />
        <FieldError id="x-oq-missing">{i === at ? missing : ""}</FieldError>
      </>
      case "plus": return <>
        {h(null, t.rsvp.bringing)}
        {/* Their name is the answer: blank is a no (or not sure yet), a name is a yes */}
        <FormField id={`x-oq-name-${g!.id}`} label={t.rsvp.plusOne} help={t.rsvp.plusOneHint}>
          <Input id={`x-oq-name-${g!.id}`} value={g!.firstName} maxLength={MAX.name} autoComplete="off" autoCapitalize="words" enterKeyHint="next" data-filled={Boolean(g!.firstName.trim())}
            aria-describedby={`x-oq-name-${g!.id}-help`} onChange={(e) => setGuest(g!.id, { firstName: e.target.value, attending: e.target.value.trim() ? "yes" : "no" })} />
        </FormField>
      </>
      case "diet": {
        const options = t.rsvp.dietaryOptions, other = options[options.length - 1], d = parseDiet(g!.dietary, options)
        return <>
          {h(nameOf(g!), t.rsvp.dietary)}
          <CheckboxGroup labelId={`x-oq-diet-${g!.id}`} label={nameOf(g!)} options={options.map((o) => ({ value: o, label: o }))} value={d.picked}
            onChange={(picked) => setGuest(g!.id, { dietary: dietString({ picked, other: picked.includes(other) ? d.other : "" }, options) })} />
          {d.picked.includes(other) && (
            <FormField id={`x-oq-other-${g!.id}`} label={t.rsvp.dietaryOther}>
              <Input id={`x-oq-other-${g!.id}`} value={d.other} maxLength={OTHER_MAX} autoComplete="off" autoCapitalize="sentences" enterKeyHint="next" data-filled={Boolean(d.other.trim())}
                onChange={(e) => setGuest(g!.id, { dietary: dietString({ picked: d.picked, other: e.target.value }, options) })} />
            </FormField>
          )}
        </>
      }
      case "song": return <>
        {h(t.rsvp.foodTitle, t.rsvp.song)}
        <FormField id="x-oq-song" label={t.rsvp.songs}>
          <Input id="x-oq-song" value={song} maxLength={MAX.song} autoComplete="off" enterKeyHint="next" data-filled={Boolean(song.trim())} onChange={(e) => setSong(e.target.value)} />
        </FormField>
      </>
      case "dates": return <>
        {h(null, t.home.todo.dates)}
        <div className="grid grid-cols-1 gap-x-3 gap-y-(--form-block-gap) min-[400px]:grid-cols-2">
          <FormField id="x-oq-arr" label={t.rsvp.arrival}>
            <Input id="x-oq-arr" type="date" min={TRIP.from} max={TRIP.to} value={arrival} data-filled={Boolean(arrival)} className="min-w-40!"
              aria-invalid={Boolean(dateError) || undefined} aria-describedby="x-oq-date-help" onChange={(e) => setArrival(e.target.value)} />
          </FormField>
          <FormField id="x-oq-dep" label={t.rsvp.departure}>
            <Input id="x-oq-dep" type="date" min={arrival || TRIP.from} max={TRIP.to} value={departure} data-filled={Boolean(departure)} className="min-w-40!"
              aria-invalid={Boolean(dateError) || undefined} aria-describedby="x-oq-date-help" onChange={(e) => setDeparture(e.target.value)} />
          </FormField>
        </div>
        {dateError
          ? <FieldError id="x-oq-date-help">{dateError}</FieldError>
          : <p id="x-oq-date-help" className="text-small text-muted-foreground">{arrival || departure ? fmtStay(arrival, departure, t.rsvp.stayLine) : t.rsvp.datesHint}</p>}
      </>
      case "message": return <>
        {h(null, t.rsvp.noteTitle)}
        <FormField id="x-oq-msg" label={t.rsvp.message}>
          <Textarea id="x-oq-msg" autoComplete="off" autoCapitalize="sentences" maxLength={MAX.message} value={message} data-filled={Boolean(message.trim())} onChange={(e) => setMessage(e.target.value)} />
        </FormField>
      </>
      case "check": {
        const jump = (key: string) => go(screens.findIndex((x) => x.key === key))
        const row = (label: string, value: ReactNode, key: string) => (
          <div key={key + label}><div className="flex min-w-0 flex-col"><dt>{label}</dt><dd>{value}</dd></div>
            <button type="button" className="x-oq-edit" onClick={() => jump(key)} aria-label={t.rsvp.edit(label)}>{t.rsvp.changeSong}</button></div>
        )
        return <>
          {h(null, t.rsvp.checkTitle)}
          <dl className="x-oq-review">
            {guests.filter((g) => !g.plusOne || g.attending === "yes").map((g) => row(nameOf(g),
              g.attending === "yes" ? `${t.rsvp.coming}${g.dietary && g.dietary !== "None" ? `, ${g.dietary}` : ""}` : g.attending === "no" ? t.rsvp.notComing : t.rsvp.notSet,
              g.attending === "yes" && !g.plusOne ? `diet-${g.id}` : `${g.plusOne ? "plus" : "who"}-${g.id}`))}
            {coming.length > 0 && row(t.rsvp.songs, song.trim() || t.rsvp.noSongs, "song")}
            {coming.length > 0 && row(t.rsvp.dates, arrival || departure ? fmtStay(arrival, departure, t.rsvp.stayLine) : t.rsvp.notSet, "dates")}
            {row(t.rsvp.messageLabel, message.trim() || t.rsvp.noMessage, "message")}
          </dl>
          <label htmlFor="x-oq-photos" className="check-row">
            <Checkbox id="x-oq-photos" className="mt-0.5" checked={photos} onCheckedChange={(v) => setPhotos(v === true)} />
            {t.rsvp.photos}
          </label>
          <p className="text-small text-muted-foreground">{t.rsvp.privacy}</p>
        </>
      }
    }
  }

  return (
    <div className="x-oq" onKeyDown={(e) => {
      // Enter moves on from any field (Ctrl or Cmd + Enter in the message); buttons and chips keep theirs
      const el = e.target as HTMLElement
      if (e.key !== "Enter" || e.shiftKey || e.defaultPrevented) return
      if (el instanceof HTMLButtonElement || el.getAttribute("role") === "checkbox") return
      if (el instanceof HTMLTextAreaElement && !(e.metaKey || e.ctrlKey)) return
      e.preventDefault(); next()
    }}>
      <style>{css}</style>
      <header className="x-oq-top">
        <div className="x-oq-line" aria-hidden><span ref={bar} /></div>
        <button type="button" className="x-oq-back" onClick={() => go(at - 1)} aria-hidden={at === 0 || undefined} tabIndex={at === 0 ? -1 : undefined}>
          <ArrowLeft className="size-5" aria-hidden />{t.rsvp.back}
        </button>
        <p className="x-oq-count" aria-live="polite">{t.story.slide(at + 1, total)}</p>
      </header>
      <form className="x-oq-stage" onSubmit={(e) => { e.preventDefault(); next() }} aria-label={t.nav.rsvp}>
        {screens.map((s, i) => (
          <div key={s.key} ref={(el) => { panels.current[i] = el }} className="x-oq-panel" inert={i !== at || undefined}>
            <div className="x-oq-inner">{body(s, i)}</div>
          </div>
        ))}
      </form>
      <footer className="x-oq-foot">
        <div>
          <Button size="md" className="min-w-40" onClick={next}>{screen.kind === "check" ? t.rsvp.send : t.rsvp.next}</Button>
        </div>
      </footer>
    </div>
  )
}
