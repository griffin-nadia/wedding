import { lazy, Suspense, useEffect, useState } from "react"
import { FORTUNE_EVENT, localDraws } from "@/lib/fortune"
import { Sheet, SheetClose, SheetContent, SheetHead, SheetBody, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"

// The card loads only once the sheet is opened (its own chunk, shared with the reply sheet's)
const FortuneCard = lazy(() => import("@/components/fortune-card").then((m) => ({ default: m.FortuneCard })))

/** An omikuji box in Lucide's own style (24 grid, the site's 1.75 stroke, round caps and joins, currentColor): the
 *  box, its top edge, and the stick rising out of it. Class lucide, so it takes the same rules as the others. */
function OmikujiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="lucide size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 2-1.5 6" />
      <rect x="4" y="8" width="16" height="14" rx="2" />
      <path d="M4 12h16" />
    </svg>
  )
}

/**
 * Run 27: the fortune in the top bar, left of あ, on every page, once the household has replied and drawn it once. It opens the
 * fortune in its own sheet (focus kept inside, Esc or the X closes it, focus goes back to the icon), with Back to your
 * invite at the bottom as the second way out. Before a reply there's nothing here, so the bar keeps three icons.
 */
export function FortuneButton() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [open, setOpen] = useState(false)
  // Run 27 (Jehan): only once they've drawn their fortune at least once (on the done screen or Home), so the bar only
  // offers it back to them
  const token = household?.token ?? ""
  const [drawn, setDrawn] = useState(() => Boolean(token) && localDraws(token).length > 0)
  useEffect(() => {
    if (!token) return
    const on = () => setDrawn(localDraws(token).length > 0)
    on(); window.addEventListener(FORTUNE_EVENT, on)
    return () => window.removeEventListener(FORTUNE_EVENT, on)
  }, [token])
  if (!household?.respondedAt || !drawn) return null
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="utility-btn press" aria-label={t.fortune.homeTitle} title={t.fortune.homeTitle}><OmikujiIcon /></button>
      </SheetTrigger>
      <SheetContent className="sheet-fortune" aria-describedby={undefined}>
        <SheetHead><SheetTitle className="heading outline-none">{t.fortune.title}</SheetTitle></SheetHead>
        <SheetBody className="fortune-sheet-body">
          {open && <Suspense fallback={null}><FortuneCard token={household.token} title={t.fortune.homeTitle} className="home-fortune" /></Suspense>}
          <SheetClose asChild><Button size="md" variant="secondary" className="fortune-sheet-back">{t.rsvp.backHome}</Button></SheetClose>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
