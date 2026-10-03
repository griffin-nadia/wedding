import { DATES } from "@/lib/wedding-dates"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Dialog } from "radix-ui"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/form-field"
import { Combobox } from "@/components/combobox"
import { Segmented } from "@/components/segmented"
import { HoldButton } from "@/components/hold-button"
import { useOption } from "@/lib/options"
import { Hanko } from "@/components/hanko"
import { SongPicker } from "@/components/song-picker"
import { FieldError, ReviewRow, StepProgress } from "@/components/blocks"
import { AddToCalendar } from "@/components/add-to-calendar"
import { FortuneCard } from "@/components/fortune-card"
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
 * Dietary is saved as words: "Vegetarian, Nut allergy, Other: kiwi". Older answers ("Allergy: Peanuts / Sesame")
 * map onto the new options, anything unknown becomes Other.
 */
const OTHER = "Other"
type Diet = { picked: string[]; other: string }
export function parseDiet(v: string, options: readonly string[]): Diet {
  const picked: string[] = [], other: string[] = []
  const add = (x: string) => { if (!picked.includes(x)) picked.push(x) }
  for (const part of (v || "").split(",").map((x) => x.trim()).filter((x) => x && x !== "None")) {
    const known = options.find((o) => o.toLowerCase() === part.toLowerCase())
    if (known) add(known)
    else if (/^other:/i.test(part)) { add(OTHER); other.push(part.slice(part.indexOf(":") + 1).trim()) }
    else if (/^allergy/i.test(part)) {
      for (const item of part.slice(part.indexOf(":") + 1).split("/").map((x) => x.trim()).filter(Boolean)) {
        if (/nut|peanut/i.test(item)) add("Nut allergy")
        else if (/shellfish/i.test(item)) add("Shellfish allergy")
        else if (/egg/i.test(item)) add("Egg allergy")
        else { add(OTHER); other.push(item) }
      }
    } else { add(OTHER); other.push(part) }
  }
  return { picked, other: other.filter(Boolean).join(" ") }
}
export function dietString(d: Diet) {
  const out = d.picked.map((x) => (x === OTHER ? `${OTHER}: ${d.other.replace(/[,]/g, " ").replace(/\s+/g, " ").trim()}`.trim() : x))
  return out.length ? out.join(", ") : "None"
}

