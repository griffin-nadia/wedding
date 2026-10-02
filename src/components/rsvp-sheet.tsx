import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Hanko } from "@/components/hanko"
import { SongPicker } from "@/components/song-picker"
import { AddToCalendar } from "@/components/add-to-calendar"
import { Leaf } from "@/components/nature"
import { Photo } from "@/components/photo"
import { FLYING, setFlying, type Flying, answerOf, ApiError, clearDraft, readDraft, saveRsvpWithRetry, trackStarted, writeDraft, type Guest, type Household, type RsvpPayload, type SaveResult } from "@/lib/api"
import { fmtStay } from "@/lib/dates"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { cn } from "@/lib/utils"

// Same limits as the back end, so nothing gets cut off silently.
const MAX = { name: 40, song: 200, message: 2000 }
// Trip dates around the wedding, same rule as the back end
const TRIP = { from: "2027-09-01", to: "2027-11-30" }

/** Dietary is saved as words: "Vegetarian, Gluten free, Allergy: peanuts". */
const ALLERGY = "Allergy" // same word as t.rsvp.allergy
function parseDiet(v: string) {
  const parts = (v || "").split(",").map((x) => x.trim()).filter((x) => x && x !== "None")
  const allergyPart = parts.find((x) => x.startsWith(ALLERGY))
  return {
    set: parts.map((x) => (x.startsWith(ALLERGY) ? ALLERGY : x)),
    allergy: allergyPart?.includes(":") ? allergyPart.slice(allergyPart.indexOf(":") + 1).trim() : "",
  }
}
function dietString(set: string[], allergy: string) {
  const out = set.map((x) => (x === ALLERGY ? `${ALLERGY}: ${allergy.replace(/,/g, " ")}`.trimEnd() : x))
  return out.length ? out.join(", ") : "None"
}

/** A review row with an Edit link back to its step. */
function Row({ label, children, edit, editLabel, block = false }: { label: string; children: ReactNode; edit: () => void; editLabel: string; block?: boolean }) {
  return (
    <div className={cn("flex gap-3 px-4 py-3 text-sm", block ? "flex-col" : "items-start justify-between")}>
      <div className={cn("min-w-0", !block && "flex flex-1 justify-between gap-4")}>
        <dt className="font-semibold">{label}</dt>
        <dd className={cn("text-body", block ? "mt-1 whitespace-pre-line break-words" : "text-right")}>{children}</dd>
      </div>
      <button type="button" onClick={edit} aria-label={editLabel}
        className={cn("inline-flex min-h-11 shrink-0 items-center gap-1 self-start rounded-full px-3 text-link underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", block && "-ml-3")}>
        <Pencil className="size-3.5" aria-hidden />Edit
      </button>
    </div>
  )
}

/** A plus one still called "Guest" in the sheet shows as a blank name box. */
const blankPlusOne = (g: Guest) => (g.plusOne && /^(guest|plus one|\+1)$/i.test(g.firstName.trim()) ? { ...g, firstName: "" } : g)

const formFrom = (h: Household | null): RsvpPayload => ({
  guests: (h?.guests ?? []).map(blankPlusOne),
  songs: h?.songs ?? [],
  arrival: h?.arrival ?? "",
  departure: h?.departure ?? "",
  message: h?.message ?? "",
  photos: h?.photos ?? null,
})

