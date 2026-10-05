import { useEffect, useState, type ReactNode } from "react"
import { Accordion } from "@/components/ui/accordion"
import { useOption } from "@/lib/options"

/** Accordion: one open at a time everywhere (Jehan, 6 Oct). Options > FAQs can put laptops back to any-open. */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 768px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  // Options > FAQs: "many" brings back any-number-open on laptops
  const many = useOption("faq") === "many"
  return wide && many
    ? <Accordion type="multiple" aria-label={label}>{children}</Accordion>
    : <Accordion type="single" collapsible aria-label={label}>{children}</Accordion>
}