/** "Any dietary needs?" for one person: the shared combobox, many picks as tags, Other asks for a word. */
function DietField({ g, name, error, onChange }: { g: Guest; name: string; error?: string; onChange: (dietary: string) => void }) {
  const { t } = useLang()
  const options = t.rsvp.dietaryOptions
  const d = parseDiet(g.dietary, options)
  const [q, setQ] = useState("")
  // Picked items stay in the list with a tick, so nothing moves under the finger (v3 A)
  const shown = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()))
  const set = (next: Diet) => onChange(dietString(next))
  return (
    <div className="flex flex-col gap-(--form-block-gap)">
      <Combobox id={`diet-${g.id}`} label={name} placeholder={t.rsvp.dietaryPlaceholder} openOnFocus multi
        tags={d.picked.map((x) => ({ key: x, label: x }))} onRemoveTag={(o) => set({ ...d, picked: d.picked.filter((x) => x !== o.key), other: o.key === OTHER ? "" : d.other })}
        query={q} onQuery={setQ} options={shown.map((x) => ({ key: x, label: x, selected: d.picked.includes(x) }))}
        onPick={(o) => { set(d.picked.includes(o.key) ? { ...d, picked: d.picked.filter((x) => x !== o.key), other: o.key === OTHER ? "" : d.other } : { ...d, picked: [...d.picked, o.key] }); setQ("") }}
        status={shown.length ? "results" : "empty"} emptyText={t.rsvp.dietaryEmpty} removeLabel={t.rsvp.removeSong} />
      {d.picked.includes(OTHER) && (
        <FormField id={`diet-other-${g.id}`} label={t.rsvp.dietaryOther(name)} error={error}>
          <Input id={`diet-other-${g.id}`} value={d.other} maxLength={60} data-filled={Boolean(d.other.trim())} aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `diet-other-${g.id}-err` : undefined} onChange={(e) => set({ ...d, other: e.target.value })} />
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
  const holdToSend = useOption("send") === "hold"
  // Drag the sheet down to close (v3 T option, phones): the grab bar follows the finger, a short drag springs back
  const dragClose = useOption("sheetdrag") === "drag"
  const sheet = useRef<HTMLDivElement>(null)
  const grab = useRef<{ y: number; t: number } | null>(null)
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
    heading.current?.focus()
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
      for (const g of coming) {
        const d = parseDiet(g.dietary, t.rsvp.dietaryOptions)
        if (d.picked.includes(OTHER) && !d.other.trim()) m[`diet-other-${g.id}`] = t.rsvp.dietaryOtherMissing
      }
      if (dateError) m.arr = dateError
    }
    return m
  }
  function next() {
    const m = check()
    setMissing(m)
    const first = Object.keys(m)[0]
    if (first) {
      requestAnimationFrame(() => document.getElementById(first)?.focus())
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
      setStep(3)
      setConfirm(null)
      setError(code in t.rsvp.errors ? t.rsvp.errors[code as keyof typeof t.rsvp.errors] : t.rsvp.errors.other)
    } finally {
      sending.current = false
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild disabled={locked}>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="rsvp-overlay" />
        <Dialog.Content ref={sheet} className="letter paper rsvp-letter" aria-describedby={undefined}
          onOpenAutoFocus={(e) => { e.preventDefault(); heading.current?.focus() }}
          // Only X, Esc or "Back to your invite" close the sheet; a tap outside never does (v3 A)
          onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}
          // Escape inside an open combobox closes its list, not the sheet
          onEscapeKeyDown={(e) => { const el = e.target as HTMLElement | null; if (el?.getAttribute("role") === "combobox" && el.getAttribute("aria-expanded") === "true") e.preventDefault() }}>
          {dragClose && (
            <div aria-hidden className="sheet-grab"
              onPointerDown={(e) => { grab.current = { y: e.clientY, t: performance.now() }; e.currentTarget.setPointerCapture(e.pointerId); if (sheet.current) sheet.current.style.transition = "none" }}
              onPointerMove={(e) => { const g = grab.current; if (g && sheet.current) sheet.current.style.transform = `translateY(${Math.max(0, e.clientY - g.y)}px)` }}
              onPointerUp={(e) => {
                const g = grab.current; grab.current = null; const el = sheet.current; if (!g || !el) return
                const dy = e.clientY - g.y, v = dy / Math.max(1, performance.now() - g.t)
                el.style.transition = "transform var(--duration-slide) var(--ease-spring)"
                if (dy > 120 || v > 0.6) onOpenChange(false); else el.style.transform = ""
              }}>
              <span />
            </div>
          )}
          <Dialog.Close className="rsvp-close press" aria-label={t.rsvp.close}><X className="size-5" aria-hidden /></Dialog.Close>
          {done ? <div className="rsvp-body rsvp-done"><Done result={done} confirm={confirm} titleRef={heading} onClose={() => onOpenChange(false)} onChange={() => { setForm(formFrom(done.household)); setDone(null); setConfirm(null); setDir("back"); setStep(1) }} /></div> : <>
          <header className="rsvp-head flex flex-col gap-3">
            <p className="label-caps text-muted-foreground">{t.rsvp.step(step)}</p>
            <Dialog.Title ref={heading} tabIndex={-1} className="heading outline-none">
              {step === 1 ? t.rsvp.whoTitle : step === 2 ? (coming.length ? t.rsvp.foodTitle : t.rsvp.noteTitle) : t.rsvp.checkTitle}
            </Dialog.Title>
            <StepProgress step={step} of={3} label={t.rsvp.step(step)} />
          </header>

          <div ref={body} className="rsvp-body">
          <div key={step} className={cn("rsvp-step flex flex-col gap-(--form-group-gap)", dir === "fwd" ? "step-fwd" : "step-back")}>
            {step === 1 && (
              <div className="flex flex-col">
                {form.guests.filter((g) => !g.plusOne).map((g) => (
                  <div key={g.id} className="flex flex-col">
                    <div className="choice-row">
                      <span className="font-medium text-foreground">{g.firstName}</span>
                      <Segmented id={`answer-${g.id}`} label={g.firstName} value={g.attending ?? ""} invalid={Boolean(missing[`answer-${g.id}`])}
                        describedBy={missing[`answer-${g.id}`] ? `answer-${g.id}-err` : undefined}
                        onChange={(v) => setGuest(g.id, { attending: v as Guest["attending"] })}
                        items={[{ value: "yes", label: t.rsvp.coming }, { value: "no", label: t.rsvp.notComing }]} />
                    </div>
                    <FieldError id={`answer-${g.id}-err`} className="pb-2">{missing[`answer-${g.id}`]}</FieldError>
                  </div>
                ))}
                {/* A +1 only exists if Nadia and Griffin put one on this household (v3 A) */}
                {form.guests.filter((g) => g.plusOne).map((g) => (
                  <div key={g.id} className="flex flex-col gap-2 pt-4">
                    <label htmlFor={`bring-${g.id}`} className="check-row">
                      <Checkbox id={`bring-${g.id}`} className="mt-0.5" checked={g.attending === "yes"}
                        onCheckedChange={(v) => setGuest(g.id, { attending: v === true ? "yes" : "no" })} />
                      <span className="font-medium text-foreground">{t.rsvp.bringing}</span>
                    </label>
                    {g.attending === "yes" && (
                      <FormField id={`name-${g.id}`} label={t.rsvp.plusOne} help={t.rsvp.plusOneHint}>
                        <Input id={`name-${g.id}`} value={g.firstName} maxLength={MAX.name} autoComplete="off" data-filled={Boolean(g.firstName.trim())}
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
                      <DietField key={g.id} g={g} name={nameOf(g)} error={missing[`diet-other-${g.id}`]} onChange={(dietary) => setGuest(g.id, { dietary })} />
                    ))}
                  </section>
                )}
                {coming.length > 0 && <>
                <SongPicker songs={form.songs} onChange={(songs) => setForm((f) => ({ ...f, songs }))} token={household.token} maxLength={MAX.song}
                  t={{ label: t.rsvp.song, hint: t.rsvp.songHint, placeholder: t.rsvp.songPlaceholder, addTyped: t.rsvp.addTyped, justType: t.rsvp.justType, searching: t.rsvp.searching, noMatch: t.rsvp.noMatch, error: t.rsvp.searchError, remove: t.rsvp.removeSong, full: t.rsvp.songsFull, added: t.rsvp.songsAdded, versions: t.rsvp.versions, hideVersions: t.rsvp.hideVersions }} />
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
                    : <p id="date-hint" className="form-help mt-(--field-helper-gap) text-xs text-muted-foreground">{form.arrival || form.departure ? fmtStay(form.arrival, form.departure, t.rsvp.notSet) : t.rsvp.datesHint}</p>}
                </div>
                </>}
                <FormField id="msg" label={t.rsvp.message}><Textarea id="msg" maxLength={MAX.message} value={form.message} data-filled={Boolean(form.message.trim())} onChange={(e) => setForm({ ...form, message: e.target.value })} /></FormField>
              </>
            )}

            {step === 3 && (
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
                    <ReviewRow label={t.rsvp.dates} edit={() => goTo(2)} editLabel={t.rsvp.edit(t.rsvp.dates)}>{form.arrival || form.departure ? fmtStay(form.arrival, form.departure, t.rsvp.notSet) : t.rsvp.notSet}</ReviewRow>
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
            {error && <p role="alert" className="rounded-md border-2 border-destructive bg-card px-4 py-3 text-destructive">{error}</p>}
            {offline && <p role="status" className="rounded-md border bg-card px-4 py-3">{t.rsvp.offline}</p>}
            {step === 3 && <p className="text-sm text-muted-foreground">{t.rsvp.privacy}</p>}
          </div>
          </div>

          <footer className="rsvp-actions">
            {step > 1 && <Button variant="outline" size="lg" onClick={() => goTo(step - 1)}>{t.rsvp.back}</Button>}
            {step < 3
              ? <Button size="lg" className="flex-1 shrink!" onClick={next}>{t.rsvp.next}</Button>
              : holdToSend && !error
                ? <HoldButton className="flex-1" onDone={send} hint={t.rsvp.holdHint}>{t.rsvp.holdSend}</HoldButton>
                : <Button size="lg" className="flex-1 shrink!" onClick={send}>{error ? t.rsvp.tryAgain : t.rsvp.send}</Button>}
          </footer>
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * Success, on the same letter: the hanko stamps (with one furin ting if sound is on), the words match
 * the answer, one line on the save, the fortune, add to calendar, and a way to change it.
 */
function Done({ result, confirm, titleRef, onClose, onChange }: { result: SaveResult; confirm: "saving" | "saved" | "offline" | null; titleRef: React.RefObject<HTMLHeadingElement | null>; onClose: () => void; onChange: () => void }) {
  const { t } = useLang()
  const h = result.household
  const answer = answerOf(h)
  useEffect(() => {
    titleRef.current?.focus()
  }, [answer, titleRef])
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-5 pr-10">
        {answer !== "none" && <Hanko stamp />}
        <Dialog.Title ref={titleRef} tabIndex={-1} className="heading outline-none">{t.rsvp.doneTitle[answer]}</Dialog.Title>
      </header>
      <p role="status">{confirm === "offline" ? t.rsvp.savedOffline : confirm === "saving" ? t.rsvp.savingQuiet : `${result.updated ? t.rsvp.updatedLine : t.rsvp.sentLine} ${h.hasEmail === false ? "" : t.rsvp.doneBodyEmail}`.trim()}</p>
      {answer !== "none" && <FortuneCard token={h.token} />}
      {answer !== "none" && <AddToCalendar />}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-6">
        <Button size="lg" className="w-full sm:w-auto" onClick={onClose}>{t.rsvp.backHome}</Button>
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