/** Option D's RSVP: one household, three short steps, in a sheet (bottom on phones, right on desktop). */
export function RsvpSheet({ children, openOnLoad = false }: { children: ReactNode; openOnLoad?: boolean }) {
  const { t } = useLang()
  const { household, setHousehold } = useHousehold()
  const [open, setOpen] = useState(openOnLoad)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState<SaveResult | null>(null)
  const [slow, setSlow] = useState(false)
  const [offline, setOffline] = useState(false)
  const replyId = useRef("")
  const arrowKey = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  // Each new step moves focus to its heading, so screen readers hear where they are
  const firstStep = useRef(true)
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return }
    heading.current?.focus()
  }, [step])
  const sending = useRef(false)
  const [form, setForm] = useState<RsvpPayload>(() => formFrom(household))
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
    const back = () => { setOffline(false); void send() }
    window.addEventListener("online", back)
    return () => window.removeEventListener("online", back)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline])

  if (!household) return null
  const locked = isLocked()

  const nameOf = (g: Guest) => g.firstName || t.rsvp.plusOneName
  const setGuest = (id: string, patch: Partial<Guest>) =>
    setForm((f) => ({ ...f, guests: f.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
  const coming = form.guests.filter((g) => g.attending === "yes")
  const songsFilled = form.songs.map((x) => x.trim()).filter(Boolean)
  const outside = (d: string) => Boolean(d) && (d < TRIP.from || d > TRIP.to)
  const dateError = outside(form.arrival) || outside(form.departure)
    ? t.rsvp.dateRange
    : form.arrival && form.departure && form.departure < form.arrival ? t.rsvp.dateOrder : ""
  const allergyMissing = form.guests.some((g) => g.attending === "yes" && parseDiet(g.dietary).set.includes(t.rsvp.allergy) && !parseDiet(g.dietary).allergy.trim())
  const canNext = step === 1 ? form.guests.every((g) => g.attending) : step === 2 ? !dateError && !allergyMissing : true
  const goTo = (n: number) => setStep(n)

  function onOpenChange(o: boolean) {
    if (o) {
      // A draft from an earlier, unsent try wins over the saved answers if it's newer
      const draft = readDraft(household!.token)
      const savedAt = household!.respondedAt ? Date.parse(household!.respondedAt) : 0
      setForm(draft && draft.at > savedAt ? draft.form : formFrom(household))
      replyId.current = ""
      setError("")
      setDone(null)
      trackStarted(household!.token)
    }
    setOpen(o)
    if (!o) setStep(1)
  }

  async function send() {
    if (sending.current) return // no double submits, even on a fast double tap
    setError("")
    if (typeof navigator !== "undefined" && navigator.onLine === false) return setOffline(true)
    sending.current = true
    setSaving(true)
    setSlow(false)
    const slowTimer = setTimeout(() => setSlow(true), 2500)
    replyId.current ||= crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    try {
      const result = await saveRsvpWithRetry(household!.token, form, household!, replyId.current)
      clearDraft(household!.token)
      setHousehold(result.household)
      setDone(result)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "other"
      if (code === "network" && navigator.onLine === false) setOffline(true)
      else setError(code in t.rsvp.errors ? t.rsvp.errors[code as keyof typeof t.rsvp.errors] : t.rsvp.errors.other)
    } finally {
      clearTimeout(slowTimer)
      sending.current = false
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild disabled={locked}>{children}</SheetTrigger>
      <SheetContent side="right" className={cn("gap-0 overflow-y-auto bg-background data-[side=right]:w-full data-[side=right]:sm:max-w-lg", done && "[&>button.absolute]:z-10 [&>button.absolute]:text-on-band")}>
        {done ? <Done result={done} onClose={() => onOpenChange(false)} onChange={() => { setForm(formFrom(done.household)); setDone(null); setStep(1) }} /> : <>
        <SheetHeader className="gap-3 px-6 pt-8">
          <p className="label-caps text-muted-foreground">{t.rsvp.step(step)}</p>
          <SheetTitle ref={heading} tabIndex={-1} className="font-display text-4xl font-normal outline-none">
            {step === 1 ? t.rsvp.whoTitle : step === 2 ? (coming.length ? t.rsvp.foodTitle : t.rsvp.noteTitle) : t.rsvp.checkTitle}
          </SheetTitle>
          <SheetDescription className="sr-only">RSVP for {household.displayName}</SheetDescription>
          <div role="progressbar" aria-label={t.rsvp.step(step)} aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => <span key={n} className={cn("h-1.5 rounded-full transition-colors", n <= step ? "bg-primary" : "bg-border")} />)}
          </div>
        </SheetHeader>

        <div className="space-y-4 px-6 py-6">
          {step === 1 && form.guests.map((g) => (
            <fieldset key={g.id} className="rounded-[1.25rem] border bg-card p-4 shadow-paper">
              <legend className="sr-only">{nameOf(g)}</legend>
              {g.plusOne ? (
                <div className="mb-3 space-y-2">
                  <Label htmlFor={`name-${g.id}`}>{t.rsvp.plusOne}</Label>
                  <Input id={`name-${g.id}`} value={g.firstName} maxLength={MAX.name} autoComplete="off"
                    onChange={(e) => setGuest(g.id, { firstName: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.rsvp.plusOneHint}</p>
                </div>
              ) : (
                <p className="mb-3 font-bold">{g.firstName}</p>
              )}
              <RadioGroup aria-label={nameOf(g)} value={g.attending ?? ""} onValueChange={(v) => setGuest(g.id, { attending: v as Guest["attending"] })} className="grid grid-cols-2 gap-2"
                onKeyDown={(e) => { if (e.key.startsWith("Arrow")) arrowKey.current = true }}>
                {(["yes", "no"] as const).map((v) => (
                  <Label key={v} htmlFor={`${g.id}-${v}`} className={cn("choice flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-base whitespace-nowrap has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50", g.attending === v && "border-2 border-primary bg-secondary font-semibold")}>
                    <RadioGroupItem id={`${g.id}-${v}`} value={v} className="sr-only"
                      // Arrow keys always select (Radix can skip the first press after the sheet focuses it)
                      onFocus={() => { if (arrowKey.current) { arrowKey.current = false; if (g.attending !== v) setGuest(g.id, { attending: v }) } }} />
                    <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors", g.attending === v ? "seal border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50")}>
                      {g.attending === v && <Check className="size-4" strokeWidth={3} />}
                    </span>
                    {v === "yes" ? t.rsvp.coming : t.rsvp.notComing}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>
          ))}

          {step === 2 && (
            <>
              {coming.map((g) => (
                <div key={g.id} className="space-y-2" role="group" aria-labelledby={`diet-${g.id}`}>
                  <p id={`diet-${g.id}`} className="text-sm font-medium">{t.rsvp.dietary} ({nameOf(g)})</p>
                  <div className="flex flex-wrap gap-2">
                    {t.rsvp.dietaryOptions.map((o) => {
                      const d = parseDiet(g.dietary); const on = d.set.includes(o)
                      return (
                        <button key={o} type="button" aria-pressed={on} onClick={() => setGuest(g.id, { dietary: dietString(on ? d.set.filter((x) => x !== o) : [...d.set, o], d.allergy) })}
                          className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors", on ? "border-primary bg-secondary font-semibold text-foreground" : "bg-card")}>
                          {on ? <Check className="size-4 text-primary" strokeWidth={3} aria-hidden /> : <span aria-hidden className="size-4" />}
                          {o}
                        </button>
                      )
                    })}
                  </div>
                  {parseDiet(g.dietary).set.includes(t.rsvp.allergy) && (
                    <div className="space-y-2">
                      <Label htmlFor={`allergy-${g.id}`}>{t.rsvp.allergyLabel(nameOf(g))}</Label>
                      <Input id={`allergy-${g.id}`} value={parseDiet(g.dietary).allergy} maxLength={80} required aria-invalid={!parseDiet(g.dietary).allergy.trim()}
                        aria-describedby={`allergy-hint-${g.id}`}
                        onChange={(e) => setGuest(g.id, { dietary: dietString(parseDiet(g.dietary).set, e.target.value) })} />
                      <p id={`allergy-hint-${g.id}`} className="text-xs text-muted-foreground">{t.rsvp.allergyHint}</p>
                    </div>
                  )}
                </div>
              ))}
              {coming.length > 0 && <>
              <SongPicker songs={form.songs} onChange={(songs) => setForm((f) => ({ ...f, songs }))} token={household.token} maxLength={MAX.song}
                t={{ label: t.rsvp.song, hint: t.rsvp.songHint, searching: t.rsvp.searching, noMatch: t.rsvp.noMatch, error: t.rsvp.searchError, remove: t.rsvp.removeSong, full: t.rsvp.songsFull, added: t.rsvp.songsAdded }} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="arr">{t.rsvp.arrival}</Label><Input id="arr" type="date" min={TRIP.from} max={TRIP.to} value={form.arrival}
                  aria-invalid={Boolean(dateError)} aria-describedby={dateError ? "date-error" : "date-hint"} onChange={(e) => setForm({ ...form, arrival: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="dep">{t.rsvp.departure}</Label><Input id="dep" type="date" min={form.arrival || TRIP.from} max={TRIP.to} value={form.departure}
                  aria-invalid={Boolean(dateError)} aria-describedby={dateError ? "date-error" : "date-hint"} onChange={(e) => setForm({ ...form, departure: e.target.value })} /></div>
                {dateError
                  ? <p id="date-error" role="alert" className="col-span-2 text-sm text-destructive">{dateError}</p>
                  : <p id="date-hint" className="col-span-2 text-xs text-muted-foreground">{form.arrival || form.departure ? fmtStay(form.arrival, form.departure, t.rsvp.notSet) : t.rsvp.datesHint}</p>}
              </div>
              </>}
              <div className="space-y-2"><Label htmlFor="msg">{t.rsvp.message}</Label><Textarea id="msg" maxLength={MAX.message} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            </>
          )}

          {step === 3 && (
            <dl className="divide-y rounded-[1.25rem] bg-card shadow-paper ring-1 ring-border">
              {form.guests.map((g) => (
                <Row key={g.id} label={nameOf(g)} edit={() => goTo(1)} editLabel={t.rsvp.edit(nameOf(g))}>
                  {g.attending === "yes" ? `${t.rsvp.coming}${g.dietary && g.dietary !== "None" ? ` · ${g.dietary}` : ""}` : t.rsvp.notComing}
                </Row>
              ))}
              {coming.length > 0 && (
                <Row label={t.rsvp.songs} edit={() => goTo(2)} editLabel={t.rsvp.edit(t.rsvp.songs)}>{songsFilled.join(", ") || t.rsvp.noSongs}</Row>
              )}
              {coming.length > 0 && (
                <Row label={t.rsvp.dates} edit={() => goTo(2)} editLabel={t.rsvp.edit(t.rsvp.dates)}>{form.arrival || form.departure ? fmtStay(form.arrival, form.departure, t.rsvp.notSet) : t.rsvp.notSet}</Row>
              )}
              <Row label={t.rsvp.messageLabel} edit={() => goTo(2)} editLabel={t.rsvp.edit(t.rsvp.messageLabel)} block>{form.message.trim() || t.rsvp.noMessage}</Row>
            </dl>
          )}
          {step === 3 && (
            <label htmlFor="photos" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 text-sm text-body">
              <Checkbox id="photos" className="mt-0.5 size-5 shrink-0" checked={form.photos === true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, photos: v === true }))} />
              {t.rsvp.photos}
            </label>
          )}
          {step === 3 && <p className="hand text-sm text-muted-foreground">{t.rsvp.editUntil}</p>}
          {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-card px-4 py-3 text-sm text-destructive">{error}</p>}
          {offline && <p role="status" className="rounded-xl border bg-card px-4 py-3 text-sm text-body">{t.rsvp.offline}</p>}
        </div>

        <SheetFooter className="sticky bottom-0 mt-auto flex-row gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur">
          {step > 1 && <Button variant="outline" size="lg" disabled={saving} onClick={() => setStep(step - 1)}>{t.rsvp.back}</Button>}
          {step < 3
            ? <Button size="lg" className="flex-1" disabled={!canNext} onClick={() => setStep(step + 1)}>{t.rsvp.next}</Button>
            : <Button size="lg" className="flex-1" disabled={saving} aria-busy={saving} onClick={send}>{saving ? (<><Loader2 className="animate-spin" aria-hidden />{slow ? t.rsvp.stillSending : t.rsvp.saving}</>) : error ? t.rsvp.tryAgain : t.rsvp.send}</Button>}
        </SheetFooter>
        {step === 3 && <p className="px-6 pb-6 text-xs text-muted-foreground">{t.rsvp.privacy}</p>}
        </>}
      </SheetContent>
    </Sheet>
  )
}

/** The success moment: the seal stamps onto a forest band, words match the answer, two leaves drift once. */
function Done({ result, onClose, onChange }: { result: SaveResult; onClose: () => void; onChange: () => void }) {
  const { t } = useLang()
  const h = result.household
  const answer = answerOf(h)
  const coming = h.guests.filter((g) => g.attending === "yes")
  const names = (answer === "none" ? h.guests : coming).map((g) => g.firstName).filter(Boolean)
  const who = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] || h.displayName
  return (
    <div className="flex flex-1 flex-col" role="status">
      <div className="band relative overflow-hidden px-6 pt-12 pb-8">
        <Leaf kind="maple" className="leaf-drift absolute top-6 left-[18%] size-6" />
        <Leaf kind="ivy" tone="b" className="leaf-drift absolute top-10 right-[22%] size-5 [animation-delay:.25s]" />
        {answer !== "none" && <Hanko stamp className="ring-8 ring-[var(--band)]" />}
        <p className="eyebrow mt-4">{result.updated ? t.rsvp.updatedEyebrow : t.rsvp.savedEyebrow}</p>
        <SheetTitle className="mt-2 font-display text-4xl font-normal">{t.rsvp.doneTitle[answer]}</SheetTitle>
        <SheetDescription className="hand mt-3 text-lg">{t.rsvp.thanks[answer](who)}</SheetDescription>
      </div>
      <div className="flex-1 space-y-6 px-6 py-6">
        {answer !== "none" && <Photo name="nara-deer-nuzzle" treatment="arch" sizes="160px" className="mx-auto w-40" />}
        <section aria-labelledby="sum" className="space-y-2">
          <h3 id="sum" className="label-caps text-muted-foreground">{t.rsvp.summary}</h3>
          <ul className="space-y-1 text-body">
            {h.guests.map((g) => <li key={g.id}><span className="font-semibold text-foreground">{g.firstName}</span> · {g.attending === "yes" ? `${t.rsvp.coming}${g.dietary !== "None" ? ` (${g.dietary})` : ""}` : t.rsvp.notComing}</li>)}
            {(h.arrival || h.departure) && answer !== "none" && <li>{t.rsvp.dates}: {fmtStay(h.arrival, h.departure, t.rsvp.notSet)}</li>}
            {h.songs.length > 0 && <li>{t.rsvp.songs}: {h.songs.join(", ")}</li>}
          </ul>
          <p className="text-sm text-body">{h.hasEmail === false ? t.rsvp.doneBodyNoEmail : t.rsvp.doneBodyEmail}</p>
        </section>
        {answer !== "none" && <FlyingFrom token={h.token} />}
        {answer !== "none" && <AddToCalendar />}
        <section className="rounded-[1.25rem] bg-card p-4 ring-1 ring-border">
          <h3 className="label-caps text-muted-foreground">{t.rsvp.omikuji}</h3>
          <p className="hand mt-1 text-sm text-body">{t.rsvp.omikujiSoon}</p>
        </section>
      </div>
      <div className="sticky bottom-0 flex gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur">
        <Button variant="outline" size="lg" onClick={onChange}>{t.rsvp.changeReply}</Button>
        <Button size="lg" className="flex-1" onClick={onClose} autoFocus>{t.rsvp.backHome}</Button>
      </div>
    </div>
  )
}

/** Optional after RSVP: where they're flying from (a short list). Only ever shown as counts. */
function FlyingFrom({ token }: { token: string }) {
  const { t } = useLang()
  const [picked, setPicked] = useState<Flying | null>(null)
  const [saved, setSaved] = useState(false)
  return (
    <section aria-labelledby="flying" className="space-y-2">
      <h3 id="flying" className="label-caps text-muted-foreground">{t.flying.title}</h3>
      <p className="text-xs text-muted-foreground">{t.flying.hint}</p>
      <div className="flex flex-wrap gap-2">
        {FLYING.map((c) => (
          <button key={c} type="button" aria-pressed={picked === c}
            onClick={() => { setPicked(c); setSaved(false); setFlying(token, c).then(() => setSaved(true)).catch(() => setPicked(null)) }}
            className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors", picked === c ? "border-primary bg-secondary font-semibold" : "bg-card")}>
            {picked === c ? <Check className="size-4 text-primary" strokeWidth={3} aria-hidden /> : null}{c}
          </button>
        ))}
      </div>
      {saved && <p role="status" className="text-sm text-success">{t.flying.thanks}</p>}
    </section>
  )
}
