import { useEffect, useRef, useState } from "react"
import { Copy } from "lucide-react"
import { VENUE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { toast } from "@/components/toast"
import { copyText } from "@/lib/copy"
import { Button } from "@/components/ui/button"

/**
 * Show the driver. Compact in the page; full screen on tap: the brightest paper, big Japanese,
 * screen kept awake where the browser allows, Esc or Done closes and focus goes back.
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
    window.addEventListener("keydown", esc)
    done.current?.focus()
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", esc); lock?.release().catch(() => {}); document.body.style.overflow = ""; back?.focus() }
  }, [full])
  const copy = async () => {
    if (await copyText(`${VENUE.nameJa}\n${VENUE.addressJa}`)) toast(t.driver.copied)
  }
  return (
    <>
      <section aria-labelledby="driver" className="flex flex-col gap-3 rounded-md bg-section-alt p-4 md:p-6">
        <h2 id="driver" className="label-caps text-muted-foreground">{t.driver.label}</h2>
        <p className="flex flex-col"><span className="font-semibold text-foreground">{VENUE.name}</span><span lang="ja" className="font-ja">{VENUE.nameJa}</span></p>
        <p>{t.driver.fare}</p>
        <div className="flex flex-wrap gap-3">
          <Button ref={opener} size="lg" onClick={() => setFull(true)}>{t.driver.show}</Button>
          <Button size="lg" variant="outline" onClick={copy}><Copy aria-hidden />{t.driver.copy}</Button>
        </div>
      </section>
      {full && (
        <div role="dialog" aria-modal="true" aria-labelledby="driver-full" className="driver-full fixed inset-0 z-[70] flex flex-col bg-(--brand-paper-bright) p-6 text-(--brand-ink-deep)">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center" lang="ja">
            <p id="driver-full" className="font-ja text-[clamp(1.75rem,6vw,3rem)] text-(--brand-doro)">{VENUE.please}</p>
            <p className="font-ja text-[clamp(2.25rem,9vw,5rem)] leading-tight">{VENUE.nameJa}</p>
            <p className="font-ja text-[clamp(1.5rem,5vw,3rem)] leading-snug">{VENUE.addressJa}</p>
            <p lang="en" className="text-lg text-(--brand-kuri)">{t.driver.english}</p>
          </div>
          <Button ref={done} size="lg" className="mx-auto w-full max-w-sm" onClick={() => setFull(false)}>{t.driver.done}</Button>
        </div>
      )}
    </>
  )
}
