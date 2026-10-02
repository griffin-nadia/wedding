import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Hanko } from "@/components/hanko"
import { SongField } from "@/components/song-field"
import { answerOf, ApiError, saveRsvp, trackStarted, type Guest, type Household, type RsvpPayload, type SaveResult } from "@/lib/api"
import { config } from "@/lib/config"
import { fmtStay } from "@/lib/dates"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { cn } from "@/lib/utils"

// Same limits as the back end, so nothing gets cut off silently.
const MAX = { name: 40, song: 200, message: 2000 }

/** A plus one still called "Guest" in the sheet shows as a blank name box. */
const blankPlusOne = (g: Guest) => (g.plusOne && /^(guest|plus one|\+1)$/i.test(g.firstName.trim()) ? { ...g, firstName: "" } : g)

const formFrom = (h: Household | null): RsvpPayload => ({
  guests: (h?.guests ?? []).map(blankPlusOne),
  songs: h?.songs ?? [],
  arrival: h?.arrival ?? "",
  departure: h?.departure ?? "",
  message: h?.message ?? "",
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
  const sending = useRef(false)
  const [form, setForm] = useState<RsvpPayload>(() => formFrom(household))
  // Opened by an early tap (before this form loaded): count it as a started RSVP too.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (openOnLoad && household) trackStarted(household.token) }, [])
  if (!household) return null
  const locked = isLocked()

  const nameOf = (g: Guest) => g.firstName || t.rsvp.plusOneName
  const setGuest = (id: string, patch: Partial<Guest>) =>
    setForm((f) => ({ ...f, guests: f.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
  const coming = form.guests.filter((g) => g.attending === "yes")
  const songsFilled = form.songs.map((x) => x.trim()).filter(Boolean)
  const canNext = step !== 1 || form.guests.every((g) => g.attending)

  function onOpenChange(o: boolean) {
    if (o) {
      setForm(formFrom(household))
      setError("")
      setDone(null)
      trackStarted(household!.token)
    }
    setOpen(o)
    if (!o) setStep(1)
  }

  async function send() {
    if (sending.current) return // no double submits, even on a fast double tap
    sending.current = true
    setSaving(true)
    setError("")
    try {
      const result = await saveRsvp(household!.token, form, household!)
      setHousehold(result.household)
      setDone(result)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "other"
      setError(code in t.rsvp.errors ? t.rsvp.errors[code as keyof typeof t.rsvp.errors] : t.rsvp.errors.other)
    } finally {
      sending.current = false
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild disabled={locked}>{children}</SheetTrigger>
      <SheetContent side="right" className="gap-0 overflow-y-auto bg-background data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {done ? <Done result={done} onClose={() => onOpenChange(false)} /> : <>
        <SheetHeader className="gap-3 px-6 pt-8">
          <p className="eyebrow text-muted-foreground">{t.rsvp.step(step)}</p>
          <SheetTitle className="font-display text-3xl font-normal">
            {step === 1 ? t.rsvp.whoTitle : step === 2 ? (coming.length ? t.rsvp.foodTitle : t.rsvp.noteTitle) : t.rsvp.checkTitle}
          </SheetTitle>
          <SheetDescription className="sr-only">RSVP for {household.displayName}</SheetDescription>
          <div className="grid grid-cols-3 gap-2" aria-hidden>
            {[1, 2, 3].map((n) => <span key={n} className={cn("h-1 rounded-full", n <= step ? "bg-primary" : "bg-border")} />)}
          </div>
        </SheetHeader>

        <div className="space-y-4 px-6 py-6">
          {step === 1 && form.guests.map((g) => (
            <fieldset key={g.id} className="rounded-lg border bg-card p-4">
              <legend className="sr-only">{nameOf(g)}</legend>
              {g.plusOne ? (
                <div className="mb-3 space-y-1.5">
                  <Label htmlFor={`name-${g.id}`}>{t.rsvp.plusOne}</Label>
                  <Input id={`name-${g.id}`} value={g.firstName} maxLength={MAX.name} autoComplete="off"
                    onChange={(e) => setGuest(g.id, { firstName: e.target.value })} />
                  <p className="text-xs text-muted-foreground">{t.rsvp.plusOneHint}</p>
                </div>
              ) : (
                <p className="mb-3 font-bold">{g.firstName}</p>
              )}
              <RadioGroup aria-label={nameOf(g)} value={g.attending ?? ""} onValueChange={(v) => setGuest(g.id, { attending: v as Guest["attending"] })} className="grid grid-cols-2 gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <Label key={v} htmlFor={`${g.id}-${v}`} className={cn("flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 py-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50", g.attending === v && "border-2 border-primary bg-secondary font-bold")}>
                    <RadioGroupItem id={`${g.id}-${v}`} value={v}
                      // Arrow keys always select (Radix skips the first press after the sheet focuses it)
                      onFocus={(e) => { if (e.currentTarget.matches(":focus-visible") && g.attending !== v) setGuest(g.id, { attending: v }) }} />
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
                    {t.rsvp.dietaryOptions.map((o) => (
                      <button key={o} type="button" aria-pressed={g.dietary === o} onClick={() => setGuest(g.id, { dietary: o })}
                        className={cn("rounded-md border px-3 py-2 text-sm", g.dietary === o ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {coming.length > 0 && <>
              <div className="space-y-2" role="group" aria-labelledby="songs-label">
                <p id="songs-label" className="text-sm font-medium">{t.rsvp.song}</p>
                {Array.from({ length: config.maxSongs }).map((_, i) => (
                  <SongField key={i} label={`Song ${i + 1}`} value={form.songs[i] ?? ""} maxLength={MAX.song} placeholder={i === 0 ? "September, Earth Wind & Fire" : ""}
                    onChange={(v) => setForm((f) => { const songs = [...f.songs]; songs[i] = v; return { ...f, songs } })} />
                ))}
                <p className="text-xs text-muted-foreground">{t.rsvp.songHint}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="arr">{t.rsvp.arrival}</Label><Input id="arr" type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="dep">{t.rsvp.departure}</Label><Input id="dep" type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} /></div>
                <p className="col-span-2 text-xs text-muted-foreground">{t.rsvp.datesHint}</p>
              </div>
              </>}
              <div className="space-y-2"><Label htmlFor="msg">{t.rsvp.message}</Label><Textarea id="msg" maxLength={MAX.message} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            </>
          )}

          {step === 3 && (
            <dl className="divide-y rounded-lg border bg-card">
              {form.guests.map((g) => (
                <div key={g.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="font-bold">{nameOf(g)}</dt>
                  <dd className="text-right text-body">{g.attending === "yes" ? `${t.rsvp.coming}${g.dietary && g.dietary !== "None" ? ` · ${g.dietary}` : ""}` : t.rsvp.notComing}</dd>
                </div>
              ))}
              {songsFilled.length > 0 && (
                <div className="flex justify-between gap-4 px-4 py-3 text-sm"><dt className="font-bold">{t.rsvp.songs}</dt><dd className="text-right text-body">{songsFilled.join(", ")}</dd></div>
              )}
              {(form.arrival || form.departure) && (
                <div className="flex justify-between gap-4 px-4 py-3 text-sm"><dt className="font-bold">{t.rsvp.dates}</dt><dd className="text-right text-body">{fmtStay(form.arrival, form.departure, t.rsvp.notSet)}</dd></div>
              )}
              {form.message.trim() && (
                <div className="space-y-1 px-4 py-3 text-sm"><dt className="font-bold">{t.rsvp.messageLabel}</dt><dd className="whitespace-pre-line break-words text-body">{form.message.trim()}</dd></div>
              )}
            </dl>
          )}
          {step === 3 && <p className="text-xs text-muted-foreground">{t.rsvp.editUntil}</p>}
          {error && <p role="alert" className="rounded-md border border-destructive/40 bg-card px-4 py-3 text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter className="mt-auto flex-row gap-3 border-t px-6 py-4">
          {step > 1 && <Button variant="outline" size="lg" disabled={saving} onClick={() => setStep(step - 1)}>{t.rsvp.back}</Button>}
          {step < 3
            ? <Button size="lg" className="flex-1" disabled={!canNext} onClick={() => setStep(step + 1)}>{t.rsvp.next}</Button>
            : <Button size="lg" className="flex-1" disabled={saving} aria-busy={saving} onClick={send}>{saving ? t.rsvp.saving : error ? t.rsvp.tryAgain : t.rsvp.send}</Button>}
        </SheetFooter>
        </>}
      </SheetContent>
    </Sheet>
  )
}

/** The success moment: the seal lands, the words match the answer, one way back. */
function Done({ result, onClose }: { result: SaveResult; onClose: () => void }) {
  const { t } = useLang()
  const answer = answerOf(result.household)
  return (
    <div className="flex flex-1 flex-col px-6 pt-12 pb-6" role="status">
      <div className="flex-1 space-y-5">
        {answer !== "none" && <Hanko stamp />}
        <p className="eyebrow">{result.updated ? t.rsvp.updatedEyebrow : t.rsvp.savedEyebrow}</p>
        <SheetTitle className="font-display text-3xl font-normal">{t.rsvp.doneTitle[answer]}</SheetTitle>
        <SheetDescription className="text-base text-body">{t.rsvp.doneLead[answer]}</SheetDescription>
        <p className="text-sm text-body">{result.household.hasEmail === false ? t.rsvp.doneBodyNoEmail : t.rsvp.doneBodyEmail}</p>
      </div>
      <Button size="lg" className="mt-8 w-full" onClick={onClose} autoFocus>{t.rsvp.backHome}</Button>
    </div>
  )
}
