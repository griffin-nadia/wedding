import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { ArrowUp, Check } from "lucide-react"
import { Hanko } from "@/components/hanko"
import { answerOf, type Guest } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { dietString, OTHER_MAX, parseDiet } from "@/lib/diet"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { DATES } from "@/lib/wedding-dates"
import { ms, still } from "../../motion"

/**
 * Experiment: the reply as a quiet conversation with Griffin and Nadia. Their questions (the reply's own words) arrive
 * as bubbles after a short typing indicator; answers are chips that fly up into a sent bubble. Tap any sent answer
 * to change it; the rest stay. It ends on a local sent state with the hanko: nothing ever leaves the page.
 * Reduced motion: no typing pause and no flight, bubbles fade in.
 */
const css = `
.x-chat { position: relative; isolation: isolate; height: 100svh; min-height: 100svh; display: grid; grid-template-rows: auto 1fr auto; background: var(--letter-bg); color: var(--ink); }
.x-chat::before { content: ""; position: absolute; inset: 0; z-index: -1; background-image: var(--paper); background-size: var(--paper-size); opacity: 0.6; pointer-events: none; }
.x-chat-col { width: 100%; max-width: 40rem; margin-inline: auto; padding-inline: 16px; }
.x-chat-head { border-bottom: 1px solid var(--line-hairline); }
.x-chat-head .x-chat-col { display: flex; align-items: center; gap: 12px; padding-block: 12px; }
.x-chat-seal { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; background: var(--action); color: var(--action-ink); font: 20px/1 var(--font-ja); flex-shrink: 0; }
.x-chat-who { font-family: var(--font-display); font-size: 1.25rem; line-height: 1.2; }
.x-chat-log { overflow-y: auto; overscroll-behavior: contain; scroll-padding-bottom: 24px; }
.x-chat-log .x-chat-col { display: flex; flex-direction: column; gap: 6px; padding-block: 24px 16px; }
.x-chat-b { max-width: min(80%, 28rem); padding: 10px 14px; border-radius: 20px; line-height: 1.4; overflow-wrap: anywhere; animation: x-chat-in 360ms var(--ease-paper) both; }
.x-chat-them { align-self: flex-start; background: var(--surface-raised); border: 1px solid var(--line-hairline); border-bottom-left-radius: 6px; box-shadow: 0 1px 0 rgb(var(--tint-shadow) / 0.06); }
.x-chat-them + .x-chat-them { border-top-left-radius: 6px; }
.x-chat-gap { height: 10px; }
.x-chat-me { align-self: flex-end; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; background: var(--action); color: var(--action-ink); border-bottom-right-radius: 6px; text-align: left; font: inherit; animation: none; transform-origin: 100% 100%; }
.x-chat-me:not(:disabled) { cursor: pointer; }
.x-chat-me:not(:disabled):hover { filter: brightness(1.06); }
.x-chat-me:focus-visible, .x-chat-chip:focus-visible, .x-chat-send:focus-visible { outline: 2px solid var(--input-focus); outline-offset: 2px; }
.x-chat-me small { display: block; font-size: var(--type-small-size); opacity: 0.8; }
.x-chat-me[data-editing] { outline: 2px dashed var(--action); outline-offset: 3px; }
.x-chat-typing { align-self: flex-start; display: inline-flex; gap: 4px; padding: 14px 16px; border-radius: 20px 20px 20px 6px; background: var(--surface-raised); border: 1px solid var(--line-hairline); }
.x-chat-typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--ink-muted); animation: x-chat-dot 1s ease-in-out infinite; }
.x-chat-typing i:nth-child(2) { animation-delay: 160ms; } .x-chat-typing i:nth-child(3) { animation-delay: 320ms; }
@keyframes x-chat-dot { 0%, 60%, 100% { transform: none; opacity: 0.45; } 30% { transform: translateY(-3px); opacity: 1; } }
@keyframes x-chat-in { from { opacity: 0; transform: translateY(8px) scale(0.98); } }
.x-chat-done { align-self: flex-start; display: flex; align-items: center; gap: 16px; padding: 16px 18px; }
.x-chat-done .hanko { width: 64px; height: 64px; font-size: 32px; }
.x-chat-foot { border-top: 1px solid var(--line-hairline); background: color-mix(in oklab, var(--letter-bg) 94%, transparent); }
.x-chat-foot .x-chat-col { display: flex; flex-direction: column; gap: 10px; padding-block: 12px calc(14px + env(safe-area-inset-bottom)); min-height: 76px; }
.x-chat-label { font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--ink-muted); }
.x-chat-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.x-chat-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding-inline: 16px; border-radius: 22px; border: 1px solid var(--chip-line, var(--line-strong)); background: var(--surface-raised); color: var(--ink); font: 500 var(--type-ui-small-size) / 1 var(--font-label); transition: transform 160ms var(--ease-paper), background-color 160ms; }
.x-chat-chip:active { transform: scale(0.96); }
.x-chat-chip[aria-pressed="true"] { background: var(--input-selected-bg); border-color: var(--input-selected-line); }
.x-chat-chip-go { background: var(--action); border-color: var(--action); color: var(--action-ink); }
.x-chat-row { display: flex; gap: 8px; align-items: flex-end; }
.x-chat-row > :first-child { flex: 1; min-width: 0; }
.x-chat-send { display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%; background: var(--action); color: var(--action-ink); }
.x-chat-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.x-chat-dates label { display: flex; flex-direction: column; gap: 4px; font-size: var(--type-small-size); color: var(--ink-soft); }
.x-chat-hint { font-size: var(--type-small-size); color: var(--ink-muted); }
.x-chat-hint[data-error] { color: var(--ink-danger); }
.x-chat textarea.field { min-height: 48px; max-height: 30svh; resize: none; }
@media (prefers-reduced-motion: reduce) {
  .x-chat-b { animation: x-chat-fade 240ms linear both; }
  .x-chat-me { animation: x-chat-fade 240ms linear both; }
  @keyframes x-chat-fade { from { opacity: 0; } }
  .x-chat-typing i { animation: none; }
}
`
const MAX = { name: 40, song: 200, message: 2000 }
const TRIP = { from: DATES.travelFrom, to: DATES.travelTo }
type Step = { key: string; ask: string[]; g?: Guest; kind: "who" | "plus" | "diet" | "song" | "dates" | "message" | "check" }

