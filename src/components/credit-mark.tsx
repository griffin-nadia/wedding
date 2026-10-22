import { useEffect, useRef, useState } from "react"
import { useLang } from "@/lib/lang"
import { BrandSeal } from "@/components/brand-seal"
import { Colophon } from "@/components/colophon"

/**
 * The credit (run 19, the colophon since run 25): laptops only, fixed at the very bottom left on every page. Nadia's
 * seal, faint; hover or focus reveals the colophon above it, and a click keeps it open (a disclosure: the seal is the
 * button, Escape or a click elsewhere closes it). Phones have the colophon at the end of FAQs.
 */
export function CreditMark() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); box.current?.querySelector("button")?.focus() } }
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    addEventListener("keydown", key); addEventListener("pointerdown", away)
    return () => { removeEventListener("keydown", key); removeEventListener("pointerdown", away) }
  }, [open])
  return (
    <div ref={box} className="credit-mark" data-open={open || undefined}>
      <button type="button" aria-expanded={open} aria-controls="credit-colophon" onClick={() => setOpen((o) => !o)} className="credit-button">
        <BrandSeal className="credit-seal" sizes="24px" />
        <span className="sr-only">{t.qa.colophon.label}</span>
      </button>
      <div id="credit-colophon" className="credit-text"><Colophon className="credit-lines" /></div>
    </div>
  )
}
