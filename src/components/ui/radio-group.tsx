import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Radio group (Open UI, WAI-ARIA APG radio group) as a segmented pair: one choice of a few, each option a whole
 * 48px-tall half of the row. Native radios underneath, so Tab lands on the chosen one (or the first), the arrow keys
 * move and choose, Space chooses, and screen readers hear "radio button, 1 of 2, checked". Unchosen options have a
 * field's border; the chosen one fills, takes a 2px accent line and a tick (never colour alone). The group's id is
 * where "Next" moves focus when it's missing (its first radio).
 */
export function RadioGroup<T extends string>({ id, name, label, value, onChange, options, invalid, describedBy, className }: {
  id: string; name: string; label: ReactNode; value: T | "" | null | undefined; onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]; invalid?: boolean; describedBy?: string; className?: string
}) {
  return (
    <div id={id} role="radiogroup" aria-labelledby={`${id}-label`} aria-required="true" aria-invalid={invalid || undefined} aria-describedby={describedBy}
      className={cn("radio-group", className)}>
      <span id={`${id}-label`} className="radio-group-label">{label}</span>
      <div className="radio-group-options">
        {options.map((o) => {
          const on = value === o.value
          return (
            <label key={o.value} className="radio-option" data-selected={on || undefined} data-invalid={invalid || undefined}>
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              <Check aria-hidden className={cn("radio-option-tick size-5", !on && "invisible")} />
              <span>{o.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
