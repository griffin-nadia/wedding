import { useEffect, useRef, useState, type ReactNode } from "react"
import { Dialog } from "radix-ui"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Hanko } from "@/components/hanko"
import { SongPicker } from "@/components/song-picker"
import { Chip, FieldError, ReviewRow, Seal, StepProgress } from "@/components/blocks"
import { AddToCalendar } from "@/components/add-to-calendar"
import { FortuneCard } from "@/components/fortune-card"
import { useSceneDim } from "@/components/letter/letter"
import { playFurin } from "@/lib/sound"
import { answerOf, ApiError, clearDraft, readDraft, saveRsvpWithRetry, trackStarted, writeDraft, type Guest, type Household, type RsvpPayload, type SaveResult } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { cn } from "@/lib/utils"

// Same limits as the back end, so nothing gets cut off silently.
const MAX = { name: 40, song: 200, message: 2000 }
// Trip dates around the wedding, same rule as the back end
const TRIP = { from: "2027-09-01", to: "2027-11-30" }

/**
 * Dietary is saved as words: "Vegetarian, Gluten free, Allergy: Peanuts / Sesame / kiwi".
 * Inside the allergy part, items are split by " / " (commas already separate the needs).
 */
const ALLERGY = "Allergy" // same word as t.rsvp.allergy
type Diet = { set: string[]; allergens: string[]; other: string }
export function parseDiet(v: string, known: readonly string[]): Diet {
  const parts = (v || "").split(",").map((x) => x.trim()).filter((x) => x && x !== "None")
  const allergyPart = parts.find((x) => x.startsWith(ALLERGY))
  const items = allergyPart?.includes(":") ? allergyPart.slice(allergyPart.indexOf(":") + 1).split("/").map((x) => x.trim()).filter(Boolean) : []
  const isKnown = (x: string) => known.find((k) => k.toLowerCase() === x.toLowerCase())
  return {
    set: parts.map((x) => (x.startsWith(ALLERGY) ? ALLERGY : x)),
    allergens: items.map(isKnown).filter(Boolean) as string[],
    other: items.filter((x) => !isKnown(x)).join(", "),
  }
}
export function dietString(d: Diet) {
  const items = [...d.allergens, ...(d.other.trim() ? [d.other.replace(/[,/]/g, " ").replace(/\s+/g, " ").trim()] : [])]
  const out = d.set.map((x) => (x === ALLERGY ? `${ALLERGY}: ${items.join(" / ")}`.trimEnd() : x))
  return out.length ? out.join(", ") : "None"
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
  photos: h?.photos ?? null,
})

/**
 * The RSVP is the letter itself: it opens over a dimmed scene in the same place as the page letter.
 * One household, three short steps (direction-aware slide), then the success letter.
 * Next never greys out: pressing it with something missing says what, under the field, and moves there.
 */
