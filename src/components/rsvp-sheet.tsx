import { DATES } from "@/lib/wedding-dates"
import { nextFrame } from "@/lib/frame"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/field"
import { RadioGroup } from "@/components/ui/radio-group"
import { dietString, OTHER_MAX, parseDiet } from "@/lib/diet"
import { Hanko } from "@/components/hanko"
import { SongPicker } from "@/components/song-picker"
import { ReviewRow, StepProgress } from "@/components/blocks"
import { FieldError } from "@/components/ui/field"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import { AddToCalendar } from "@/components/add-to-calendar"
import { FortuneCard } from "@/components/fortune-card"
import { JourneyEnd } from "@/components/journey-end"
import { useSceneDim } from "@/components/letter/letter"
import { answerOf, ApiError, warmUp, clearDraft, readDraft, saveRsvpWithRetry, trackStarted, writeDraft, type Guest, type Household, type RsvpPayload, type SaveResult } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { cn } from "@/lib/utils"

// Same limits as the back end, so nothing gets cut off silently.
const MAX = { name: 40, song: 200, message: 2000 }
// Trip dates around the wedding, same rule as the back end
const TRIP = { from: DATES.travelFrom, to: DATES.travelTo }

/**
 * "Any dietary needs?" for one person: tap chips, as many as apply, no typing. Other opens a short optional "Tell us
 * more" field right under the chips, saved with the reply ("Other: no kiwi"). An older answer's own words are kept.
 */
function DietField({ g, name, onChange }: { g: Guest; name: string; onChange: (dietary: string) => void }) {
  const { t } = useLang()
  const options = t.rsvp.dietaryOptions
  const other = options[options.length - 1]
  const d = parseDiet(g.dietary, options)
  const otherOn = d.picked.includes(other)
  return (
    <div className="flex flex-col gap-3">
      <CheckboxGroup labelId={`diet-${g.id}`} label={name} options={options.map((o) => ({ value: o, label: o }))} value={d.picked}
        onChange={(picked) => onChange(dietString({ picked, other: picked.includes(other) ? d.other : "" }, options))} />
      {otherOn && (
        <FormField id={`diet-other-${g.id}`} label={t.rsvp.dietaryOther}>
          <Input id={`diet-other-${g.id}`} value={d.other} maxLength={OTHER_MAX} autoComplete="off" autoCapitalize="sentences" enterKeyHint="done" data-filled={Boolean(d.other.trim())}
            onChange={(e) => onChange(dietString({ picked: d.picked, other: e.target.value }, options))} />
        </FormField>
      )}
    </div>
  )
}

/** A plus one still called "Guest" in the sheet shows as a blank name box. */
const blankPlusOne = (g: Guest) => (g.plusOne && /^(guest|plus one|\+1)$/i.test(g.firstName.trim()) ? { ...g, firstName: "" } : g)

/** A draft from an earlier, unsent try wins over the saved answers if it's newer (every way the form opens). */
function startingForm(h: Household | null): RsvpPayload {
  if (!h) return formFrom(h)
  const draft = readDraft(h.token)
  const savedAt = h.respondedAt ? Date.parse(h.respondedAt) : 0
  return draft && draft.at > savedAt ? draft.form : formFrom(h)
}

const formFrom = (h: Household | null): RsvpPayload => ({
  guests: (h?.guests ?? []).map(blankPlusOne),
  songs: h?.songs ?? [],
  arrival: h?.arrival ?? "",
  departure: h?.departure ?? "",
  message: h?.message ?? "",
  photos: h?.photos ?? true, // happy to be in shared photos unless they say otherwise (v3 S)
})

/**
 * The RSVP is the letter itself: it opens over a dimmed scene in the same place as the page letter.
 * One household, three short steps (direction-aware slide), then the success letter.
 * Next never greys out: pressing it with something missing says what, under the field, and moves there.
 */
