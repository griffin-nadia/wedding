import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Copy } from "lucide-react"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { toast } from "@/components/toast"
import { copyText } from "@/lib/copy"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { directionsUrl } from "@/lib/calendar"
import { useOption } from "@/lib/options"

/**
 * Show the driver. Compact in the page; on tap a modal above everything (v3 Q4): the brightest paper,
 * big Japanese, Done in the card's footer. The dock, mode toggle and the rest of the page are hidden and
 * inert while it's open; the screen stays awake where the browser allows; Esc or Done closes and focus
 * goes back to "Show the driver".
 */
export function DriverCard() {
  const { t } = useLang()
  const [full, setFull] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const done = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!full) return
    const back = opener.current
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {})
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false) }
    // Done is the only control, so Tab stays on it
    const trap = (e: KeyboardEvent) => { if (e.key === "Tab") { e.preventDefault(); done.current?.focus() } }
    window.addEventListener("keydown", esc); window.addEventListener("keydown", trap)
    const root = document.getElementById("root"), html = document.documentElement
    if (root) root.inert = true
    html.toggleAttribute("data-modal", true)
    done.current?.focus()
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", esc); window.removeEventListener("keydown", trap)
      if (root) root.inert = false
      html.removeAttribute("data-modal")
      lock?.release().catch(() => {}); document.body.style.overflow = ""; back?.focus()
    }
  }, [full])
  const copy = async () => {
    if (await copyText(`${VENUE.nameJa}\n${VENUE.addressJa}`)) toast(t.driver.copied)
  }
  const mapsFirst = useOption("getthere") !== "driver"
  return (
    <>
      <section aria-labelledby="driver" className="flex flex-col gap-3 rounded-md bg-section-alt p-4 md:p-6">
        <h2 id="driver" className="label-caps text-muted-foreground">{t.driver.label}</h2>
        <p className="flex flex-col"><span className="font-medium text-foreground">{VENUE.name}</span><span lang="ja" className="font-ja">{VENUE.nameJa}</span></p>
        <p>{t.driver.fare}</p>
        {mapsFirst ? (
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto sm:self-start">
              <a href={directionsUrl} target="_blank" rel="noreferrer"><MapPin aria-hidden />{t.driver.maps}<span className="sr-only">, {t.driver.mapsOpens}</span></a>
            </Button>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Button ref={opener} size="lg" variant="outline" onClick={() => setFull(true)}>{t.driver.show}</Button>
              <Button size="lg" variant="outline" onClick={copy}><Copy aria-hidden />{t.driver.copy}</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Button ref={opener} size="lg" onClick={() => setFull(true)}>{t.driver.show}</Button>
            <Button size="lg" variant="outline" onClick={copy}><Copy aria-hidden />{t.driver.copy}</Button>
            <Button asChild size="lg" variant="outline"><a href={directionsUrl} target="_blank" rel="noreferrer"><MapPin aria-hidden />{t.driver.maps}</a></Button>
          </div>
        )}
      </section>
      {full && createPortal(
        <div className="driver-modal paper" role="dialog" aria-modal="true" aria-labelledby="driver-full">
          <div className="driver-card">
            <div className="driver-body" lang="ja">
              <p id="driver-full" className="driver-please font-ja">{VENUE.please}</p>
              <p className="driver-name font-ja">{VENUE.nameJa}</p>
              <p className="driver-address font-ja">{VENUE.addressJa}</p>
              <p lang="en" className="text-(--brand-kuri)">{t.driver.english}</p>
            </div>
            <footer className="driver-foot">
              <Button ref={done} size="lg" className="w-full" onClick={() => setFull(false)}>{t.driver.done}</Button>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
