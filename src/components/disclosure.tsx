import type { ReactNode } from "react"
import { Accordion } from "@/components/ui/accordion"

/** Accordion: one open at a time everywhere (Jehan, 6 Oct). */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  return <Accordion type="single" collapsible aria-label={label}>{children}</Accordion>
}