export function RsvpSheet({ children, openOnLoad = false, request }: { children: ReactNode; openOnLoad?: boolean; request?: { at: number; step: number } }) {
  const { t } = useLang()
  const { household, setHousehold } = useHousehold()
  const { setDim } = useSceneDim()
  const [open, setOpen] = useState(openOnLoad)
  // v3 Q9: while the sheet is open the letter steps aside and the sheet sits over the scene, dimmed to 40%
  useEffect(() => {
    document.documentElement.toggleAttribute("data-sheet", open)
    return () => document.documentElement.removeAttribute("data-sheet")
  }, [open])
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState<"fwd" | "back">("fwd")
  const [error, setError] = useState("")
  const [missing, setMissing] = useState<Record<string, string>>({})
  const [done, setDone] = useState<SaveResult | null>(null)
  const [confirm, setConfirm] = useState<"saving" | "saved" | "offline" | null>(null)
  const [offline, setOffline] = useState(false)
  const replyId = useRef("")
  const heading = useRef<HTMLHeadingElement>(null)
  const body = useRef<HTMLDivElement>(null)
  // Each new step moves focus to its heading, so screen readers hear where they are
  const firstStep = useRef(true)
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return }
    heading.current?.focus({ preventScroll: true })
    body.current?.scrollTo({ top: 0 })
  }, [step])
  useEffect(() => { setDim(open) }, [open, setDim])
  // The RSVP button in the top bar (/?rsvp=1) opens it even when the form has already loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (openOnLoad && !open && household) onOpenChange(true) }, [openOnLoad])
  // "Your reply" lines on Home open the sheet straight at their step
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (request && household) { onOpenChange(true); setStep(request.step) } }, [request?.at])
  const sending = useRef(false)
  const [form, setForm] = useState<RsvpPayload>(() => startingForm(household))
  // Opened by an early tap (before this form loaded): count it as a started RSVP too.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (openOnLoad && household) trackStarted(household.token) }, [])
  // Keep the draft on this device from the first answer on
  useEffect(() => {
    if (open && household && !done) writeDraft(household.token, form)
  }, [form, open, household, done])

  // Offline: wait, then send by itself when the connection is back
  useEffect(() => {
    if (!offline) return
    const back = () => { setOffline(false); setDone(null); void send() }
    window.addEventListener("online", back)
    return () => window.removeEventListener("online", back)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline])

  if (!household) return null
  const locked = isLocked()

  const nameOf = (g: Guest) => g.firstName || t.rsvp.plusOneName
  const setGuest = (id: string, patch: Partial<Guest>) => {
    setForm((f) => ({ ...f, guests: f.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
    setMissing((m) => { const n = { ...m }; delete n[`answer-${id}`]; delete n[`diet-other-${id}`]; return n })
  }
  const coming = form.guests.filter((g) => g.attending === "yes")
  const total = 3
  const songsFilled = form.songs.map((x) => x.trim()).filter(Boolean)
  const outside = (d: string) => Boolean(d) && (d < TRIP.from || d > TRIP.to)
  const dateError = outside(form.arrival) || outside(form.departure)
    ? t.rsvp.dateRange
    : form.arrival && form.departure && form.departure < form.arrival ? t.rsvp.dateOrder : ""

  /** What's missing on this step, keyed by the id of the field to move to. */
  function check(): Record<string, string> {
    const m: Record<string, string> = {}
    if (step === 1) for (const g of form.guests) if (!g.plusOne && !g.attending) m[`answer-${g.id}`] = t.rsvp.answerMissing(nameOf(g))
    if (step === 2) {
      if (dateError) m.arr = dateError
    }
    return m
  }
  function next() {
    const m = check()
    setMissing(m)
    const first = Object.keys(m)[0]
    if (first) {
      // Its first radio (a radio group) or the field itself
      nextFrame(() => { const el = document.getElementById(first); (el?.querySelector<HTMLElement>("input") ?? el)?.focus() })
      return
    }
    setDir("fwd")
    setStep(step + 1)
  }
  const goTo = (n: number) => { setDir(n > step ? "fwd" : "back"); setStep(n) }

  function onOpenChange(o: boolean) {
    if (o) {
      setForm(startingForm(household))
      replyId.current = ""
      setError("")
      setMissing({})
      setDone(null)
      trackStarted(household!.token)
      warmUp()
    }
    setOpen(o)
    if (!o) setStep(1)
  }

  // Saving feels instant: the stamp shows straight away and the save confirms quietly behind it
  // (retries included). Only if every retry fails does the form come back, draft intact, with an error.
  async function send() {
    if (sending.current) return // no double submits, even on a fast double tap
    setError("")
    const before = household!
    // An unticked "Bringing someone?" is a no
    if (form.guests.some((g) => g.plusOne && !g.attending)) form.guests = form.guests.map((g) => (g.plusOne && !g.attending ? { ...g, attending: "no" } : g))
    replyId.current ||= crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const optimistic = applyLocal(before, form)
    setDone({ household: optimistic, updated: Boolean(before.respondedAt), changes: [] })
    setHousehold(optimistic)
    if (typeof navigator !== "undefined" && navigator.onLine === false) { setConfirm("offline"); setOffline(true); return }
    sending.current = true
    setConfirm("saving")
    try {
      const result = await saveRsvpWithRetry(before.token, form, before, replyId.current)
      clearDraft(before.token)
      setHousehold(result.household)
      setDone((d) => (d ? { ...result } : d))
      setConfirm("saved")
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "other"
      if (code === "network" && navigator.onLine === false) { setConfirm("offline"); setOffline(true); return }
      setHousehold(before)
      setDone(null)
      setStep(total)
      setConfirm(null)
      setError(code in t.rsvp.errors ? t.rsvp.errors[code as keyof typeof t.rsvp.errors] : t.rsvp.errors.other)
    } finally {
      sending.current = false
    }
  }

  const actions = <>
    {step > 1 && <Button variant="secondary" size="md" onClick={() => goTo(step - 1)}>{t.rsvp.back}</Button>}
    {step < total
      ? <Button size="md" className="flex-1 shrink!" onClick={next}>{t.rsvp.next}</Button>
      : <Button size="md" className="flex-1 shrink!" onClick={send}>{error ? t.rsvp.tryAgain : t.rsvp.send}</Button>}
  </>

  const datesBlock = (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-x-3 gap-y-(--form-block-gap) min-[400px]:grid-cols-2">
        <FormField id="arr" label={t.rsvp.arrival}>
          <Input id="arr" type="date" min={TRIP.from} max={TRIP.to} value={form.arrival} data-filled={Boolean(form.arrival)} className="min-w-40!"
            aria-invalid={Boolean(dateError) || undefined} aria-describedby={dateError ? "date-error" : "date-hint"} onChange={(e) => setForm({ ...form, arrival: e.target.value })} />
        </FormField>
        <FormField id="dep" label={t.rsvp.departure}>
          <Input id="dep" type="date" min={form.arrival || TRIP.from} max={TRIP.to} value={form.departure} data-filled={Boolean(form.departure)} className="min-w-40!"
            aria-invalid={Boolean(dateError) || undefined} aria-describedby={dateError ? "date-error" : "date-hint"} onChange={(e) => setForm({ ...form, departure: e.target.value })} />
        </FormField>
      </div>
      {dateError
        ? <FieldError id="date-error" className="mt-(--field-helper-gap)">{dateError}</FieldError>
        : <p id="date-hint" className="form-help mt-(--field-helper-gap) text-small text-muted-foreground">{form.arrival || form.departure ? fmtStay(form.arrival, form.departure, t.rsvp.stayLine) : t.rsvp.datesHint}</p>}
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild disabled={locked}>{children}</SheetTrigger>
        <SheetContent aria-describedby={undefined}
          // Enter in a text or date field moves on (Next, or Send on the last step); the song search, the radios and the message keep theirs
          onKeyDown={(e) => {
            const el = e.target as HTMLElement
            if (done || e.key !== "Enter" || e.shiftKey || e.defaultPrevented || !(el instanceof HTMLInputElement) || el.type === "checkbox" || el.type === "radio" || el.type === "search" || el.getAttribute("role") === "combobox") return
            e.preventDefault(); if (step < total) next(); else send()
          }}
          onOpenAutoFocus={(e) => { e.preventDefault(); heading.current?.focus({ preventScroll: true }) }}
          // Only X, Esc or "Back to your invite" close the sheet; a tap outside never does (v3 A)
          onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}
          // Escape inside an open combobox closes its list, not the sheet
          onEscapeKeyDown={(e) => { const el = e.target as HTMLElement | null; if (el?.getAttribute("role") === "combobox" && el.getAttribute("aria-expanded") === "true") e.preventDefault() }}>
          {done ? <SheetBody className="rsvp-done"><Done result={done} confirm={confirm} titleRef={heading} onClose={() => onOpenChange(false)} onChange={() => { setForm(formFrom(done.household)); setDone(null); setConfirm(null); setDir("back"); setStep(1) }} /></SheetBody> : <>
          <SheetHead>
            <p className="label-caps text-muted-foreground">{t.rsvp.step(step, total)}</p>
            <SheetTitle ref={heading} tabIndex={-1} className="heading outline-none">
              {step === 1 ? t.rsvp.whoTitle : step === 2 ? (coming.length ? t.rsvp.foodTitle : t.rsvp.noteTitle) : t.rsvp.checkTitle}
            </SheetTitle>
            <StepProgress step={step} of={total} label={t.rsvp.step(step, total)} />
          </SheetHead>

          <SheetBody ref={body}>
          <div key={step} className={cn("rsvp-step flex flex-col gap-(--form-group-gap)", dir === "fwd" ? "step-fwd" : "step-back")}>
            {step === 1 && (
              <div className="flex flex-col">
                {form.guests.filter((g) => !g.plusOne).map((g) => (
                  <div key={g.id} className="flex flex-col">
                    <RadioGroup id={`answer-${g.id}`} name={`answer-${g.id}`} label={g.firstName} value={g.attending ?? ""} invalid={Boolean(missing[`answer-${g.id}`])}
                      describedBy={missing[`answer-${g.id}`] ? `answer-${g.id}-err` : undefined}
                      onChange={(v) => setGuest(g.id, { attending: v as Guest["attending"] })}
                      options={[{ value: "yes", label: t.rsvp.coming }, { value: "no", label: t.rsvp.notComing }]} />
                    <FieldError id={`answer-${g.id}-err`} className="pb-2">{missing[`answer-${g.id}`]}</FieldError>
                  </div>
                ))}
                {/* A +1 only exists if Griffin and Nadia put one on this household (v3 A) */}
                {form.guests.filter((g) => g.plusOne).map((g) => (
                  <div key={g.id} className="flex flex-col gap-2 pt-4">
                    <label htmlFor={`bring-${g.id}`} className="check-row">
                      <Checkbox id={`bring-${g.id}`} className="mt-0.5" checked={g.attending === "yes"}
                        onCheckedChange={(v) => setGuest(g.id, { attending: v === true ? "yes" : "no" })} />
                      <span className="font-medium text-foreground">{t.rsvp.bringing}</span>
                    </label>
                    {g.attending === "yes" && (
                      <FormField id={`name-${g.id}`} label={t.rsvp.plusOne} help={t.rsvp.plusOneHint}>
                        <Input id={`name-${g.id}`} value={g.firstName} maxLength={MAX.name} autoComplete="off" autoCapitalize="words" enterKeyHint="next" data-filled={Boolean(g.firstName.trim())}
                          aria-describedby={`name-${g.id}-help`} onChange={(e) => setGuest(g.id, { firstName: e.target.value })} />
                      </FormField>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <>
                {coming.length > 0 && (
                  <section aria-labelledby="diet-q" className="flex flex-col gap-4">
                    <h3 id="diet-q" className="font-medium text-foreground">{t.rsvp.dietary}</h3>
                    {coming.map((g) => (
                      <DietField key={g.id} g={g} name={nameOf(g)} onChange={(dietary) => setGuest(g.id, { dietary })} />
                    ))}
                  </section>
                )}
                {coming.length > 0 && <>
                <SongPicker songs={form.songs} onChange={(songs) => setForm((f) => ({ ...f, songs }))} token={household.token} maxLength={MAX.song} />
                {datesBlock}
                </>}
                <FormField id="msg" label={t.rsvp.message}><Textarea id="msg" autoComplete="off" autoCapitalize="sentences" maxLength={MAX.message} value={form.message} data-filled={Boolean(form.message.trim())} onChange={(e) => setForm({ ...form, message: e.target.value })} /></FormField>
              </>
            )}

            {step === total && (
              <>
                <dl className="divide-y divide-border rounded-md border bg-card">
                  {form.guests.map((g) => (
                    <ReviewRow key={g.id} label={nameOf(g)} edit={() => goTo(1)} editLabel={t.rsvp.edit(nameOf(g))}>
                      {g.attending === "yes" ? `${t.rsvp.coming}${g.dietary && g.dietary !== "None" ? `, ${g.dietary}` : ""}` : t.rsvp.notComing}
                    </ReviewRow>
                  ))}
                  {coming.length > 0 && (
                    <ReviewRow label={t.rsvp.songs} edit={() => goTo(2)} editLabel={t.rsvp.edit(t.rsvp.songs)}>{songsFilled.join(", ") || t.rsvp.noSongs}</ReviewRow>
                  )}
                  {coming.length > 0 && (
                    <ReviewRow label={t.rsvp.dates} edit={() => goTo(2)} editLabel={t.rsvp.edit(t.rsvp.dates)}>{form.arrival || form.departure ? fmtStay(form.arrival, form.departure, t.rsvp.stayLine) : t.rsvp.notSet}</ReviewRow>
                  )}
                  <ReviewRow label={t.rsvp.messageLabel} edit={() => goTo(2)} editLabel={t.rsvp.edit(t.rsvp.messageLabel)} block>{form.message.trim() || t.rsvp.noMessage}</ReviewRow>
                </dl>
                <label htmlFor="photos" className="check-row">
                  <Checkbox id="photos" className="mt-0.5" checked={form.photos === true}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, photos: v === true }))} />
                  {t.rsvp.photos}
                </label>
              </>
            )}
            {/* A paused back end is a calm note on paper, not an error: nothing the guest did, nothing lost */}
            {error && (error === t.rsvp.errors.paused
              ? <p role="status" className="rounded-md bg-section-alt px-4 py-3 text-foreground">{error}</p>
              : <p role="alert" className="rounded-md border-2 border-destructive bg-card px-4 py-3 text-destructive">{error}</p>)}
            {offline && <p role="status" className="rounded-md border bg-card px-4 py-3">{t.rsvp.offline}</p>}
            {step === total && <p className="text-small text-muted-foreground">{t.rsvp.privacy}</p>}
            {/* Keyboard up on a phone: the footer steps aside, and the same Back / Next wait here at the end of the form */}
            <div className="rsvp-actions-inline">{actions}</div>
          </div>
          </SheetBody>

          <footer className="rsvp-actions">{actions}</footer>
          </>}
        </SheetContent>
    </Sheet>
  )
}

/**
 * Success, on the same letter: the hanko stamps, the words match the answer, one line on the save, then the
 * fortune card once the stamp has landed (one thing moves at a time), then the optional flying-from card, add to
 * calendar, and a way to change it.
 */
function Done({ result, confirm, titleRef, onClose, onChange }: { result: SaveResult; confirm: "saving" | "saved" | "offline" | null; titleRef: React.RefObject<HTMLHeadingElement | null>; onClose: () => void; onChange: () => void }) {
  const { t } = useLang()
  const h = result.household
  const answer = answerOf(h)
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [answer, titleRef])
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-6 pr-10">
        {answer !== "none" && <Hanko stamp />}
        <SheetTitle ref={titleRef} tabIndex={-1} className="heading outline-none">{t.rsvp.doneTitle[answer]}</SheetTitle>
      </header>
      <p role="status">{confirm === "offline" ? t.rsvp.savedOffline : confirm === "saving" ? t.rsvp.savingQuiet : `${result.updated ? t.rsvp.updatedLine : t.rsvp.sentLine} ${h.hasEmail === false ? "" : t.rsvp.doneBodyEmail}`.trim()}</p>
      {answer !== "none" && <div className="sent-next"><FortuneCard token={h.token} /></div>}
      {answer !== "none" && <div className="sent-next"><JourneyEnd token={h.token} /></div>}
      {answer !== "none" && <AddToCalendar />}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-6">
        <Button size="md" className="w-full sm:w-auto" onClick={onClose}>{t.rsvp.backHome}</Button>
        <button type="button" className="btn-text min-h-11" onClick={onChange}>{t.rsvp.changeReply}</button>
      </div>
    </div>
  )
}

/** The household as it will be once this reply is saved (shown straight away, then confirmed). */
function applyLocal(h: Household, form: RsvpPayload): Household {
  const byId = new Map(form.guests.map((g) => [g.id, g]))
  return {
    ...h,
    guests: h.guests.map((g) => {
      const x = byId.get(g.id)
      if (!x) return g
      return { ...g, attending: x.attending, dietary: x.attending === "yes" ? x.dietary || "None" : "None", firstName: g.plusOne ? x.firstName.trim() || "Guest" : g.firstName }
    }),
    songs: form.songs.map((s) => s.trim()).filter(Boolean),
    arrival: form.arrival, departure: form.departure, message: form.message.trim(), photos: form.photos === true,
    respondedAt: new Date().toISOString(),
  }
}