export default function RsvpChat() {
  const { household } = useHousehold()
  const { t } = useLang()
  if (!household) return <div className="x-chat"><style>{css}</style></div>
  return <Chat key={household.token} start={household.guests.map((g) => (g.plusOne && /^(guest|plus one|\+1)$/i.test(g.firstName.trim()) ? { ...g, firstName: "" } : g))} t={t} />
}

function Chat({ start, t }: { start: Guest[]; t: ReturnType<typeof useLang>["t"] }) {
  const [guests, setGuests] = useState(start)
  const [song, setSong] = useState(""), [arrival, setArrival] = useState(""), [departure, setDeparture] = useState(""), [message, setMessage] = useState("")
  const [answered, setAnswered] = useState<Record<string, true>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, true>>({})
  const [typing, setTyping] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentShown, setSentShown] = useState(false)
  const [draft, setDraft] = useState("")

  const named = start.filter((g) => !g.plusOne)
  const coming = guests.filter((g) => g.attending === "yes")
  const nameOf = (g: Guest) => g.firstName || t.rsvp.plusOneName
  const steps: Step[] = [
    ...guests.filter((g) => !g.plusOne).map((g, i) => ({ key: `who-${g.id}`, kind: "who" as const, g, ask: i === 0 ? [t.home.dear(t.home.dearNames(named.map((x) => x.firstName))), t.rsvp.whoTitle] : [] })),
    ...guests.filter((g) => g.plusOne).map((g) => ({ key: `plus-${g.id}`, kind: "plus" as const, g, ask: [t.rsvp.bringing] })),
    ...coming.filter((g) => !g.plusOne || g.firstName.trim()).map((g, i) => ({ key: `diet-${g.id}`, kind: "diet" as const, g, ask: i === 0 ? [t.rsvp.dietary] : [] })),
    ...(coming.length ? [{ key: "song", kind: "song" as const, ask: [t.rsvp.song] }, { key: "dates", kind: "dates" as const, ask: [t.home.todo.dates, t.rsvp.datesHint] }] : []),
    { key: "message", kind: "message", ask: [t.rsvp.noteTitle] },
    { key: "check", kind: "check", ask: [t.rsvp.checkTitle, t.rsvp.privacy] },
  ]
  const firstOpen = steps.findIndex((s) => !answered[s.key])
  const open = firstOpen < 0 ? null : steps[firstOpen]
  const current = editing ? steps.find((s) => s.key === editing) ?? open : open
  const shown = firstOpen < 0 ? steps : steps.slice(0, firstOpen + 1)

  // A new question: they type for a moment, then it arrives (straight away under reduced motion)
  const openKey = open?.key ?? "", openAsks = open?.ask.length ?? 0, isRevealed = Boolean(revealed[openKey])
  useEffect(() => {
    if (!openKey || isRevealed) return
    if (!openAsks || still()) { setRevealed((r) => ({ ...r, [openKey]: true })); return }
    setTyping(true)
    const id = setTimeout(() => { setTyping(false); setRevealed((r) => ({ ...r, [openKey]: true })) }, ms(650 + openAsks * 350))
    return () => clearTimeout(id)
  }, [openKey, openAsks, isRevealed])
  useEffect(() => {
    if (!sent || sentShown) return
    if (still()) { setSentShown(true); return }
    setTyping(true)
    const id = setTimeout(() => { setTyping(false); setSentShown(true) }, ms(1100))
    return () => clearTimeout(id)
  }, [sent, sentShown])

  // The chip flies up into its bubble (FLIP with the Web Animations API, so the lab's speed applies); the log follows
  const log = useRef<HTMLDivElement>(null)
  const fly = useRef<{ key: string; from: DOMRect } | null>(null)
  useLayoutEffect(() => {
    const el = log.current
    if (!el) return
    const f = fly.current
    fly.current = null
    const bubble = f && el.querySelector<HTMLElement>(`[data-answer="${f.key}"]`)
    if (f && bubble) {
      if (!editing) el.scrollTop = el.scrollHeight
      if (still()) return
      const to = bubble.getBoundingClientRect()
      const dx = f.from.left + f.from.width / 2 - (to.left + to.width / 2), dy = f.from.top + f.from.height / 2 - (to.top + to.height / 2)
      bubble.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${Math.min(1.4, f.from.width / to.width)}, ${Math.min(1.4, f.from.height / to.height)})`, opacity: 0.7 },
        { transform: "none", opacity: 1 },
      ], { duration: 520, easing: "cubic-bezier(0.2, 0.9, 0.25, 1.12)" })
      return
    }
    el.scrollTo({ top: el.scrollHeight, behavior: still() ? "auto" : "smooth" })
  })

  // Each new question puts focus in its answer (on touch screens only chips, so the keyboard doesn't jump up)
  const foot = useRef<HTMLDivElement>(null)
  const composing = !sent && !typing && current && (revealed[current.key] || editing) ? current.key : ""
  useEffect(() => {
    if (!composing) return
    const first = foot.current?.querySelector<HTMLElement>("input, textarea, button")
    if (!first || (first.matches("input, textarea") && matchMedia("(pointer: coarse)").matches)) return
    first.focus({ preventScroll: true })
  }, [composing])

  const answer = (key: string, e?: { currentTarget: Element }) => {
    if (e) fly.current = { key, from: e.currentTarget.getBoundingClientRect() }
    setAnswered((a) => ({ ...a, [key]: true })); setEditing(null); setDraft("")
  }
  const setGuest = (id: string, patch: Partial<Guest>) => setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const outside = (d: string) => Boolean(d) && (d < TRIP.from || d > TRIP.to)
  const dateError = outside(arrival) || outside(departure) ? t.rsvp.dateRange : arrival && departure && departure < arrival ? t.rsvp.dateOrder : ""

  const said = (s: Step): { text: ReactNode; label?: string } => {
    const g = s.g
    switch (s.kind) {
      case "who": return { label: g!.firstName, text: g!.attending === "yes" ? t.rsvp.coming : t.rsvp.notComing }
      case "plus": return { label: t.rsvp.bringing, text: g!.attending === "yes" ? g!.firstName : t.rsvp.notComing }
      case "diet": return { label: nameOf(g!), text: g!.dietary || "None" }
      case "song": return { label: t.rsvp.songs, text: song.trim() || t.rsvp.noSongs }
      case "dates": return { label: t.rsvp.dates, text: arrival || departure ? fmtStay(arrival, departure, t.rsvp.stayLine) : t.rsvp.notSet }
      case "message": return { label: t.rsvp.messageLabel, text: message.trim() || t.rsvp.noMessage }
      case "check": return { text: t.rsvp.send }
    }
  }

  const composer = (s: Step): ReactNode => {
    const g = s.g
    const label = (x: string) => <p className="x-chat-label" id={`x-chat-l-${s.key}`}>{x}</p>
    switch (s.kind) {
      case "who": return <>{label(g!.firstName)}
        <div className="x-chat-chips" role="group" aria-labelledby={`x-chat-l-${s.key}`}>
          {([["yes", t.rsvp.coming], ["no", t.rsvp.notComing]] as const).map(([v, l]) => (
            <button key={v} type="button" className="x-chat-chip" onClick={(e) => { setGuest(g!.id, { attending: v }); answer(s.key, e) }}>{l}</button>
          ))}
        </div></>
      case "plus": return <>{label(t.rsvp.plusOne)}
        <form className="x-chat-row" onSubmit={(e) => { e.preventDefault(); const n = draft.trim(); setGuest(g!.id, { firstName: n, attending: n ? "yes" : "no" }); answer(s.key, { currentTarget: e.currentTarget }) }}>
          <input className="state field" aria-labelledby={`x-chat-l-${s.key}`} aria-describedby={`x-chat-h-${s.key}`} value={draft} maxLength={MAX.name} autoComplete="off" autoCapitalize="words" enterKeyHint="send" onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="x-chat-send" aria-label={t.rsvp.next}><ArrowUp className="size-5" aria-hidden /></button>
        </form>
        <p className="x-chat-hint" id={`x-chat-h-${s.key}`}>{t.rsvp.plusOneHint}</p></>
      case "diet": {
        const options = t.rsvp.dietaryOptions, other = options[options.length - 1], d = parseDiet(g!.dietary, options)
        const set = (picked: string[], words = d.other) => setGuest(g!.id, { dietary: dietString({ picked, other: picked.includes(other) ? words : "" }, options) })
        return <>{label(nameOf(g!))}
          <div className="x-chat-chips" role="group" aria-labelledby={`x-chat-l-${s.key}`}>
            {options.map((o) => {
              const on = d.picked.includes(o)
              return <button key={o} type="button" className="x-chat-chip" aria-pressed={on} onClick={() => set(on ? d.picked.filter((x) => x !== o) : [...d.picked, o])}>{on && <Check className="size-4" aria-hidden />}{o}</button>
            })}
          </div>
          {d.picked.includes(other) && <input className="state field" aria-label={t.rsvp.dietaryOther} placeholder={t.rsvp.dietaryOther} value={d.other} maxLength={OTHER_MAX} autoComplete="off" onChange={(e) => set(d.picked, e.target.value)} />}
          <div className="x-chat-chips"><button type="button" className="x-chat-chip x-chat-chip-go" onClick={(e) => answer(s.key, e)}>{t.rsvp.next}</button></div></>
      }
      case "song": return <>
        <form className="x-chat-row" onSubmit={(e) => { e.preventDefault(); answer(s.key, { currentTarget: e.currentTarget }) }}>
          <input className="state field" aria-label={t.rsvp.song} value={song} maxLength={MAX.song} autoComplete="off" enterKeyHint="send" onChange={(e) => setSong(e.target.value)} />
          <button type="submit" className="x-chat-send" aria-label={t.rsvp.next}><ArrowUp className="size-5" aria-hidden /></button>
        </form></>
      case "dates": return <>
        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (!dateError) answer(s.key, { currentTarget: e.currentTarget }) }}>
          <div className="x-chat-row">
            <div className="x-chat-dates">
              <label>{t.rsvp.arrival}<input type="date" className="state field" min={TRIP.from} max={TRIP.to} value={arrival} aria-invalid={Boolean(dateError) || undefined} aria-describedby="x-chat-date-h" onChange={(e) => setArrival(e.target.value)} /></label>
              <label>{t.rsvp.departure}<input type="date" className="state field" min={arrival || TRIP.from} max={TRIP.to} value={departure} aria-invalid={Boolean(dateError) || undefined} aria-describedby="x-chat-date-h" onChange={(e) => setDeparture(e.target.value)} /></label>
            </div>
            <button type="submit" className="x-chat-send" aria-label={t.rsvp.next}><ArrowUp className="size-5" aria-hidden /></button>
          </div>
          <p id="x-chat-date-h" className="x-chat-hint" data-error={dateError ? "" : undefined} role={dateError ? "alert" : undefined}>{dateError || (arrival || departure ? fmtStay(arrival, departure, t.rsvp.stayLine) : t.rsvp.datesHint)}</p>
        </form></>
      case "message": return <>
        <form className="x-chat-row" onSubmit={(e) => { e.preventDefault(); answer(s.key, { currentTarget: e.currentTarget }) }}>
          <textarea className="state field" aria-label={t.rsvp.message} placeholder={t.rsvp.message} value={message} maxLength={MAX.message} autoCapitalize="sentences" rows={1}
            onChange={(e) => { setMessage(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px` }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} />
          <button type="submit" className="x-chat-send" aria-label={t.rsvp.next}><ArrowUp className="size-5" aria-hidden /></button>
        </form></>
      case "check": return <div className="x-chat-chips">
        <button type="button" className="x-chat-chip x-chat-chip-go" onClick={(e) => {
          // Nothing leaves the page: the reply stops here, on this device
          setGuests((gs) => gs.map((g) => (g.plusOne && g.attending !== "yes" ? { ...g, attending: "no" } : g)))
          answer(s.key, e); setSent(true)
        }}>{t.rsvp.send}</button>
      </div>
    }
  }

  const result = answerOf({ guests: guests.map((g) => (g.plusOne && g.attending !== "yes" ? { ...g, attending: "no" as const } : g)) })
  const restart = () => { setAnswered({}); setRevealed({}); setEditing(null); setSent(false); setSentShown(false); setGuests(start); setSong(""); setArrival(""); setDeparture(""); setMessage("") }

  return (
    <div className="x-chat">
      <style>{css}</style>
      <header className="x-chat-head"><div className="x-chat-col">
        <span className="x-chat-seal" aria-hidden>京</span>
        <div><p className="x-chat-who">{t.meta.title}</p><p className="text-small text-muted-foreground">{t.nav.rsvp}</p></div>
      </div></header>

      <div ref={log} className="x-chat-log" role="log" aria-live="polite" aria-label={t.nav.rsvp}>
        <div className="x-chat-col">
          {shown.map((s) => {
            const mine = answered[s.key] ? said(s) : null
            return (
              <div key={s.key} className="contents">
                {revealed[s.key] && s.ask.length > 0 && <><div className="x-chat-gap" aria-hidden />{s.ask.map((q, i) => <p key={i} className="x-chat-b x-chat-them">{q}</p>)}</>}
                {mine && (
                  <button type="button" data-answer={s.key} className="x-chat-b x-chat-me" disabled={sent || s.kind === "check"} data-editing={editing === s.key || undefined}
                    aria-label={s.kind === "check" ? undefined : `${t.rsvp.edit(mine.label ?? "")}: ${typeof mine.text === "string" ? mine.text : ""}`}
                    onClick={() => { setEditing(editing === s.key ? null : s.key); setDraft(s.kind === "plus" ? s.g!.firstName : "") }}>
                    <span>{mine.label && <small>{mine.label}</small>}{mine.text}</span>
                  </button>
                )}
              </div>
            )
          })}
          {sentShown && (
            <div className="x-chat-b x-chat-them x-chat-done" role="status">
              {result !== "none" && <Hanko stamp />}
              <div><p className="x-chat-who">{t.rsvp.doneTitle[result]}</p><p className="text-small text-muted-foreground">{t.rsvp.sentLine}</p></div>
            </div>
          )}
          {typing && <div className="x-chat-typing" aria-hidden><i /><i /><i /></div>}
        </div>
      </div>

      <footer className="x-chat-foot"><div ref={foot} className="x-chat-col">
        {sentShown
          ? <div className="x-chat-chips"><button type="button" className="x-chat-chip" onClick={restart}>{t.rsvp.changeReply}</button></div>
          : current && !typing && (revealed[current.key] || editing) && !sent && composer(current)}
      </div></footer>
    </div>
  )
}
