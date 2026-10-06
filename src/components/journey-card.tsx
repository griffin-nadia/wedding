import { useState } from "react"
import { MapPin } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { JourneyMini } from "@/components/journey-mini"
import { FlyingFrom } from "@/components/flying-from"
import { getFlying, type Flying } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { useLang } from "@/lib/lang"

/**
 * Home, after replying (Options → Journey map): a small "Your line's on the map" card, only once they've said
 * where they're flying from. It opens the same map in a sheet: everyone's faint lines (counts only, never names),
 * theirs drawing in last, and a way to change the city.
 */
export default function JourneyCard({ token, chip = false }: { token: string; chip?: boolean }) {
  const { t } = useLang()
  const [city, setCity] = useState<Flying | null>(() => readFlying(token))
  const [open, setOpen] = useState(false)
  const [changing, setChanging] = useState(false)
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof getFlying>>>(null)
  if (!city) return null
  const name = t.flying.cities[city] ?? city
  const show = () => { setOpen(true); void getFlying().then(setCounts) }
  return (
    <>
      {chip
        ? <button type="button" className="reply-chip" onClick={show}><MapPin className="size-5 text-success" aria-hidden /><span>{t.journey.onMap}</span></button>
        : <button type="button" className="journey-card-home reply-row" onClick={show}>
            <JourneyMini you={city} label="" className="journey-card-thumb" />
            <span className="flex min-w-0 flex-col text-left">
              <span className="font-medium text-foreground">{t.journey.onMap}</span>
              <span className="text-sm text-muted-foreground">{t.flying.yours(name)}</span>
            </span>
          </button>}
      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setChanging(false) }}>
        <SheetContent side="bottom" className="mx-auto max-w-xl gap-4 rounded-t-(--radius-section) bg-background p-6">
          <SheetTitle className="font-display text-2xl font-normal">{t.journey.onMap}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {counts && counts.told > 0 ? t.story.flyingFrom(counts.told, counts.households) : t.flying.hint}
          </SheetDescription>
          {open && <JourneyMini you={city} counts={counts?.counts} label={t.journey.map(name)} />}
          {changing
            ? <FlyingFrom token={token} initial={city} onSaved={(c) => { keepFlying(token, c); setCity(c); setChanging(false) }} />
            : <p className="text-sm text-muted-foreground">{t.flying.yours(name)} <button type="button" className="btn-text" onClick={() => setChanging(true)}>{t.flying.change}</button></p>}
        </SheetContent>
      </Sheet>
    </>
  )
}