export function RsvpSheet({ children, openOnLoad = false }: { children: ReactNode; openOnLoad?: boolean }) {
  const { t } = useLang()
  const { household, setHousehold } = useHousehold()
  const { setDim } = useSceneDim()
  const [open, setOpen] = useState(openOnLoad)
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState<"fwd" | "back">("fwd")
  const [error, setError] = useState("")
  const [missing, setMissing] = useState<Record<string, string>>({})
  const [done, setDone] = useState<SaveResult | null>(null)
  const [confirm, setConfirm] = useState<"saving" | "saved" | "offline" | null>(null)
  const [offline, setOffline] = useState(false)
  const replyId = useRef("")
  const arrowKey = useRef(false)
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
  const known = t.rsvp.allergens

  const nameOf = (g: Guest) => g.firstName || t.rsvp.plusOneName
  const setGuest = (id: string, patch: Partial<Guest>) => {
    setForm((f) => ({ ...f, guests: f.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
    setMissing((m) => { const n = { ...m }; delete n[`answer-${id}`]; delete n[`allergy-${id}`]; return n })
  }
  const setDiet = (g: Guest, d: Diet) => setGuest(g.id, { dietary: dietString(d) })
  const coming = form.guests.filter((g) => g.attending === "yes")
  const songsFilled = form.songs.map((x) => x.trim()).filter(Boolean)
  const outside = (d: string) => Boolean(d) && (d < TRIP.from || d > TRIP.to)
  const dateError = outside(form.arrival) || outside(form.departure)
    ? t.rsvp.dateRange
    : form.arrival && form.departure && form.departure < form.arrival ? t.rsvp.dateOrder : ""

  /** What's missing on this step, keyed by the id of the field to move to. */
  function check(): Record<string, string> {
    const m: Record<string, string> = {}
    if (step === 1) for (const g of form.guests) if (!g.attending) m[`answer-${g.id}`] = t.rsvp.answerMissing(nameOf(g))
    if (step === 2) {
      for (const g of coming) {
        const d = parseDiet(g.dietary, known)
        if (d.set.includes(ALLERGY) && !d.allergens.length && !d.other.trim()) m[`allergy-${g.id}`] = t.rsvp.allergyMissing(nameOf(g))
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
        <Dialog.Content className="letter rsvp-letter" aria-describedby={undefined}
          onOpenAutoFocus={(e) => { e.preventDefault(); heading.current?.focus() }}>
          <Dialog.Close className="rsvp-close press" aria-label={t.rsvp.close}><X className="size-5" aria-hidden /></Dialog.Close>
          {done ? <Done result={done} confirm={confirm} titleRef={heading} onClose={() => onOpenChange(false)} onChange={() => { setForm(formFrom(done.household)); setDone(null); setConfirm(null); setDir("back"); setStep(1) }} /> : <>
          <header className="flex flex-col gap-3 pr-12">
            <p className="label-caps text-muted-foreground">{t.rsvp.step(step)}</p>
            <Dialog.Title ref={heading} tabIndex={-1} className="heading outline-none">
              {step === 1 ? t.rsvp.whoTitle : step === 2 ? (coming.length ? t.rsvp.foodTitle : t.rsvp.noteTitle) : t.rsvp.checkTitle}
            </Dialog.Title>
            <StepProgress step={step} of={3} label={t.rsvp.step(step)} />
          </header>

          <div ref={body} key={step} className={cn("rsvp-step flex flex-col gap-6", dir === "fwd" ? "step-fwd" : "step-back")}>
            {step === 1 && form.guests.map((g) => (
              <fieldset key={g.id} className="flex flex-col gap-3">
                <legend className="sr-only">{nameOf(g)}</legend>
                {g.plusOne ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`name-${g.id}`}>{t.rsvp.plusOne}</Label>
                    <Input id={`name-${g.id}`} value={g.firstName} maxLength={MAX.name} autoComplete="off" data-filled={Boolean(g.firstName.trim())}
                      aria-describedby={`name-hint-${g.id}`} onChange={(e) => setGuest(g.id, { firstName: e.target.value })} />
                    <p id={`name-hint-${g.id}`} className="text-sm text-muted-foreground">{t.rsvp.plusOneHint}</p>
                  </div>
                ) : (
                  <p className="font-semibold text-foreground">{g.firstName}</p>
                )}
                <RadioGroup id={`answer-${g.id}`} tabIndex={-1} aria-label={nameOf(g)} value={g.attending ?? ""} aria-invalid={Boolean(missing[`answer-${g.id}`])}
                  aria-describedby={missing[`answer-${g.id}`] ? `answer-${g.id}-err` : undefined}
                  onValueChange={(v) => setGuest(g.id, { attending: v as Guest["attending"] })} className="grid grid-cols-2 gap-3 outline-none"
                  onKeyDown={(e) => { if (e.key.startsWith("Arrow")) arrowKey.current = true }}>
                  {(["yes", "no"] as const).map((v) => (
                    <label key={v} htmlFor={`${g.id}-${v}`} aria-invalid={Boolean(missing[`answer-${g.id}`]) || undefined}
                      className="state choice flex min-h-16 cursor-pointer items-center gap-3 rounded-md px-3 py-2 leading-tight text-foreground">
                      <RadioGroupItem id={`${g.id}-${v}`} value={v} className="sr-only"
                        // Arrow keys always select (Radix can skip the first press after the letter focuses it)
                        onFocus={() => { if (arrowKey.current) { arrowKey.current = false; if (g.attending !== v) setGuest(g.id, { attending: v }) } }} />
                      <Seal on={g.attending === v} />
                      {v === "yes" ? t.rsvp.coming : t.rsvp.notComing}
                    </label>
                  ))}
                </RadioGroup>
                <FieldError id={`answer-${g.id}-err`}>{missing[`answer-${g.id}`]}</FieldError>
              </fieldset>
            ))}

            {step === 2 && (
              <>
                {coming.map((g) => {
                  const d = parseDiet(g.dietary, known)
                  const err = missing[`allergy-${g.id}`]
                  return (
                    <div key={g.id} className="flex flex-col gap-3" role="group" aria-labelledby={`diet-${g.id}`}>
                      <p id={`diet-${g.id}`} className="font-semibold text-foreground">{t.rsvp.dietary} <span className="font-normal text-body">({nameOf(g)})</span></p>
                      <div className="flex flex-wrap gap-2">
                        {t.rsvp.dietaryOptions.map((o) => {
                          const on = d.set.includes(o)
                          return <Chip key={o} on={on} onClick={() => setDiet(g, { ...d, set: on ? d.set.filter((x) => x !== o) : [...d.set, o] })}>{o}</Chip>
                        })}
                      </div>
                      {d.set.includes(ALLERGY) && (
                        <div id={`allergy-${g.id}`} tabIndex={-1} role="group" aria-labelledby={`allergy-label-${g.id}`} aria-describedby={err ? `allergy-${g.id}-err` : undefined}
                          className="allergy-panel flex flex-col gap-3 rounded-md bg-section-alt p-4 outline-none">
                          <p id={`allergy-label-${g.id}`} className="text-foreground">{t.rsvp.allergyLabel(nameOf(g))}</p>
                          <div className="flex flex-wrap gap-2">
                            {known.map((a) => {
                              const on = d.allergens.includes(a)
                              return <Chip key={a} on={on} onClick={() => setDiet(g, { ...d, allergens: on ? d.allergens.filter((x) => x !== a) : [...d.allergens, a] })}>{a}</Chip>
                            })}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`allergy-other-${g.id}`}>{t.rsvp.allergyOther}</Label>
                            <Input id={`allergy-other-${g.id}`} value={d.other} maxLength={60} data-filled={Boolean(d.other.trim())} aria-invalid={Boolean(err) || undefined}
                              onChange={(e) => setDiet(g, { ...d, other: e.target.value })} />
                          </div>
                          <FieldError id={`allergy-${g.id}-err`}>{err}</FieldError>
                        </div>
                      )}
                    </div>
                  )
                })}
                {coming.length > 0 && <>
                <SongPicker songs={form.songs} onChange={(songs) => setForm((f) => ({ ...f, songs }))} token={household.token} maxLength={MAX.song}
                  t={{ label: t.rsvp.song, hint: t.rsvp.songHint, placeholder: t.rsvp.songPlaceholder, addTyped: t.rsvp.addTyped, justType: t.rsvp.justType, searching: t.rsvp.searching, noMatch: t.rsvp.noMatch, error: t.rsvp.searchError, remove: t.rsvp.removeSong, full: t.rsvp.songsFull, added: t.rsvp.songsAdded }} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2"><Label htmlFor="arr">{t.rsvp.arrival}</Label><Input id="arr" type="date" min={TRIP.from} max={TRIP.to} value={form.arrival} data-filled={Boolean(form.arrival)}
                    aria-invalid={Boolean(dateError) || undefined} aria-describedby={dateError ? "date-error" : "date-hint"} onChange={(e) => setForm({ ...form, arrival: e.target.value })} /></div>
                  <div className="flex flex-col gap-2"><Label htmlFor="dep">{t.rsvp.departure}</Label><Input id="dep" type="date" min={form.arrival || TRIP.from} max={TRIP.to} value={form.departure} data-filled={Boolean(form.departure)}
                    aria-invalid={Boolean(dateError) || undefined} aria-describedby={dateError ? "date-error" : "date-hint"} onChange={(e) => setForm({ ...form, departure: e.target.value })} /></div>
                  {dateError
                    ? <FieldError id="date-error" className="col-span-2">{dateError}</FieldError>
                    : <p id="date-hint" className="col-span-2 text-sm text-muted-foreground">{form.arrival || form.departure ? fmtStay(form.arrival, form.departure, t.rsvp.notSet) : t.rsvp.datesHint}</p>}
                </div>
                </>}
                <div className="flex flex-col gap-2"><Label htmlFor="msg">{t.rsvp.message}</Label><Textarea id="msg" maxLength={MAX.message} value={form.message} data-filled={Boolean(form.message.trim())} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
              </>
            )}

            {step === 3 && (
              <>
                <dl className="divide-y divide-border rounded-md border bg-card">
                  {form.guests.map((g) => (
                    <ReviewRow key={g.id} label={nameOf(g)} edit={() => goTo(1)} editLabel={t.rsvp.edit(nameOf(g))}>
                      {g.attending === "yes" ? `${t.rsvp.coming}${g.dietary && g.dietary !== "None" ? ` · ${g.dietary}` : ""}` : t.rsvp.notComing}
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
                <label htmlFor="photos" className="state flex min-h-11 cursor-pointer items-start gap-3 rounded-md p-4">
                  <Checkbox id="photos" className="mt-1 size-5 shrink-0" checked={form.photos === true}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, photos: v === true }))} />
                  {t.rsvp.photos}
                </label>
                <p className="hand">{t.rsvp.editUntil}</p>
              </>
            )}
            {error && <p role="alert" className="rounded-md border-2 border-destructive bg-card px-4 py-3 text-destructive">{error}</p>}
            {offline && <p role="status" className="rounded-md border bg-card px-4 py-3">{t.rsvp.offline}</p>}
          </div>

          <footer className="rsvp-actions">
            {step > 1 && <Button variant="outline" size="lg" onClick={() => goTo(step - 1)}>{t.rsvp.back}</Button>}
            {step < 3
              ? <Button size="lg" className="flex-1" onClick={next}>{t.rsvp.next}</Button>
              : <Button size="lg" className="flex-1" onClick={send}>{error ? t.rsvp.tryAgain : t.rsvp.send}</Button>}
          </footer>
          {step === 3 && <p className="text-sm text-muted-foreground">{t.rsvp.privacy}</p>}
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
    if (answer !== "none") playFurin()
  }, [answer, titleRef])
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-5 pr-12">
        {answer !== "none" && <Hanko stamp />}
        <div className="flex flex-col gap-2">
          <p className="label-caps text-muted-foreground">{result.updated ? t.rsvp.updatedEyebrow : t.rsvp.savedEyebrow}</p>
          <Dialog.Title ref={titleRef} tabIndex={-1} className="heading outline-none">{t.rsvp.doneTitle[answer]}</Dialog.Title>
        </div>
      </header>
      <p role="status">{confirm === "offline" ? t.rsvp.savedOffline : confirm === "saving" ? t.rsvp.savingQuiet : `${t.rsvp.savedLine} ${h.hasEmail === false ? "" : t.rsvp.doneBodyEmail}`.trim()}</p>
      {answer !== "none" && <FortuneCard token={h.token} />}
      {answer !== "none" && <AddToCalendar />}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Button size="lg" className="flex-1 sm:flex-none" onClick={onClose}>{t.rsvp.backHome}</Button>
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
