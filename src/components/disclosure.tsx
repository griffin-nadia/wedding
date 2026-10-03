import { useEffect, useState, type ReactNode } from "react"
import { Accordion } from "@/components/ui/accordion"
import { useOption } from "@/lib/options"

/** Accordion that keeps one open at a time on phones and lets any open from 768. */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 768px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  // Options → FAQs: one open at a time everywhere, the quiet version
  const one = useOption("faq") === "one"
  return wide && !one
    ? <Accordion type="multiple" aria-label={label}>{children}</Accordion>
    : <Accordion type="single" collapsible aria-label={label}>{children}</Accordion>
}
