import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { saveRsvp, type Guest, type RsvpPayload } from "@/lib/api"
import { config } from "@/lib/config"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { isLocked } from "@/lib/time"
import { cn } from "@/lib/utils"

/** Option D's RSVP: one household, three short steps, in a sheet (bottom on phones, right on desktop). */
export function RsvpSheet({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const { household, setHousehold } = useHousehold()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<RsvpPayload>(() => ({
    guests: household?.guests ?? [],
    songs: household?.songs ?? [],
    arrival: household?.arrival ?? "",
    departure: household?.departure ?? "",
    message: household?.message ?? "",
  }))
  if (!household) return null
  const locked = isLocked()

  const setGuest = (id: string, patch: Partial<Guest>) =>
    setForm((f) => ({ ...f, guests: f.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
  const coming = form.guests.filter((g) => g.attending === "yes")
  const canNext = step !== 1 || form.guests.every((g) => g.attending)

  async function send() {
    setSaving(true)
    try {
      const saved = await saveRsvp(household!.token, form)
      setHousehold(saved)
      setOpen(false)
      setStep(1)
      toast.success(t.rsvp.done, { description: t.rsvp.doneBody })
    } catch {
      toast.error(t.rsvp.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep(1) }}>
      <SheetTrigger asChild disabled={locked}>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-background sm:max-w-lg">
        <SheetHeader className="gap-3 px-6 pt-8">
          <p className="eyebrow text-muted-foreground">{t.rsvp.step(step)}</p>
          <SheetTitle className="font-display text-3xl font-normal">
            {step === 1 ? t.rsvp.whoTitle : step === 2 ? t.rsvp.foodTitle : t.rsvp.checkTitle}
          </SheetTitle>
          <SheetDescription className="sr-only">RSVP for {household.displayName}</SheetDescription>
          <div className="grid grid-cols-3 gap-2" aria-hidden>
            {[1, 2, 3].map((n) => <span key={n} className={cn("h-1 rounded-full", n <= step ? "bg-primary" : "bg-border")} />)}
          </div>
        </SheetHeader>

        <div className="space-y-4 px-6 py-6">
          {step === 1 && form.guests.map((g) => (
            <fieldset key={g.id} className="rounded-lg border bg-card p-4">
              <legend className="sr-only">{g.firstName}</legend>
              <p className="mb-3 font-bold">{g.firstName}</p>
              <RadioGroup value={g.attending ?? ""} onValueChange={(v) => setGuest(g.id, { attending: v as Guest["attending"] })} className="grid grid-cols-2 gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <Label key={v} htmlFor={`${g.id}-${v}`} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-3", g.attending === v && "border-primary bg-secondary")}>
                    <RadioGroupItem id={`${g.id}-${v}`} value={v} />
                    {v === "yes" ? t.rsvp.coming : t.rsvp.notComing}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>
          ))}

          {step === 2 && (
            <>
              {coming.map((g) => (
                <div key={g.id} className="space-y-2">
                  <Label htmlFor={`diet-${g.id}`}>{t.rsvp.dietary} ({g.firstName})</Label>
                  <div className="flex flex-wrap gap-2" id={`diet-${g.id}`}>
                    {t.rsvp.dietaryOptions.map((o) => (
                      <button key={o} type="button" onClick={() => setGuest(g.id, { dietary: o })}
                        className={cn("rounded-md border px-3 py-2 text-sm", g.dietary === o ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <Label>{t.rsvp.song}</Label>
                {Array.from({ length: config.maxSongs }).map((_, i) => (
                  <Input key={i} value={form.songs[i] ?? ""} placeholder={i === 0 ? "September, Earth Wind & Fire" : ""}
                    onChange={(e) => setForm((f) => { const songs = [...f.songs]; songs[i] = e.target.value; return { ...f, songs } })} />
                ))}
                <p className="text-xs text-muted-foreground">{t.rsvp.songHint}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="arr">{t.rsvp.arrival}</Label><Input id="arr" type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="dep">{t.rsvp.departure}</Label><Input id="dep" type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} /></div>
                <p className="col-span-2 text-xs text-muted-foreground">{t.rsvp.datesHint}</p>
              </div>
              <div className="space-y-2"><Label htmlFor="msg">{t.rsvp.message}</Label><Textarea id="msg" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            </>
          )}

          {step === 3 && (
            <dl className="divide-y rounded-lg border bg-card">
              {form.guests.map((g) => (
                <div key={g.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="font-bold">{g.firstName}</dt>
                  <dd className="text-right text-body">{g.attending === "yes" ? `${t.rsvp.coming}${g.dietary && g.dietary !== "None" ? ` · ${g.dietary}` : ""}` : t.rsvp.notComing}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 px-4 py-3 text-sm"><dt className="font-bold">Songs</dt><dd className="text-right text-body">{form.songs.filter(Boolean).join(", ") || "None yet"}</dd></div>
              <div className="flex justify-between gap-4 px-4 py-3 text-sm"><dt className="font-bold">Dates</dt><dd className="text-right text-body">{form.arrival || form.departure ? `${form.arrival || "?"} to ${form.departure || "?"}` : t.rsvp.datesHint}</dd></div>
            </dl>
          )}
          {step === 3 && <p className="text-xs text-muted-foreground">{t.rsvp.editUntil}</p>}
        </div>

        <SheetFooter className="mt-auto flex-row gap-3 border-t px-6 py-4">
          {step > 1 && <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>{t.rsvp.back}</Button>}
          {step < 3
            ? <Button size="lg" className="flex-1" disabled={!canNext} onClick={() => setStep(coming.length === 0 && step === 1 ? 3 : step + 1)}>{t.rsvp.next}</Button>
            : <Button size="lg" className="flex-1" disabled={saving} onClick={send}>{saving ? "Saving…" : t.rsvp.send}</Button>}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
