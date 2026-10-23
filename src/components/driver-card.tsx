import { useEffect, useState } from "react"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Copy } from "lucide-react"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { toast } from "@/components/ui/toast"
import { copyText } from "@/lib/copy"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { VenueMark } from "@/components/venue-mark"
import { directionsUrl } from "@/lib/calendar"

/**
 * Show the driver. Compact in the page; on tap the shared sheet (v3 Q4) on the brightest paper, big Japanese,
 * Done in the footer. Esc, X or Done closes and focus goes back to "Show the driver".
 */
export function DriverCard() {
  const { t } = useLang()
  const [full, setFull] = useState(false)
  // While it's open the screen stays awake where the browser allows, and the bar and dock step aside
  useEffect(() => {
    if (!full) return
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {})
    document.documentElement.toggleAttribute("data-modal", true)
    return () => { document.documentElement.removeAttribute("data-modal"); lock?.release().catch(() => {}) }
  }, [full])
  const copy = async () => {
    if (await copyText(`${VENUE.nameJa}\n${VENUE.addressJa}`)) toast(t.driver.copied)
  }
  return (
    <>
      <Sheet open={full} onOpenChange={setFull}>
      <section aria-labelledby="driver" className="flex flex-col gap-3 rounded-md bg-section-alt p-4 md:p-6">
        <h2 id="driver" className="label-caps text-muted-foreground">{t.driver.label}</h2>
        <div className="flex flex-col gap-2"><VenueMark /><span lang="ja" className="font-ja">{VENUE.nameJa}</span></div>
        <p>{t.driver.fare}</p>
        <div className="flex flex-col gap-3">
            <Button asChild size="md" className="w-full sm:w-auto sm:self-start">
              <a href={directionsUrl} target="_blank" rel="noreferrer"><MapPin aria-hidden />{t.driver.maps}<span className="sr-only">, {t.driver.mapsOpens}</span></a>
            </Button>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <SheetTrigger asChild><Button size="md" variant="secondary">{t.driver.show}</Button></SheetTrigger>
              <Button size="md" variant="secondary" onClick={copy}><Copy aria-hidden />{t.driver.copy}</Button>
            </div>
        </div>
      </section>
        <SheetContent tone="bright" className="sheet-driver takeover" aria-describedby={undefined} closeLabel={t.driver.done}>
          <div className="driver-body" lang="ja">
            <SheetTitle className="driver-please font-ja">{VENUE.please}</SheetTitle>
            <p className="driver-name font-ja">{VENUE.nameJa}</p>
            <p className="driver-address font-ja">{VENUE.addressJa}</p>
            <p lang="en" className="text-(--brand-kuri)">{t.driver.english}</p>
          </div>
          <footer className="driver-foot">
            <SheetClose asChild><Button size="md" className="w-full">{t.driver.done}</Button></SheetClose>
          </footer>
        </SheetContent>
      </Sheet>
    </>
  )
}
