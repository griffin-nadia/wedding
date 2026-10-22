import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHead, SheetBody, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/lang"
import { useTake } from "../../params"

/**
 * Laptop sheets two ways (run 21, section 2): the reply's first step open over FAQs.
 * - centred: what ships. A dialog the card's width, centred under the bar, over the page softly dimmed and blurred so
 *   it still reads behind.
 * - side: as it was. The sheet where the card is, over the page hidden behind a 60% ink veil.
 * Phones are the same either way (the sheet covers the page). The side take puts back the old rules, here only.
 */
const P = "x-sd"
const css = `
@media (min-width: 1024px) {
  :root[data-${P}="side"] .sheet { left: var(--letter-left); translate: 0 -50%; }
  :root[data-${P}="side"] .sheet-overlay { background: color-mix(in oklab, var(--brand-ink-deep) 60%, transparent); -webkit-backdrop-filter: none; backdrop-filter: none; }
  :root[data-${P}="side"] .letter-wrap > *, :root[data-${P}="side"] .site-bar, :root[data-${P}="side"] .site-nav, :root[data-${P}="side"] .phone-qr { visibility: hidden; }
}
`
export default function SheetDialog() {
  const take = useTake("centred")
  const { t } = useLang()
  const [open, setOpen] = useState(true)
  useEffect(() => {
    document.documentElement.setAttribute(`data-${P}`, take)
    return () => document.documentElement.removeAttribute(`data-${P}`)
  }, [take])
  return (
    <>
      <style>{css}</style>
      <h1 className="heading">{t.qa.title}</h1>
      <ol className="flex flex-col gap-3">{t.qa.items.map((x) => <li key={x.q}>{x.q}</li>)}</ol>
      <Button size="md" className="self-start" onClick={() => setOpen(true)}>{t.nav.rsvp}</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent aria-describedby={undefined}>
          <SheetHead><p className="label-caps">{t.rsvp.step(1)}</p><SheetTitle className="heading">{t.rsvp.whoTitle}</SheetTitle></SheetHead>
          <SheetBody>
            <div className="flex flex-col gap-4">
              <p>{t.rsvp.datesHint}</p>
              <div className="flex gap-3"><Button variant="secondary" size="md">{t.rsvp.coming}</Button><Button variant="secondary" size="md">{t.rsvp.notComing}</Button></div>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}
